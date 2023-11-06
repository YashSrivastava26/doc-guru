import { getUserSubscriptionPlan } from "@/lib/stripe";
import { FC } from "react";
import { Button, buttonVariants } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import Image from "next/image";
import { Gem, LogOut, User, Zap } from "lucide-react";
import { KindeUser, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/server";

import Link from "next/link";

interface AccountMenuProps {
  user: KindeUser;
}

const AccountMenu: FC<AccountMenuProps> = async ({ user }) => {
  const name =
    !user.family_name || !user.given_name
      ? "Your Account"
      : `${user.given_name} ${user.family_name}`;
  const imageUrl = user.picture ?? "";
  const email = user.email ?? "";
  const subscription = await getUserSubscriptionPlan();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="overflow-visible">
        <Button className="h-8 w-8 aspect-square rounded-full bg-muted">
          <Avatar className="relative w-8 h-8">
            {imageUrl ? (
              <div className="h-full w-full relative aspect-square">
                <Image
                  fill
                  src={imageUrl}
                  alt="profile picture"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <AvatarFallback>
                <span className="sr-only">{name}</span>
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white" align="end">
        <div className="flex justify-start items-center p-2 gap-2">
          <div className="flex flex-col space-y-0.5 leading-none">
            {name && (
              <span className="text-sm font-medium text-secondary-foreground">
                {name}
              </span>
            )}
            {email && (
              <span className="w-[200px] truncate text-xs font-medium text-muted-foreground">
                {email}
              </span>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          {subscription?.isSubscribed ? (
            <Link href="/dashboard/billing" className="text-muted-foreground">
              Manage Subscription
            </Link>
          ) : (
            <Link
              href="/pricings"
              className="font-semibold flex !justify-start text-muted-foreground"
            >
              Upgrade
              <Gem className="text-primary h-4 w-4 ml-2" />
            </Link>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer flex">
          <LogoutLink className="text-muted-foreground">Logout</LogoutLink>
          <LogOut className="h-4 w-4 text-muted-foreground ml-2" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
