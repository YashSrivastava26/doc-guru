"use client";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { FC, useState } from "react";
import UploadZone from "./UploadZone";
interface UploadButtonProps {}

const UploadButton: FC<UploadButtonProps> = ({}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(!isOpen)}>
        <Button>Upload PDF</Button>
      </DialogTrigger>
      <DialogContent>
        <UploadZone />
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;
