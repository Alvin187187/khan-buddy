import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-primary text-primary-ink border-primary",
    secondary: "bg-surface text-foreground border-line",
    ghost: "bg-transparent text-foreground border-transparent",
    danger: "bg-danger text-white border-danger",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[8px] border px-4 text-[15px] font-bold disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[12px] border border-line bg-surface p-4 shadow-[var(--shadow)]", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-[8px] border border-line bg-surface px-3 text-[16px] outline-none focus:outline focus:outline-2 focus:outline-primary",
        props.className,
      )}
    />
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[6px] bg-highlight px-2 py-0.5 text-xs font-bold text-primary">
      {children}
    </span>
  );
}

export function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[8px] bg-highlight px-1.5 py-0.5 text-primary">{children}</span>
  );
}
