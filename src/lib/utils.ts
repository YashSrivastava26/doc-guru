import { clsx, type ClassValue } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absolutePath(path: string) {
  if (typeof window !== "undefined") {
    return path;
  } else if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${path}`;
  } else if (process.env.NEXT_PUBLIC_URL) {
    return `https://${process.env.NEXT_PUBLIC_URL}${path}`;
  } else {
    return `http://localhost:${process.env.PORT ?? 3000}${path}`;
  }
}

export function constructMetaData({
  title = "Chat-Guru ",
  description = "Chat-Guru is a personal project aims to help students with reading and doubt solving long PDF files",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    icons,
    metadataBase: new URL("https://doc-guru-pi.vercel.app"),
    themeColor: "#fff",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
