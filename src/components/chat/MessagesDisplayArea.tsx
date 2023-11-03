import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { Loader2, MessageSquare } from "lucide-react";
import { FC, useContext, useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Message from "./Message";
import { ChatContext } from "./ChatContext";
import { useIntersection } from "@mantine/hooks";

interface MessagesDisplayAreaProps {
  fileId: string;
}

const MessagesDisplayArea: FC<MessagesDisplayAreaProps> = ({ fileId }) => {
  const { isLoading: isAIAnswerLoading } = useContext(ChatContext);

  const {
    data,
    isLoading,
    fetchNextPage: getMoreMessages,
  } = trpc.getFileMessage.useInfiniteQuery(
    { fileId, limit: INFINITE_QUERY_LIMIT },
    {
      getNextPageParam: (lastPage) => {
        return lastPage?.nextPageCursor;
      },
      keepPreviousData: true,
    }
  );

  const messages = data?.pages.flatMap((page) => page.messages);

  const loadingMessages = {
    createdAt: new Date().toISOString(),
    id: "loading",
    isUserMessage: false,
    text: (
      <span className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </span>
    ),
  };

  const loadedMessages = [
    ...(isAIAnswerLoading ? [loadingMessages] : []),
    ...(messages ?? []),
  ];

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const { ref: intersetingRef, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      getMoreMessages();
    }
  }, [entry, getMoreMessages]);

  return (
    <div className="flex flex-col-reverse gap-4 p-3 border-zinc-200 max-h-[calc(100vh-10.5rem)] overflow-y-auto scrollbar-thumb-primary scrollbar-thumb-rounded scrollbar-track-secondary scrollbar-w-2">
      {loadedMessages && loadedMessages.length > 0 ? (
        loadedMessages.map((msg, idx) => {
          const isNextMessageFromSameUser =
            idx > 0 &&
            loadedMessages[idx - 1].isUserMessage === msg.isUserMessage;

          if (idx === loadedMessages.length - 1) {
            return (
              <Message
                ref={intersetingRef}
                key={msg.id}
                isNextMessageFromSameUser={isNextMessageFromSameUser}
                message={msg}
              />
            );
          } else {
            return (
              <Message
                key={msg.id}
                isNextMessageFromSameUser={isNextMessageFromSameUser}
                message={msg}
              />
            );
          }
        })
      ) : isLoading ? (
        <div className="flex flex-col gap-2 w-full">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <MessageSquare className="h-16 w-16 text-primary/60" />
          <h3 className="font-semibold text-xl">You&apos;re all set</h3>
          <p className="text-zinc-500 text-sm">
            Ask your questions to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesDisplayArea;
