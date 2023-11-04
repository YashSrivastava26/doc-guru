"use client";
import { ArrowRight, LogOut, MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, useEffect, useState } from "react";
interface MobileViewProps {
  isAuth: boolean;
}

const MobileView: FC<MobileViewProps> = ({ isAuth }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      toggleMenu();
    }
  }, [pathname]);

  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      toggleMenu();
    }
  };
  return (
    <div className="sm:hidden">
      <MenuIcon
        className="h-6 w-6 relative z-20 text-secondary-foreground cursor-pointer"
        onClick={() => toggleMenu()}
      />
      {isOpen ? (
        <div className="inset-0 z-0 w-full fixed animate-in slide-in-from-top-5 fade-in-20">
          <ul className="absolute bg-muted border-b border-muted-foreground grid w-full shadow-xl px-10 pt-20 pb-8 gap-3">
            {isAuth ? (
              <>
                <li>
                  <Link
                    href="/dashboard"
                    className="flex items-center w-full font-semibold text-secondary-foreground"
                    onClick={() => closeOnCurrent("/dashboard")}
                  >
                    Dashboard
                  </Link>
                </li>

                <li className="my-3 h-px w-full bg-gray-300" />

                <li>
                  <Link
                    href="/sign-out"
                    className="flex items-center w-full font-semibold text-secondary-foreground"
                  >
                    Sign Out <LogOut className="h-5 w-5 ml-2" />
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/sign-up"
                    className="flex items-center w-full font-semibold text-primary"
                    onClick={() => closeOnCurrent("/sign-up")}
                  >
                    Get Started <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </li>

                <li className="my-3 h-px w-full bg-gray-300" />

                <li>
                  <Link
                    href="/sign-in"
                    className="flex items-center w-full font-semibold text-secondary-foreground"
                    onClick={() => closeOnCurrent("/sign-in")}
                  >
                    Sign in
                  </Link>
                </li>

                <li className="my-3 h-px w-full bg-gray-300" />

                <li>
                  <Link
                    href="/pricing"
                    className="flex items-center w-full font-semibold text-secondary-foreground"
                    onClick={() => closeOnCurrent("/pricing")}
                  >
                    Pricing
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default MobileView;
