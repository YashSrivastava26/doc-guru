import { Cloud, File, Loader2 } from "lucide-react";
import { FC, use, useState } from "react";
import Dropzone from "react-dropzone";
import { Progress } from "./ui/progress";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "./ui/use-toast";
import { trpc } from "@/app/_trpc/client";
import { useRouter } from "next/navigation";

interface UploadZoneProps {
  isSubscribed: boolean;
}
const UploadZone: FC<UploadZoneProps> = ({ isSubscribed }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<boolean>(false);
  const openai_api_key = localStorage.getItem("openai_api_key") || "";
  const { toast } = useToast();
  const router = useRouter();

  const startProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 97) {
          clearInterval(interval);
          return prevProgress;
        }
        prevProgress += 1;
        return prevProgress;
      });
    }, 100);

    return interval;
  };

  const { mutate: startPolling } = trpc.getFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file.id}`);
    },
    retry: true,
    retryDelay: 500,
  });

  const { startUpload } = useUploadThing(
    isSubscribed ? "proPlanUploader" : "freePlanUploader"
  );
  return (
    <Dropzone
      multiple={false}
      onDrop={async (acceptedFile) => {
        setIsUploading(true);
        setError(false);
        const interval = startProgress();
        console.log(acceptedFile);
        //file upload
        const response = await startUpload(acceptedFile, {
          openai_api_key: openai_api_key,
        });

        if (!response) {
          clearInterval(interval);
          setError(true);
          return toast({
            title: "Something went wrong with the upload",
            description: "Please make sure you have entered correct api key",
            variant: "destructive",
          });
        }

        const [fileResponse] = response;
        const key = fileResponse.key;

        if (!key) {
          clearInterval(interval);
          setError(true);
          return toast({
            title: "Something went wrong with the upload",
            description: "Please make sure you have entered correct api key",
            variant: "destructive",
          });
        }

        //start polling
        startPolling({ key });

        clearInterval(interval);
        setUploadProgress(100);
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className="h-64 border-dashed border-gray-300 border m-4 rounded-xl"
        >
          <div className="flex items-center h-full w-full justify-center">
            <label
              htmlFor="dropzone-file"
              className="flex items-center justify-center flex-col w-full h-full rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-center justify-center flex-col pb-6 pt-5">
                <Cloud className="w-12 h-12 text-zinc-400 mb-2" />
                <p className="mb-2 text-sm text-zinc-700">
                  <span className="font-semibold">Click to Upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-zinc-500">
                  PDF (upto {isSubscribed ? "16MB" : "4MB"})
                </p>
              </div>

              {acceptedFiles && acceptedFiles.length > 0 ? (
                <div className="bg-white flex items-center rounded-md max-w-xs overflow-hidden outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                  <div className="py-2 h-full grid place-items-center px-3">
                    <File className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="py-2 h-full truncate text-sm px-3">
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
                <div className="max-w-xs mt-4 w-full mx-auto">
                  <Progress
                    className="bg-zinc-200 w-full h-2"
                    value={uploadProgress}
                    color={
                      uploadProgress === 100
                        ? "bg-green-500"
                        : error
                        ? "bg-destructive-foreground"
                        : ""
                    }
                  />
                  {uploadProgress === 100 ? (
                    <div className="flex items-center justify-center text-sm text-zinc-700 text-center pt-2 gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redirecting...</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <input
                type="file"
                id="dropzone-file"
                className="hidden"
                {...getInputProps}
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
};

export default UploadZone;
