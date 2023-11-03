import { cn } from "@/lib/utils";
import { ExtendedMessage } from "@/types/message";
import { format } from "date-fns";
import { Bot, User } from "lucide-react";
import React, { FC, forwardRef } from "react";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  message: ExtendedMessage;
  isNextMessageFromSameUser: boolean;
}

const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageFromSameUser }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-end", {
          "justify-end": message.isUserMessage,
        })}
      >
        <div
          className={cn(
            "relative flex items-center justify-center h-8 w-8 aspect-square",
            {
              "bg-primary order-2 rounded-sm": message.isUserMessage,
              "bg-muted-foreground order-1 rounded-sm": !message.isUserMessage,
              invisible: isNextMessageFromSameUser,
            }
          )}
        >
          {message.isUserMessage ? (
            <User className=" h-3/4 w-3/4 fill-zinc-200 text-zinc-200" />
          ) : (
            <Bot className="h-3/4 w-3/4 fill-muted" />
          )}
        </div>

        <div
          className={cn("flex flex-col space-y-2 max-w-md mx-2", {
            "items-end order-1": message.isUserMessage,
            "items-start order-2": !message.isUserMessage,
          })}
        >
          <div
            className={cn("rounded-lg inline-block px-2 py-4", {
              "bg-primary text-zinc-200": message.isUserMessage,
              "bg-muted-foreground text-zinc-300": !message.isUserMessage,
              "rounded-br-none":
                !isNextMessageFromSameUser && message.isUserMessage,
              "rounded-bl-none":
                !isNextMessageFromSameUser && !message.isUserMessage,
            })}
          >
            {typeof message.text === "string" ? (
              <ReactMarkdown
                className={cn("prose", {
                  "text-zinc-50": message.isUserMessage,
                })}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
              message.text
            )}
            {message.id !== "loading" ? (
              <div
                className={cn("select-none mt-2 w-full text-xs text-right ", {
                  "text-muted": !message.isUserMessage,
                  "text-white": message.isUserMessage,
                })}
              >
                {format(new Date(message.createdAt), "HH:mm")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

Message.displayName = "Message";

export default Message;
