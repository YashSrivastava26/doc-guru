import { AppRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

type Message = RouterOutput["getFileMessage"]["messages"];

type OmitText = Omit<Message[number], "text">;

export type ExtendedMessage = OmitText & {
  text: string | React.JSX.Element;
};
