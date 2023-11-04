import { ChevronLeft, XCircle } from "lucide-react";
import MessageInput from "./chat/MessageInput";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { FC } from "react";

interface ChatViewerErrorStateProps {
  isSubscribed: boolean;
}
export const ChatViewerErrorState: FC<ChatViewerErrorStateProps> = ({
  isSubscribed,
}) => {
  return (
    <div className="relative flex flex-col justify-between gap-2 divide-y divide-zinc-300 bg-zinc-50 min-h-full">
      <div className="flex justify-center items-center flex-col flex-1 mb-28">
        <div className="flex flex-col items-center gap-2">
          <XCircle className="h-9 w-9 text-destructive-foreground opacity-70" />
          <h3 className="font-semibold text-xl">Too many Pages in PDF</h3>
          <p className="text-sm text-zinc-500">
            your{" "}
            <span className="font-medium">{isSubscribed ? "Pro" : "Free"}</span>{" "}
            plan supports upto {isSubscribed ? "10 " : "5 "}
            pages per PDF
          </p>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({
                variant: "secondary",
              }),
              "mt-4"
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Go back to dashboard
          </Link>
        </div>
      </div>

      <MessageInput isDisabled />
    </div>
  );
};
