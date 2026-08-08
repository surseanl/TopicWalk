"use client";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

type Variant = "fade-in-up" | "fade-in" | "scale-in";

const ANIM: Record<Variant, string> = {
  "fade-in-up": "animate-fade-in-up",
  "fade-in": "animate-fade-in",
  "scale-in": "animate-scale-in",
};

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: Variant;
}

export function AnimateOnScroll({
  children,
  className,
  delay = 0,
  variant = "fade-in-up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.opacity = "0";

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // Remove inline opacity so CSS animation fill-mode:both takes over from its own 0
        el.style.opacity = "";
        if (delay > 0) el.style.animationDelay = `${delay}ms`;
        el.classList.add(ANIM[variant]);
      },
      { threshold: 0.1, rootMargin: "0px 0px -24px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [variant, delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
