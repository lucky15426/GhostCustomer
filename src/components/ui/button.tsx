import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "shimmer group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        // premium ink-black primary
        default:
          "bg-slate-900 text-white shadow-[0_10px_28px_-12px_rgba(15,23,42,0.55)] hover:bg-black hover:shadow-[0_16px_36px_-12px_rgba(15,23,42,0.65)] disabled:bg-slate-100 disabled:text-slate-400",
        // clean white raised
        accent:
          "border border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_10px_24px_-12px_rgba(15,23,42,0.22)] disabled:bg-slate-50 disabled:text-slate-300",
        outline:
          "border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50 disabled:text-slate-300",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-300",
        destructive: "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100",
        link: "text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
