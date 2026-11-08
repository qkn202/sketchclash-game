import React, { useEffect, useRef } from 'react';

interface ModalDialogProps {
  ariaLabelledBy?: string;
  ariaLabel?: string;
  dismissible?: boolean;
  onClose?: () => void;
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Accessible native <dialog> modal wrapper opened via showModal().
 * Implements declarative closedby="any" | "none" plus coordinate-checked Safari fallback.
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  ariaLabelledBy,
  ariaLabel,
  dismissible = true,
  onClose,
  maxWidth = '560px',
  className = '',
  style,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // Fallback if already open
      }
    }

    const handleClose = () => {
      // Guard against queued async 'close' task from React StrictMode simulated cleanup
      if (dialog.open || !dialog.isConnected) return;
      dialog.returnValue = '';
      onCloseRef.current?.();
    };

    const handleCancel = (e: Event) => {
      if (!dismissible) {
        e.preventDefault();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);

    // Fallback for browsers without <dialog closedby> support (e.g., Safari)
    let removeLightDismissFallback: (() => void) | null = null;
    if (dismissible && typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = e.target === dialog && outside(e);
      };
      // Require both press and release outside so a text-selection drag ending on the backdrop does not dismiss
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && e.target === dialog && outside(e)) {
          dialog.close();
        }
        pressedOutside = false;
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      removeLightDismissFallback = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      removeLightDismissFallback?.();
      if (dialog.open) {
        try {
          dialog.close();
        } catch {
          // Ignore unmount close errors
        }
      }
    };
  }, [dismissible]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      {...({ closedby: dismissible ? 'any' : 'none' } as Record<string, string>)}
      className={`hogwarts-modal-dialog animate-bounce-in ${className}`.trim()}
      style={{
        maxWidth,
        ...style,
      }}
    >
      {children}
    </dialog>
  );
};
