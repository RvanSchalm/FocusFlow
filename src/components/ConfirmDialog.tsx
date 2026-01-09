import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        message: "",
        title: "Confirm",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "danger",
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions({
            title: opts.title ?? "Confirm",
            message: opts.message,
            confirmText: opts.confirmText ?? "Confirm",
            cancelText: opts.cancelText ?? "Cancel",
            variant: opts.variant ?? "danger",
        });
        setIsOpen(true);

        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleClose = useCallback((result: boolean) => {
        setIsOpen(false);
        resolveRef.current?.(result);
        resolveRef.current = null;
    }, []);

    // Handle Escape key to cancel
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    const variantStyles = {
        danger: {
            icon: (
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            iconBg: "bg-indigo-500/10",
            button: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400",
        },
        warning: {
            icon: (
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            iconBg: "bg-amber-500/10",
            button: "bg-amber-600 hover:bg-amber-500",
        },
        info: {
            icon: (
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            iconBg: "bg-indigo-500/10",
            button: "bg-indigo-600 hover:bg-indigo-500",
        },
    };

    const styles = variantStyles[options.variant || "danger"];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {isOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
                        onClick={() => handleClose(false)}
                    >
                        <div
                            className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800 animate-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                                        {styles.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-zinc-100 mb-1">
                                            {options.title}
                                        </h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">
                                            {options.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl">
                                <button
                                    onClick={() => handleClose(false)}
                                    className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg font-medium transition-colors focus:outline-none"
                                >
                                    {options.cancelText}
                                </button>
                                <button
                                    onClick={() => handleClose(true)}
                                    autoFocus
                                    className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors focus:outline-none ${styles.button}`}
                                >
                                    {options.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </ConfirmContext.Provider>
    );
}
