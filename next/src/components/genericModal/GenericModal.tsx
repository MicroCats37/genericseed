"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useImperativeHandle,
  useEffect,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GenericModalProps,
  GenericModalRef,
  GenericModalContextType,
  GenericModalContentProps,
  GenericModalHeaderProps,
  GenericModalBodyProps,
  GenericModalFooterProps,
  GenericModalCloseProps,
  GenericModalTriggerProps,
  GenericModalCloseXProps,
} from "./GenericModal.types";

/** 
 * Internal Modal Context for Deep Component Communication 
 */
const GenericModalContext = createContext<GenericModalContextType | undefined>(
  undefined
);

/**
 * Hook to share modal state and actions with any child component
 */
export const useGenericModal = () => {
  const context = useContext(GenericModalContext);
  if (!context) {
    throw new Error(
      "useGenericModal must be used within a <GenericModal /> Provider"
    );
  }
  return context;
};

/**
 * GenericModalRoot (React 19 Pattern)
 */
const GenericModalRoot = ({
  open: controlledOpen,
  onOpenChange,
  children,
  ref,
  preventClose = false,
  onBeforeClose,
}: GenericModalProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [hasHeader, setHasHeader] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    async (nextOpen: boolean) => {
      // Interceptor logic
      if (isOpen && !nextOpen && onBeforeClose) {
        const canClose = await onBeforeClose();
        if (!canClose) return;
      }

      if (onOpenChange) onOpenChange(nextOpen);
      else setUncontrolledOpen(nextOpen);
    },
    [isOpen, onOpenChange, onBeforeClose]
  );

  const registerHeader = useCallback((exists: boolean) => {
    setHasHeader(exists);
  }, []);

  const actions: GenericModalRef = useMemo(() => ({
    open: () => handleOpenChange(true),
    close: () => handleOpenChange(false),
    forceClose: () => {
      if (onOpenChange) onOpenChange(false);
      else setUncontrolledOpen(false);
    },
    isOpen,
    preventClose,
    hasHeader,
    registerHeader,
  }), [handleOpenChange, onOpenChange, isOpen, preventClose, hasHeader, registerHeader]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(ref, () => actions, [handleOpenChange, onOpenChange, isOpen, preventClose, hasHeader, registerHeader]);

  return (
    <GenericModalContext.Provider value={actions}>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    </GenericModalContext.Provider>
  );
};

// --- Compound Atom Sections ---

/** Simple wrapper for trigger */
const ModalTrigger = ({ children, asChild }: GenericModalTriggerProps) => (
  <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
);

/** Pure layout container: Does not render the close button automatically. */
const ModalContent = ({
  children,
  className,
}: GenericModalContentProps) => {
  const { preventClose, hasHeader } = useGenericModal();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContent
        className={cn(
          "flex flex-col gap-0 max-h-[90vh] p-0 overflow-hidden",
          "w-full sm:max-w-fit",
          className
        )}
        onPointerDownOutside={(e) => {
          if (preventClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose) e.preventDefault();
        }}
      >
        {!hasHeader && (
          <DialogTitle className="sr-only">Modal Content</DialogTitle>
        )}
        {children}
      </DialogContent>
    </DialogPortal>
  );
};

/** Standalone Close Button (X icon) */
const ModalCloseX = ({ className }: GenericModalCloseXProps) => {
  const { close, preventClose } = useGenericModal();
  
  if (preventClose) return null; // Standard: don't show X if close is blocked

  return (
    <button
      type="button"
      onClick={() => close()}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50",
        className
      )}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
};

/** Modular Header: Sticky candidate */
const ModalHeader = ({
  title,
  description,
  className,
  children,
}: GenericModalHeaderProps) => {
  const { registerHeader } = useGenericModal();

  useEffect(() => {
    registerHeader(true);
    return () => registerHeader(false);
  }, [registerHeader]);

  return (
    <DialogHeader className={cn("flex-none p-6 pb-0", className)}>
      {title && <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>}
      {description && (
        <DialogDescription className="text-muted-foreground">
          {description}
        </DialogDescription>
      )}
      {children}
    </DialogHeader>
  );
};

/** Modular Body: The Scrollable Workspace */
const ModalBody = ({
  children,
  className,
  scrollable = true,
}: GenericModalBodyProps) => (
  <div
    className={cn(
      "flex-1 p-6 min-h-0",
      scrollable && "overflow-y-auto scrollbar-thin scrollbar-thumb-accent",
      className
    )}
  >
    {children}
  </div>
);

/** Modular Footer: Sticky Bottom by default */
const ModalFooter = ({ children, className, sticky = true }: GenericModalFooterProps) => (
  <div
    className={cn(
      "flex-none p-6 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      sticky && "sticky bottom-0 bg-background z-10 border-t",
      className
    )}
  >
    {children}
  </div>
);

/** Headless Closer wrapper */
const ModalClose = ({ children, asChild }: GenericModalCloseProps) => {
  const { close } = useGenericModal();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: React.MouseEventHandler;
    }>;

    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        close();
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => close()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') close() }}
      className="contents"
    >
      {children}
    </button>
  );
};

// --- Modular Composition Export ---

/**
 * Final GenericModal Export with Compound Components
 */
export const GenericModal = Object.assign(GenericModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
  CloseX: ModalCloseX, // New Piece!
});
