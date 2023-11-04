"use client";
import { FC } from "react";
import MessagesDisplayArea from "./MessagesDisplayArea";
import MessageInput from "./MessageInput";
import { trpc } from "@/app/_trpc/client";
import { ChatLoader } from "../Loaders";
import { ChatViewerErrorState } from "../ErrorState";
import { ChatContextProvider } from "./ChatContext";

interface ChatViewerProps {
  fileId: string;
  isSubscribed: boolean;
}

const ChatViewer: FC<ChatViewerProps> = ({ fileId, isSubscribed }) => {
  const { data, isLoading } = trpc.getFileStatus.useQuery(
    {
      fileId: fileId,
    },
    {
      refetchInterval: (data) => {
        if (data?.status === "PENDING" || data?.status === "PROCESSING") {
          return 1000;
        }
        return false;
      },
    }
  );

  if (isLoading) {
    return <ChatLoader message="Loading" />;
  }
  if (data?.status === "PROCESSING") {
    return <ChatLoader message="Processing" />;
  }
  if (data?.status === "FAILED") {
    return <ChatViewerErrorState isSubscribed={isSubscribed} />;
  }

  return (
    <ChatContextProvider fileId={fileId}>
      <div className="relative bg-zinc-50 flex flex-col justify-between gap-2 min-h-full divide-y divide-zinc-300">
        <div className="flex flex-col flex-1 justify-between mb-28">
          <MessagesDisplayArea fileId={fileId} />
        </div>

        <MessageInput />
      </div>
    </ChatContextProvider>
  );
};

export default ChatViewer;
