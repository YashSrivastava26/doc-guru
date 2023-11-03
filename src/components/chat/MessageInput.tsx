import { FC, useContext, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2, SendIcon } from "lucide-react";
import { ChatContext } from "./ChatContext";

interface MessageInputProps {
  isDisabled?: boolean;
}

const MessageInput: FC<MessageInputProps> = ({ isDisabled }) => {
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext);
  const InputAreaRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="absolute w-full bottom-0 left-0">
      <div className="flex flex-col gap-3 mx-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
        <div className="relative flex items-stretch md:flex-col h-full flex-1">
          <div className="relative flex flex-col w-full flex-grow p-4">
            <div className="relative">
              <Textarea
                ref={InputAreaRef}
                placeholder="Enter your Questions..."
                rows={1}
                maxRows={4}
                autoFocus
                onChange={handleInputChange}
                value={message}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addMessage();

                    InputAreaRef.current?.focus();
                  }
                }}
                className="resize-none text-base pr-12 py-3 scrollbar-thumb-primary scrollbar-thumb-rounded scrollbar-track-secondary scrollbar-w-2 scrolling-touch"
              />
              <Button
                aria-label="send message"
                className="absolute bottom-1.5 right-2"
                disabled={isLoading || isDisabled}
                onClick={(e) => {
                  e.preventDefault();
                  addMessage();

                  InputAreaRef.current?.focus();
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
