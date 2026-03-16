import { ReactNode, ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-montserrat font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-[var(--color-psych-blue)] text-white hover:bg-[#185592] focus:ring-[var(--color-psych-blue)]",
    secondary: "bg-[var(--color-surface-hover)] text-[var(--color-psych-navy)] hover:bg-[#e2e8f0] focus:ring-[var(--color-surface-hover)]",
    outline: "border-2 border-[var(--color-border)] text-[var(--color-psych-navy)] hover:bg-[var(--color-surface-hover)] hover:border-[#cbd5e1]",
    ghost: "text-[var(--color-psych-navy)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-psych-blue)]",
    danger: "bg-[var(--color-danger)] text-white hover:bg-[#d03248] focus:ring-[var(--color-danger)]",
    success: "bg-[var(--color-success)] text-white hover:bg-[#0ea5e9] focus:ring-[var(--color-success)]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-sans tracking-wide";

  const variants = {
    success: "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning-border)]",
    danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger-border)]",
    info: "bg-[#eff6ff] text-[var(--color-psych-blue)] border border-[#bfdbfe]",
    default: "bg-[var(--color-surface-hover)] text-slate-600 border border-[var(--color-border)]"
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-[var(--color-surface)] rounded-3xl shadow-xl shadow-slate-200/40 border border-[var(--color-border)] overflow-hidden", className)}>
      {children}
    </div>
  );
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const bgColors = {
    success: 'bg-[var(--color-success)]',
    error: 'bg-[var(--color-danger)]',
    info: 'bg-[var(--color-psych-navy)]'
  };

  return (
    <div className={cn("fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-sans text-sm z-50 animate-in slide-in-from-bottom-5", bgColors[type])}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  );
}
