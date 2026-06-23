"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Marketing-tuned shadcn button.
 *
 * Variants:
 * - default  → solid psych-navy (primary brand surface)
 * - gradient → signature red→pink→purple gradient (the famous halo CTA)
 * - gradientOutline → outline with brain gradient (purple→blue)
 * - secondary → psych-purple
 * - outline  → bordered transparent
 * - ghost    → no chrome
 * - link     → text-only
 * - destructive → psych-red
 *
 * Sizes: sm | default | lg | xl | icon
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-psych-blue/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-psych-navy text-white hover:bg-[#052e7a] shadow-md hover:shadow-lg",
        gradient:
          "bg-gradient-psych text-white shadow-lg shadow-psych-purple/25 hover:shadow-psych-purple/40",
        gradientOutline:
          "relative bg-white text-psych-navy p-0 hover:shadow-lg hover:shadow-psych-blue/20",
        secondary:
          "bg-psych-purple text-white hover:bg-psych-purple-dark shadow-md",
        outline:
          "border-2 border-psych-navy text-psych-navy bg-transparent hover:bg-psych-navy hover:text-white",
        ghost:
          "text-psych-navy hover:bg-slate-100",
        link:
          "text-psych-purple underline-offset-4 hover:underline",
        destructive:
          "bg-psych-red text-white hover:bg-rose-600 shadow-md",
      },
      size: {
        default: "h-11 px-6 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "size-11",
      },
      shape: {
        pill: "rounded-full",
        rounded: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // gradientOutline needs an inner p-0 wrapper because the gradient ring is a sibling
    if (variant === "gradientOutline") {
      return (
        <Comp
          ref={ref as React.Ref<HTMLButtonElement>}
          className={cn(
            buttonVariants({ variant, size, shape }),
            "bg-gradient-brain p-[2px] hover:shadow-lg hover:shadow-psych-blue/20",
            className
          )}
          {...props}
        />
      );
    }
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size, shape }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
