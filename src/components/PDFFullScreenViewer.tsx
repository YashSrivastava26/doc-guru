import { FC, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Expand } from "lucide-react";
import SimpleBar from "simplebar-react";
import { Document, Page } from "react-pdf";
import { useToast } from "./ui/use-toast";
import { PDFLoader } from "./Loaders";
import { useResizeDetector } from "react-resize-detector";

interface PDFFullScreenViewerProps {
  url: string;
}

const PDFFullScreenViewer: FC<PDFFullScreenViewerProps> = ({ url }) => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const { width, ref: resizeRef } = useResizeDetector();
  const [totalPages, settotalPages] = useState<number | undefined>(undefined);

  const { toast } = useToast();
  return (
    <Dialog
      open={isFullScreen}
      onOpenChange={(prev) => {
        if (!prev) setIsFullScreen(prev);
      }}
    >
      <DialogTrigger
        asChild
        onClick={() => {
          setIsFullScreen(true);
        }}
      >
        <Button aria-label="Full Screen" variant="ghost" className="gap-1.5">
          <Expand className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-8xl">
        <SimpleBar
          autoHide={false}
          className="h-full max-h-[calc(100vh-10rem)] mt-6"
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
              {new Array(totalPages).fill(0).map((_, i) => {
                return (
                  <Page pageNumber={i + 1} key={i} width={width ? width : 1} />
                );
              })}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  );
};
export default PDFFullScreenViewer;
