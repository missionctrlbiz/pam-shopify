import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-psych-blue/40 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-psych-navy text-white",
        secondary:
          "border-transparent bg-psych-purple text-white",
        gradient:
          "border-transparent bg-gradient-psych text-white shadow-sm",
        outline:
          "border-psych-navy/20 bg-psych-navy/5 text-psych-navy",
        soft:
          "border-psych-purple/20 bg-psych-purple/5 text-psych-purple",
        success:
          "border-transparent bg-emerald-100 text-emerald-700",
        warning:
          "border-transparent bg-amber-400 text-amber-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
