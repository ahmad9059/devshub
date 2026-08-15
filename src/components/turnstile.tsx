"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string | undefined) => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({
  onVerify,
  className,
}: {
  onVerify: (token: string | undefined) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const instanceId = useId();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.turnstile || !containerRef.current) {
        return;
      }
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string,
        callback: onVerify,
        theme: "auto",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, [onVerify]);

  return (
    <div
      id={`turnstile-${instanceId}`}
      ref={containerRef}
      className={className}
    />
  );
}
