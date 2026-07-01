import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-gold-500 to-gold-400 text-navy-900 shadow-gold-button hover:-translate-y-px hover:shadow-gold-button-hover active:translate-y-0",
        primary:
          "bg-gradient-to-br from-gold-500 to-gold-400 text-navy-900 shadow-gold-button hover:-translate-y-px hover:shadow-gold-button-hover active:translate-y-0",
        secondary:
          "border border-navy-900/15 bg-white text-navy-900 shadow-card hover:bg-gray-50",
        outline:
          "border border-gray-200 bg-white text-navy-900 hover:bg-gray-50",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-navy-900",
        destructive:
          "bg-danger/10 text-danger hover:bg-danger/15",
        link: "text-gold-500 underline-offset-4 hover:underline",
        gold: "bg-gradient-to-br from-gold-500 to-gold-400 text-navy-900 shadow-gold-button hover:-translate-y-px hover:shadow-gold-button-hover active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
