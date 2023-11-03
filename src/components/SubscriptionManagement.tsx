"use client";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { FC } from "react";
import { useToast } from "./ui/use-toast";
import { trpc } from "@/app/_trpc/client";
import MaxWidthWraper from "./MaxWidthWraper";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, Zap } from "lucide-react";
import { format } from "date-fns";

interface SubscriptionManagementProps {
  subscription: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

const SubscriptionManagement: FC<SubscriptionManagementProps> = ({
  subscription,
}) => {
  const { toast } = useToast();

  const { mutate: createCheckoutSession, isLoading } =
    trpc.createCheckoutSession.useMutation({
      onSuccess: ({ url }) => {
        if (url) {
          window.location.href = url;
        } else {
          toast({
            title: "Error in loading PDF",
            description: "please try again",
            variant: "destructive",
          });
        }
      },
    });
  console.log(subscription);
  return (
    <MaxWidthWraper className="max-w-6xl">
      <form
        className="mt-12"
        onSubmit={(e) => {
          e.preventDefault();
          createCheckoutSession();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              You are on the currently on the{" "}
              <strong>{subscription.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col items-start md:flex-row md:justify-between space-y-2 md:space-x-0">
            {isLoading ? (
              <Button type="submit">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-5" />
                ) : null}
              </Button>
            ) : subscription.isSubscribed ? (
              <Button type="submit">Manage Subscription</Button>
            ) : (
              <>
                <Button className="font-bold text-white transition bg-gradient-to-tr from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600">
                  Upgrade
                  <Zap className="fill-white ml-2" />
                </Button>
                <p className="">
                  {subscription.isCanceled
                    ? "Your plan will be canceled on: "
                    : "Your plan will be renew on: "}
                  {format(
                    subscription.stripeCurrentPeriodEnd as Date,
                    "dd-MM-YYY"
                  )}
                </p>
              </>
            )}
          </CardFooter>
        </Card>
      </form>
    </MaxWidthWraper>
  );
};

export default SubscriptionManagement;
