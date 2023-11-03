import MaxWidthWraper from "@/components/MaxWidthWraper";
import UpgradeButton from "@/components/UpgradeButton";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { subscriptionPlansDetails } from "@/constants/subscription_plans";
import { cn } from "@/lib/utils";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, Check, HelpCircle, Minus } from "lucide-react";
import Link from "next/link";

import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = ({}) => {
  const { getUser } = getKindeServerSession();
  const user = getUser();

  return (
    <>
      <MaxWidthWraper className="text-center max-w-5xl mb-8 mt-24">
        <div className="mx-auto mb-10 sm:max-w-lg">
          <h1 className="font-bold text-6xl sm:text-7xl">Our Plans</h1>
          <p className="mt-5 text-gray-600 sm:text-lg">
            Choose a plan which best suits your requirements. If you need a
            custom plan, please contact us.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-12">
          <TooltipProvider>
            {subscriptionPlansDetails.map(
              ({ plan, tagline, quota, features }) => {
                const price =
                  SUBSCRIPTION_PLANS.find((p) => p.slug === plan.toLowerCase())
                    ?.price.amount || 0;

                return (
                  <div
                    key={plan}
                    className={cn("rounded-3xl bg-white shadow-xl relative", {
                      "border-2 border-primary/60 shadow-primary/20":
                        plan === "Pro",
                      "border border-muted-foreground": plan !== "Pro",
                    })}
                  >
                    {plan === "Pro" ? (
                      <div className="absolute -top-5 right-0 left-0 w-32 rounded-full mx-auto bg-gradient-to-r from-primary to-blue-500 p-2 text-sm font-medium text-white">
                        Upgrade Now
                      </div>
                    ) : null}

                    <div className="p-5">
                      <h3 className="my-3 text-center text-3xl font-bold">
                        {plan}
                      </h3>
                      <p className="text-muted-foreground">{tagline}</p>
                      <p className="my-5 text-6xl text-secondary-foreground">
                        {price === 0 ? "Free" : `${price} INR`}
                      </p>
                      <p className="text-muted-foreground">per month</p>
                    </div>

                    <div className="flex items-center justify-center border-b border-t border-muted bg-muted h-20">
                      <div className="flex items-center space-x-1">
                        <p>{quota.toLocaleString()} PDFs pre month</p>

                        <Tooltip delayDuration={500}>
                          <TooltipTrigger className="cursor-default ml-1.5">
                            <HelpCircle className="w-5 h-5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="w-80 p-2">
                            How many PDFs you can upload per month.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <ul className="px-8 my-10 space-y-5">
                      {features.map(({ text, footnote, negative }) => {
                        return (
                          <li
                            key={text}
                            className="flex items-center space-x-5"
                          >
                            <div className="flex-shrink-0">
                              {negative ? (
                                <Minus className="h-5 w-5 text-muted-foreground " />
                              ) : (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            {footnote ? (
                              <div className="flex items-center space-x-1">
                                <p
                                  className={cn("text-secondary-foreground", {
                                    "text-muted-foreground": negative,
                                  })}
                                >
                                  {text}
                                  <Tooltip delayDuration={500}>
                                    <TooltipTrigger className="cursor-default ml-1.5">
                                      <HelpCircle className="w-4 h-4 text-muted-foreground fill-muted" />
                                    </TooltipTrigger>
                                    <TooltipContent className="w-80 p-2">
                                      {footnote}
                                    </TooltipContent>
                                  </Tooltip>
                                </p>
                              </div>
                            ) : (
                              <p
                                className={cn("text-secondary-foreground", {
                                  "text-muted-foreground": negative,
                                })}
                              >
                                {text}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    <Separator className="bg-muted-foreground/20" />

                    <div className="p-3">
                      {plan === "Free" ? (
                        <Link
                          href={user ? "/dashboard" : "/sign-in"}
                          className={buttonVariants({
                            className: "w-full",
                            variant: "secondary",
                          })}
                        >
                          {user ? "Try Out Now" : "Sign in"}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                      ) : user ? (
                        <UpgradeButton />
                      ) : (
                        <Link
                          href="/sign-in"
                          className={buttonVariants({ className: "w-full" })}
                        >
                          {user ? "Upgrade" : "Sign Up"}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </TooltipProvider>
        </div>
      </MaxWidthWraper>
    </>
  );
};

export default page;
