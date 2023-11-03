"use client";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  ZoomIn,
} from "lucide-react";
import { FC, use, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import PDFFullScreenViewer from "./PDFFullScreenViewer";
import { PDFLoader } from "./Loaders";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface PDFViewerProps {
  url: string;
}

const PDFViewer: FC<PDFViewerProps> = ({ url }) => {
  const { toast } = useToast();
  const { width, ref: resizeRef } = useResizeDetector();
  const [totalPages, settotalPages] = useState<number | undefined>(undefined);
  const [currentPage, setcurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);
  const [renderedScale, setRenderedScale] = useState<number | null>(null);

  const isLoading = renderedScale !== null || renderedScale !== zoomScale;

  const pageNumberValidator = z.object({
    page: z
      .string()
      .refine((val) => Number(val) > 0 && Number(val) <= totalPages!),
  });
  type pageNumberType = z.infer<typeof pageNumberValidator>;
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<pageNumberType>({
    resolver: zodResolver(pageNumberValidator),
    defaultValues: {
      page: "1",
    },
  });

  const handlePageSubmit = (data: pageNumberType) => {
    setcurrentPage(Number(data.page));
    setValue("page", String(data.page));
  };
  return (
    <div className="w-full flex flex-col items-center rounded-md bg-white shadow">
      <div className="h-14 border-b w-full border-zinc-200 items-center flex justify-between px-2">
        <div className="flex gap-1.5 items-center">
          <Button
            variant="ghost"
            aria-label="previous page"
            onClick={() => {
              setcurrentPage((prev) => {
                if (prev === 1) return prev;
                return prev - 1;
              });
              setValue("page", String(currentPage - 1));
            }}
            disabled={currentPage === 1}
          >
            <ChevronDown className="h-6 w-6" />
          </Button>

          <div className="flex items-center justify-center gap-1.5">
            <Input
              {...register("page")}
              className={cn(
                "w-12 h-8",
                errors.page && "focus-visible:ring-red-500"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(handlePageSubmit)();
                }
              }}
            />
            <p className="text-sm space-x-1 text-zinc-700">
              <span>/</span>
              <span>{totalPages ?? "x"}</span>
            </p>
          </div>

          <Button
            variant="ghost"
            aria-label="next page"
            onClick={() => {
              setcurrentPage((prev) => {
                if (prev === totalPages) return prev;
                return prev + 1;
              });
              setValue("page", String(currentPage + 1));
            }}
            disabled={totalPages === undefined || currentPage === totalPages}
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="zoom" variant="ghost" className="gap-1.5">
                <ZoomIn className="h-6 w-6" />
                <span>{zoomScale * 100}%</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  setZoomScale(1);
                }}
              >
                100%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setZoomScale(1.5);
                }}
              >
                150%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setZoomScale(2);
                }}
              >
                200%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setZoomScale(2.5);
                }}
              >
                250%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setZoomScale(3);
                }}
              >
                300%
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setZoomScale(4);
                }}
              >
                400%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            aria-label="rotate"
            variant="ghost"
            onClick={() => {
              setRotate((prev) => {
                return (prev + 90) % 360;
              });
            }}
          >
            <RotateCw className="h-6 w-6" />
          </Button>

          <PDFFullScreenViewer url={url} />
        </div>
      </div>

      <div className="flex-1 max-h-screen w-full">
        <SimpleBar
          autoHide={false}
          className="h-full max-h-[calc(100vh-10rem)]"
        >
          <div ref={resizeRef}>
            <Document
              loading={<PDFLoader />}
              onLoadError={() => {
                toast({
                  title: "Error in loading PDF",
                  description: "please try again",
                  variant: "destructive",
                });
              }}
              onLoadSuccess={(file) => {
                settotalPages(file.numPages);
              }}
              file={url}
              className="max-h-full"
            >
              {isLoading ? (
                <Page
                  pageNumber={currentPage}
                  width={width ? width : 1}
                  scale={zoomScale}
                  rotate={rotate}
                  key={url + "#" + renderedScale}
                />
              ) : null}

              <Page
                className={cn(isLoading ? "hidden" : "")}
                pageNumber={currentPage}
                width={width ? width : 1}
                scale={zoomScale}
                rotate={rotate}
                loading={<PDFLoader />}
                onRenderSuccess={() => {
                  setRenderedScale(zoomScale);
                }}
                key={url + "#" + zoomScale}
              />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  );
};

export default PDFViewer;
