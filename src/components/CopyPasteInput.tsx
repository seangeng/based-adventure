"use client";
import React, { useState } from "react";
import copy from "copy-to-clipboard";

interface CopyPasteInputProps {
  value: string;
}

const CopyPasteInput: React.FC<CopyPasteInputProps> = ({ value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    copy(value);
    setIsCopied(true);
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        readOnly
        value={value}
        onClick={handleCopy}
        className="min-w-0 my-5 w-full flex-auto rounded-md border-0 bg-white/5 
      cursor-copy
      px-6 py-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 
      focus:ring-inset focus:ring-indigo-500 sm:text-md sm:leading-6"
      />
      {isCopied && <p>Copied frame URL! Now just post it on Warpcast.</p>}
    </div>
  );
};

export default CopyPasteInput;
