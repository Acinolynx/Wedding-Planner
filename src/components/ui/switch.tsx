"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <label className="relative inline-flex cursor-pointer items-center">
    <input
      ref={ref}
      type="checkbox"
      className={cn("peer sr-only", className)}
      {...props}
    />
    <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full" />
  </label>
))
Switch.displayName = "Switch"

export { Switch }
