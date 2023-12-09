import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { privateProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { z } from "zod";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { absolutePath } from "@/lib/utils";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import OpenAI from "openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { getPineconeClient } from "@/lib/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PDFDocument } from "pdf-lib";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user || !user.id || !user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    // check if the user is in the database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      // create user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }
    return { success: true };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.files.findMany({
      where: {
        userId: userId,
      },
    });
  }),
  deleteFile: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = db.files.findUnique({
        where: {
          id: input.id,
          userId: userId,
        },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db.files.delete({
        where: {
          id: input.id,
          userId: userId,
        },
      });

      return file;
    }),
  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.files.findFirst({
        where: {
          key: input.key,
          userId: userId,
        },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return file;
    }),
  getFileStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { fileId } = input;

      const file = await db.files.findUnique({
        where: {
          id: fileId,
          userId: ctx.userId,
        },
      });

      if (!file) {
        return { status: "PENDING" as const };
      }

      return { status: file.uploadStatus };
    }),
  getFileMessage: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      const file = await db.files.findUnique({
        where: {
          id: fileId,
          userId: userId,
        },
      });

      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const messages = await db.message.findMany({
        where: {
          fileId: fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });

      let nextPageCursor: typeof cursor | null | undefined = undefined;
      if (messages.length > limit) {
        nextPageCursor = messages[messages.length - 1].id;
        messages.pop();
      }

      return { messages, nextPageCursor };
    }),
  createCheckoutSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const billingUrl = absolutePath("/dashboard/billing");

    const dbUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!dbUser) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const subscriptionPlan = await getUserSubscriptionPlan();
    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });
      return { url: stripeSession.url };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: SUBSCRIPTION_PLANS.find((plan) => plan.name === "Pro")?.price
            .priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
    });

    return { url: stripeSession.url };
  }),
  checkOpenApiKey: privateProcedure
    .input(
      z.object({
        openApiKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(input.openApiKey);
      try {
        const openai = new OpenAI({
          apiKey: input.openApiKey,
        });

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "this message is just to check availability of the api key, you dont need to answer anything",
            },
          ],
        });

        console.log(response.choices[0].message, input.openApiKey);
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }),
  startProcessing: privateProcedure
    .input(
      z.object({
        openai_api_key: z.string(),
        fileId: z.string(),
        key: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { openai_api_key, fileId, key } = input;
      try {
        const response = await fetch(
          `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${key}`
        );
        const { isSubscribed } = await getUserSubscriptionPlan();
        const blob = await response.blob();

        //changing title as no namespace is allowed in free tire
        const pdfDoc = await PDFDocument.load(await blob.arrayBuffer());

        // Change the title
        pdfDoc.setTitle(fileId);

        // Save the PDF with the modified title
        const modifiedPdfBytes = await pdfDoc.save();

        // If you need a Blob instead of bytes
        const modifiedPdfBlob = new Blob([modifiedPdfBytes], {
          type: "application/pdf",
        });

        const loader = new PDFLoader(modifiedPdfBlob);
        const docs = await loader.load();
        const pagesAmt = docs.length;
        const planName = isSubscribed ? "Pro" : "Free";

        const pagesAllowed = SUBSCRIPTION_PLANS.find(
          (plan) => plan.name === planName
        )!.pagesPerPdf;

        const pagesExceeded = pagesAmt > pagesAllowed;

        if (pagesExceeded) {
          throw new Error();
        }

        if (!openai_api_key) {
          throw new Error();
        }
        //encoding it to vector
        const pinecone = await getPineconeClient();
        const pineconeIndex = pinecone.Index("chat-guru");

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: openai_api_key,
        });

        await PineconeStore.fromDocuments(docs, embeddings, {
          pineconeIndex,
          namespace: fileId,
        });

        await db.files.update({
          where: {
            id: fileId,
          },
          data: {
            uploadStatus: "SUCCESS",
          },
        });
      } catch (error) {
        console.log("pinecone error:", error);
        await db.files.update({
          where: {
            id: fileId,
          },
          data: {
            uploadStatus: "FAILED",
          },
        });
      }
      return { success: true };
    }),
});
export type AppRouter = typeof appRouter;
