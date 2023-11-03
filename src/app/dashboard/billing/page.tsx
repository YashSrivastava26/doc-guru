import SubscriptionManagement from "@/components/SubscriptionManagement";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  const subscription = await getUserSubscriptionPlan();
  return <SubscriptionManagement subscription={subscription} />;
};

export default page;
