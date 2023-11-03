import { FC } from "react";
import MaxWidthWraper from "./MaxWidthWraper";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight } from "lucide-react";

interface NavbarProps {}

const Navbar: FC<NavbarProps> = ({}) => {
  return (
    <nav className="sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all">
      <MaxWidthWraper>
        <div className="h-14 flex justify-between items-center border-b border-zinc-200 ">
          <Link
            href="/"
            className="flex z-40 font-semibold items-center space-x-2"
          >
            DocGuru
          </Link>
          <div className="hidden sm:flex sm:items-center space-x-4">
            <>
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}
              >
                Pricing
              </Link>
              <LoginLink
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}
              >
                Login
              </LoginLink>

              <RegisterLink
                className={buttonVariants({
                  size: "sm",
                })}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </RegisterLink>
            </>
          </div>
        </div>
      </MaxWidthWraper>
    </nav>
  );
};

export default Navbar;
