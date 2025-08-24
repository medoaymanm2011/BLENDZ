"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: PropsWithChildren) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.position = "relative";
    el.style.zIndex = "2147483647"; // ensure highest by default
    document.body.appendChild(el);
    setContainer(el as unknown as HTMLElement);
    return () => {
      try { document.body.removeChild(el); } catch {}
      setContainer(null);
    };
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
