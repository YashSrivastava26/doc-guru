import ChatViewer from "@/components/chat/ChatViewer";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/db";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: {
    fileId: string;
  };
}

const page: FC<pageProps> = async ({ params }) => {
  const { fileId } = params;

  const { getUser } = getKindeServerSession();
  const user = getUser();

  if (!user || !user.id) {
    redirect(`/auth-callback?origin=dashboard/${fileId}`);
  }

  const subscription = await getUserSubscriptionPlan();

  //fetching file
  const file = await db.files.findUnique({
    where: {
      id: fileId,
      userId: user.id,
    },
  });

  if (!file) {
    notFound();
  }

  return (
    <div className="flex flex-col justify-between flex-1 h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-8xl grow lg:flex   xl:px-2 w-full">
        {/* PDF SIDE */}

        <div className="xl:flex flex-1">
          <div className="py-6 lg:pl-8 xl:pl-6 px-4 sm:px-6 xl:flex-1">
            <PDFViewer url={file.fileUrl} />
          </div>
        </div>
        <div className="shrink-0 flex-[0.75] border-t border-t-gray-200 lg:border-l lg:border-t-0 lg:w-96 ">
          <ChatViewer
            fileId={fileId}
            isSubscribed={subscription.isSubscribed}
          />
        </div>
      </div>
    </div>
  );
};

export default page;
