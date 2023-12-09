"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { openai } from "@/lib/openai";
import { cn } from "@/lib/utils";
import { set } from "date-fns";
import { FC, ReactNode, useEffect, useState } from "react";
import { trpc } from "../_trpc/client";
import { Loader2 } from "lucide-react";

interface layoutProps {
  children: ReactNode;
}

const Layout: FC<layoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openai_api_key, setOpenai_api_key] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  const { mutate: checkOpenApiKey, isLoading } =
    trpc.checkOpenApiKey.useMutation({
      onSuccess: ({ success }) => {
        if (success) {
          localStorage.setItem("openai_api_key", openai_api_key);
          setIsOpen(false);
        } else {
          setError(true);
        }
      },
    });

  const handleApiChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setOpenai_api_key(event.target.value);

  useEffect(() => {
    const apiKey = localStorage.getItem("openai_api_key");
    if (apiKey === null) {
      setIsOpen(true);
    } else {
      setOpenai_api_key(apiKey);
      setIsOpen(false);
    }
  }, []);

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setError(false);

    checkOpenApiKey({
      openApiKey: openai_api_key,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="mx-auto max-w-7xl md:px-10 py-2 flex justify-end">
            <Button className="text-sm" size="sm" variant="link">
              Change OpenAi api key
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent closeDisabled>
          <DialogDescription>
            <h4 className="text-secondary-foreground text-lg">
              This is a demo App. Please enter OPENAI api key
            </h4>
            <Textarea
              placeholder="Please enter OPENAI api key"
              onChange={handleApiChange}
              value={openai_api_key}
              className={cn({ "border-red-500": error })}
            />
            <div>
              please make sure your api key have higher rate limited and tokens
              pre minute limit.
            </div>
            <div
              className={cn("text-xs", {
                "text-destructive-foreground": error,
                "text-transparent": !error,
              })}
            >
              the api key is not valid
            </div>
            <Button onClick={handleSubmit}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add"}
            </Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
};

export default Layout;
