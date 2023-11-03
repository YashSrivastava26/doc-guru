import { db } from "@/db";
import { openai } from "@/lib/openai";
import { getPineconeClient } from "@/lib/pinecone";
import { sendMessageValidator } from "@/lib/validators/sendMessage";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";

export async function POST(req: NextResponse) {
  // route /api/message

  try {
    const body = await req.json();
    const { getUser } = getKindeServerSession();
    const user = getUser();
    // console.log("user", user);
    if (!user || !user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { message, fileId } = sendMessageValidator.parse(body);
    // console.log(message, fileId);
    const file = await db.files.findUnique({
      where: {
        id: fileId,
        userId: user.id,
      },
    });

    // console.log(file);

    if (!file) {
      return new Response("Not Found", { status: 404 });
    }

    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        fileId: file.id,
        userId: user.id,
      },
    });
    // console.log("542182");
    //getting contend with vector DB

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    // console.log("test1");
    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("chat-guru");

    // console.log("test2");
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });
    // console.log("test3");
    const result = await vectorStore.similaritySearch(
      "Innover Digital Recruitment Drive-Online Test on 16th Oct'2023 for 2024 Graduating Batch",
      4,
      {
        "pdf.info.Title": file.id,
      }
    );
    // console.log("test4");

    // console.log("111");
    const prevMessage = await db.message.findMany({
      where: {
        fileId: file.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 7,
    });
    // console.log("prevMessage", prevMessage);
    const formattedPrevMessage = prevMessage.map((message) => ({
      role: message.isUserMessage ? ("user" as const) : ("assistant" as const),
      content: message.text,
    }));
    // console.log("object1111");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.",
        },
        {
          role: "user",
          content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
          
          \n----------------\n
    
          PREVIOUS CONVERSATION:
          ${formattedPrevMessage.map((message) => {
            if (message.role === "user") return `User: ${message.content}\n`;
            return `Assistant: ${message.content}\n`;
          })}
          
          \n----------------\n
          
          CONTEXT:
          ${result.map((r) => r.pageContent).join("\n\n")}
          
          USER INPUT: ${message}`,
        },
      ],
    });

    // console.log("2222222222");
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        await db.message.create({
          data: {
            text: completion,
            isUserMessage: false,
            fileId: file.id,
            userId: user.id,
          },
        });
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.log("error", error);
  }
}
