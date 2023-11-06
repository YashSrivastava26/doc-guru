import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getUserSubscriptionPlan } from "@/lib/stripe";
const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = getUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  const subscription = await getUserSubscriptionPlan();
  return { userId: user.id, subscription };
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
  await db.files.create({
    data: {
      key: file.key,
      userId: metadata.userId,
      name: file.name,
      fileUrl: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });
};
export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
