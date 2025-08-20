"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
};

type AlertOptions = Omit<ConfirmOptions, "cancelText"> & { confirmText?: string };

type ConfirmDialogContextValue = {
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
  alert: (opts?: AlertOptions) => Promise<void>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  return ctx;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<((v: boolean | void) => void) | null>(null);

  const confirm = useCallback((options?: ConfirmOptions) => {
    setIsAlert(false);
    setOpts(options || {});
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const alert = useCallback((options?: AlertOptions) => {
    setIsAlert(true);
    setOpts(options || {});
    setOpen(true);
    return new Promise<void>((resolve) => setResolver(() => resolve));
  }, []);

  const onCancel = () => {
    setOpen(false);
    if (!isAlert) resolver?.(false);
    setResolver(null);
  };

  const onConfirm = () => {
    setOpen(false);
    resolver?.(isAlert ? undefined : true);
    setResolver(null);
  };

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  const title = opts.title ?? (opts.variant === "danger" ? "Are you sure?" : "Confirm");
  const message = opts.message ?? "This action requires your confirmation.";
  const confirmText = opts.confirmText ?? (isAlert ? "OK" : opts.variant === "danger" ? "Delete" : "Confirm");
  const cancelText = opts.cancelText ?? "Cancel";

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              {opts.variant === "danger" ? (
                <div className="mt-1 rounded-full bg-red-100 p-2 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"/></svg>
                </div>
              ) : (
                <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"/></svg>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{message}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              {!isAlert && (
                <button onClick={onCancel} className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{cancelText}</button>
              )}
              <button onClick={onConfirm} className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow ${opts.variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#2F3E77] hover:brightness-95"}`}>{confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
