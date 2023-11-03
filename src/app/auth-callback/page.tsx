"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { FC } from "react";
import { trpc } from "../_trpc/client";
import { Loader2 } from "lucide-react";

interface PageProps {}

const Page: FC<PageProps> = ({}) => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");

  const { error } = trpc.authCallback.useQuery(undefined, {
    onSuccess: ({ success }) => {
      if (success) {
        // user is synced to db
        router.push(origin ? `/${origin}` : "/dashboard");
      }
    },
    retry(failureCount, error) {
      if (error?.data?.code === "UNAUTHORIZED" || failureCount > 5) {
        router.push("/sign-in");
        return false;
      }
      return true;
    },
    retryDelay: 500,
  });

  if (error?.data) {
    router.push("/sign-in");
  }
  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex items-center gap-2 flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-800" />
        <h1 className="font-semibold text-xl">Setting up your account...</h1>
        <p>you will be redirected automatically.</p>
      </div>
    </div>
  );
};

export default Page;
