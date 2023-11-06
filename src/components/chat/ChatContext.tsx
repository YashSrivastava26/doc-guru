import { FC, createContext, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";

interface ChatContextType {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}

export const ChatContext = createContext<ChatContextType>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

interface ChatContextProviderProps {
  fileId: string;
  children: React.ReactNode;
}

export const ChatContextProvider = ({
  fileId,
  children,
}: ChatContextProviderProps) => {
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const utils = trpc.useContext();
  const backupMessage = useRef<string>("");

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch(
        `/api/message?openai_api_key=${localStorage.getItem("openai_api_key")}`,
        {
          method: "POST",
          body: JSON.stringify({ message, fileId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.body;
    },

    onMutate: async ({ message }) => {
      backupMessage.current = message;
      setMessage("");

      //cancle all outbound requests
      await utils.getFileMessage.cancel();

      const previousMessage = utils.getFileMessage.getInfiniteData();

      utils.getFileMessage.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (old) => {
          if (!old) return { pages: [], pageParams: [] };

          let newPages = [...old.pages];

          let latestPage = newPages[0];
          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;

          return {
            ...old,
            pages: newPages,
          };
        }
      );
      setIsLoading(true);

      return {
        previousMessage:
          previousMessage?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    onSuccess: async (stream) => {
      setIsLoading(false);

      if (!stream) {
        return toast({
          title: "Something went wrong",
          description: "Please try again later",
          variant: "destructive",
        });
      }
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      //accumalated response
      let accumalatedResponse = "";

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;

        const chunk = decoder.decode(value);

        accumalatedResponse += chunk;

        //append chunk to the last message
        utils.getFileMessage.setInfiniteData(
          { fileId, limit: INFINITE_QUERY_LIMIT },
          (old) => {
            if (!old) return { pages: [], pageParams: [] };

            let isAIResponse = old.pages.some((page) =>
              page.messages.some((msg) => msg.id === "ai-response")
            );

            let updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let latestMessage;

                if (!isAIResponse) {
                  latestMessage = [
                    {
                      createdAt: new Date().toISOString(),
                      id: "ai-response",
                      text: accumalatedResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ];
                } else {
                  latestMessage = page.messages.map((msg) => {
                    if (msg.id === "ai-response") {
                      return {
                        ...msg,
                        text: accumalatedResponse,
                      };
                    }
                    return msg;
                  });
                }

                return { ...page, messages: latestMessage };
              }
              return page;
            });

            return { ...old, pages: updatedPages };
          }
        );
      }
    },
    onError: (_, __, context) => {
      setMessage(backupMessage.current);
      utils.getFileMessage.setData(
        { fileId },
        { messages: context?.previousMessage ?? [] }
      );
      return toast({
        title: "Something went wrong",
        description: "Please make sure you have entered valid api key",
        variant: "destructive",
      });
    },
    onSettled: async (stream) => {
      setIsLoading(false);

      await utils.getFileMessage.invalidate({ fileId });
    },
  });

  const addMessage = () => sendMessage({ message });
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(event.target.value);
  return (
    <ChatContext.Provider
      value={{ addMessage, message, handleInputChange, isLoading }}
    >
      {children}
    </ChatContext.Provider>
  );
};
