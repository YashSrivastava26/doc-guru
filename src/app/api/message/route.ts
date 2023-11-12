import { db } from "@/db";
import { getPineconeClient } from "@/lib/pinecone";
import { sendMessageValidator } from "@/lib/validators/sendMessage";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextRequest } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";

export const POST = async (req: NextRequest) => {
  // route /api/message

  const body = await req.json();
  const { getUser } = getKindeServerSession();
  const user = getUser();

  const OPENAI_API_KEY = req.nextUrl.searchParams.get("openai_api_key");

  if (!OPENAI_API_KEY) {
    return new Response("Incorrect OPENAI_API_KEY", { status: 403 });
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  if (!user || !user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message, fileId } = sendMessageValidator.parse(body);

  const file = await db.files.findUnique({
    where: {
      id: fileId,
      userId: user.id,
    },
  });

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

  //getting contend with vector DB

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const pinecone = await getPineconeClient();
  const pineconeIndex = pinecone.Index("chat-guru");

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  const result = await vectorStore.similaritySearch(
    "Innover Digital Recruitment Drive-Online Test on 16th Oct'2023 for 2024 Graduating Batch",
    1,
    {
      "pdf.info.Title": file.id,
    }
  );

  const prevMessage = await db.message.findMany({
    where: {
      fileId: file.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 1,
  });

  const formattedPrevMessage = prevMessage.map((message) => ({
    role: message.isUserMessage ? ("user" as const) : ("assistant" as const),
    content: message.text,
  }));

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

  // streaming response
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

  //non streaming response so vercel do not timeout
};
