"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    data-slot="select"
    className={cn(
      "flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow appearance-none focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
Select.displayName = "Select"

export { Select }
