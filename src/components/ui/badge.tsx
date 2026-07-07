import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-violet-200/70 bg-violet-50 text-violet-700",
        cyan: "border-cyan-200/70 bg-cyan-50 text-cyan-700",
        emerald: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200/70 bg-amber-50 text-amber-700",
        rose: "border-rose-200/70 bg-rose-50 text-rose-700",
        outline: "border-slate-200 text-slate-600",
        muted: "border-slate-200 bg-slate-50 text-slate-500",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
