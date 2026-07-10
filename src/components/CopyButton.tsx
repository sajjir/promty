import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
  onCopy?: () => void;
}

export default function CopyButton({ text, className = "", label, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (onCopy) {
        onCopy();
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("خطا در کپی کردن متن:", err);
    }
  };

  return (
    <button
      id="copy-prompt-btn"
      onClick={handleCopy}
      className={`flex items-center justify-center gap-2 px-5 py-3 font-medium transition-all duration-200 border-2 border-[#6C47FF] hover:bg-[#6C47FF] hover:text-white rounded-lg cursor-pointer ${
        copied
          ? "bg-[#10B981] border-[#10B981] text-white"
          : "bg-white text-[#6C47FF]"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 animate-scale-up" />
          <span>کپی شد! ✓</span>
        </>
      ) : (
        <>
          <Copy className="w-5 h-5" />
          <span>{label || "کپی کردن پرامپت"}</span>
        </>
      )}
    </button>
  );
}
