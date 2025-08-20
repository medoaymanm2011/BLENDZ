"use client";

import { useEffect, useRef, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: PropsWithChildren) {
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.position = "relative";
    el.style.zIndex = "2147483647"; // ensure highest by default
    document.body.appendChild(el);
    elRef.current = el as unknown as HTMLElement;
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!elRef.current) return null;
  return createPortal(children, elRef.current);
}
