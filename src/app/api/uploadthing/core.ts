import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getPineconeClient } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PDFDocument } from "pdf-lib";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { z } from "zod";
const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

const middleware = async ({ input }: { input: { openai_api_key: string } }) => {
  const { getUser } = getKindeServerSession();
  const user = getUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  const subscription = await getUserSubscriptionPlan();
  return { userId: user.id, subscription, openAIApiKey: input.openai_api_key };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExists = await db.files.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExists) {
    return;
  }
  const createdFile = await db.files.create({
    data: {
      key: file.key,
      userId: metadata.userId,
      name: file.name,
      fileUrl: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  try {
    const response = await fetch(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
    );

    const blob = await response.blob();

    //changing title as no namespace is allowed in free tire
    const pdfDoc = await PDFDocument.load(await blob.arrayBuffer());

    // Change the title
    pdfDoc.setTitle(createdFile.id);

    // Save the PDF with the modified title
    const modifiedPdfBytes = await pdfDoc.save();

    // If you need a Blob instead of bytes
    const modifiedPdfBlob = new Blob([modifiedPdfBytes], {
      type: "application/pdf",
    });

    const loader = new PDFLoader(modifiedPdfBlob);
    const docs = await loader.load();
    const pagesAmt = docs.length;
    const { subscription } = metadata;
    const { isSubscribed } = subscription;
    const planName = isSubscribed ? "Pro" : "Free";

    const pagesAllowed = SUBSCRIPTION_PLANS.find(
      (plan) => plan.name === planName
    )!.pagesPerPdf;

    const pagesExceeded = pagesAmt > pagesAllowed;

    if (pagesExceeded) {
      throw new Error("PAGE_LIMIT_EXCEEDED");
    }

    if (!metadata.openAIApiKey) {
      throw new Error("INVALID_OPENAI_API_KEY");
    }

    //encoding it to vector
    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("chat-guru");

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: metadata.openAIApiKey,
    });

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
    });
    await new Promise((resolve) => setTimeout(resolve, 5000)); //
    await db.files.update({
      where: {
        id: createdFile.id,
      },
      data: {
        uploadStatus: "SUCCESS",
      },
    });
  } catch (error) {
    console.log("pinecone error:", error);
    await db.files.update({
      where: {
        id: createdFile.id,
      },
      data: {
        uploadStatus: "FAILED",
      },
    });
  }
};
export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    .input(z.object({ openai_api_key: z.string() }))
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    .input(z.object({ openai_api_key: z.string() }))
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
