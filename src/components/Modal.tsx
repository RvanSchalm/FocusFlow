import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export function Modal({ isOpen, onClose, children, title, className = "max-w-2xl" }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`bg-zinc-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800 animate-in zoom-in-95 duration-200 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="flex justify-between items-center p-6 border-b border-zinc-800/50 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                        <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
                    </div>
                )}
                <div className="overflow-y-auto p-6">{children}</div>
            </div>
        </div>,
        document.body
    );
}
