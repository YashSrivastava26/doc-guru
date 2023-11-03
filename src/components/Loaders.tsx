import { Loader2 } from "lucide-react";
import MessageInput from "./chat/MessageInput";

export const PDFLoader = () => {
  return (
    <div className="flex justify-center">
      <Loader2 className="my-24 h-6 w-6 animate-spin" />
    </div>
  );
};

interface ChatLoaderProps {
  message: string;
}

export const ChatLoader = ({ message }: ChatLoaderProps) => {
  return (
    <div className="relative flex flex-col justify-between gap-2 divide-y divide-zinc-300 bg-zinc-50 min-h-full">
      <div className="flex justify-center items-center flex-col flex-1 mb-28">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <h3 className="font-semibold text-xl">{message}...</h3>
          <p className="text-sm text-zinc-500">We&apos;re preparing your PDF</p>
        </div>
      </div>

      <MessageInput isDisabled />
    </div>
  );
};
