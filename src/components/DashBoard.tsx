"use client";
import { FC, useState } from "react";
import UploadButton from "./UploadButton";
import { trpc } from "@/app/_trpc/client";
import { Ghost, Loader2, MessageSquare, Plus, TrashIcon } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "./ui/button";

interface DashBoardProps {}

const DashBoard: FC<DashBoardProps> = ({}) => {
  const [currentDeletingFile, setCurrentDeletingFile] = useState<string | null>(
    null
  );
  const utils = trpc.useContext();
  const { data: files, isLoading } = trpc.getUserFiles.useQuery();

  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
    },
    onMutate: ({ id }) => {
      setCurrentDeletingFile(id);
    },
    onSettled: () => {
      setCurrentDeletingFile(null);
    },
  });
  return (
    <main className="mx-auto max-w-7xl md:p-10">
      <div className="mt-8 flex items-start flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:gap-0 sm:items-center">
        <h1 className="mb-3 font-bold text-5xl text-gray-900">My Files</h1>

        <UploadButton />
      </div>

      {/* display files user have */}

      {files && files.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 divide-y divide-zinc-200">
          {files
            .sort(
              (x, y) =>
                new Date(y.createdAt).getTime() -
                new Date(x.createdAt).getTime()
            )
            .map((file) => {
              return (
                <li
                  className="divide-y divide-gray-200 rounded-lg col-span-1 bg-white shadow transition hover:shadow-xl"
                  key={file.id}
                >
                  <Link
                    className="flex flex-col gap-2"
                    href={`/dashboard/${file.id}`}
                  >
                    <div className="pt-6 px-6 flex w-full items-center justify-between space-x-6">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-3 ">
                          <h3 className="text-lg font-medium text-zinc-900 truncate">
                            {file.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="px-6 mt-4 grid grid-cols-3 py-2 gap-6 text-xs place-items-center text-zinc-500">
                    <div className="flex gap-2 items-center">
                      <Plus className="w-4 h-4" />
                      {format(new Date(file.createdAt), "dd/MM/yyyy")}
                    </div>

                    <div className="items-center flex gap-2">
                      <MessageSquare className="w-4 h-4" />
                      moked
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      variant="destructive"
                      onClick={() => deleteFile({ id: file.id })}
                    >
                      {currentDeletingFile === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
        </ul>
      ) : isLoading ? (
        <Skeleton height={100} count={3} className="my-2" />
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2">
          <Ghost className="w-16 h-16 text-zinc-800" />
          <h3 className="font-semibold text-xl">Pretty empty around here</h3>
          <p>Let&apos;s upload your first PDF</p>
        </div>
      )}
    </main>
  );
};

export default DashBoard;
