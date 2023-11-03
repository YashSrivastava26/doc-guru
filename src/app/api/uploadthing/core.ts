import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getPineconeClient } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PDFDocument } from "pdf-lib";
const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession();
      const user = getUser();

      if (!user) {
        throw new Error("UNAUTHORIZED");
      }
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
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
        console.log(docs[0].metadata?.pdf);
        //encoding it to vector
        const pinecone = await getPineconeClient();
        const pineconeIndex = pinecone.Index("chat-guru");

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
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
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
