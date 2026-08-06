"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title: string;
    description?: string;
  }
>(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-surface elev-2 border-border",
        // Mobile: bottom sheet, thumb-reachable. Desktop: centred panel.
        "inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] border-t max-h-[92dvh] overflow-y-auto",
        "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg",
        "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-lg)] sm:border",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 p-5 pb-2">
        <div>
          <DialogPrimitive.Title className="font-display text-xl font-semibold">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-ink-muted">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">
              {title}
            </DialogPrimitive.Description>
          )}
        </div>
        <DialogPrimitive.Close
          aria-label="Close"
          className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-muted hover:text-ink"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </div>
      <div className="p-5 pt-2">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
