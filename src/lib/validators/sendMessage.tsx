import { z } from "zod";

export const sendMessageValidator = z.object({
  message: z.string(),
  fileId: z.string(),
});

export type SendMessageValidatorType = z.infer<typeof sendMessageValidator>;
