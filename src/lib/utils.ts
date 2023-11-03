import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absolutePath(path: string) {
  if (typeof window !== "undefined") {
    return path;
  } else if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${path}`;
  } else if (process.env.PUBLIC_URL) {
    return `https://${process.env.PUBLIC_URL}${path}`;
  } else {
    return `http://localhost:${process.env.PORT ?? 3000}${path}`;
  }
}
