import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MaxWidthWraperProps {
  className?: string;
  children: ReactNode;
}

const MaxWidthWraper = ({ className, children }: MaxWidthWraperProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-xl px-2.5 md:px-20",
        className
      )}
    >
      {children}
    </div>
  );
};

export default MaxWidthWraper;
