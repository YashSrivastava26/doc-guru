"use client";
import { FC } from "react";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

interface UpgradeButtonProps {}

const UpgradeButton: FC<UpgradeButtonProps> = ({}) => {
  const { mutate: createCheckoutSession } =
    trpc.createCheckoutSession.useMutation({
      onSuccess: ({ url }) => {
        window.location.href = url ?? "/dashboard/billing";
      },
    });
  return (
    <Button
      onClick={() => createCheckoutSession()}
      className=" w-full font-bold text-white transition bg-gradient-to-tr from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
    >
      Upgrade
      <Zap className="fill-white ml-2" />
    </Button>
  );
};

export default UpgradeButton;
