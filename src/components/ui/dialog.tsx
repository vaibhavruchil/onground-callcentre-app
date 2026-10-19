import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/formatters.ts';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerExtras?: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  headerExtras,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#D4DAD2] bg-white text-[#111814] shadow-xl',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#E4E8E2] bg-[#F8FAF7] px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[#111814]">{title}</h2>
            {description && (
              <p className="mt-0.5 truncate text-xs text-[#5A6860]">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerExtras}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D5DBD3] bg-white text-[#4A5750] hover:bg-[#F1F4F0] hover:text-[#111814] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112E22] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
