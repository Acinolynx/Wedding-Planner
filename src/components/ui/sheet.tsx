"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SheetContextType = {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextType | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet")
  }
  return context
}

function Sheet({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <SheetContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
      )}
    </SheetContext.Provider>
  )
}

function SheetContent({
  children,
  side = "right",
  className,
}: {
  children: React.ReactNode
  side?: "right" | "left"
  className?: string
}) {
  const { open } = useSheetContext()

  return (
    <div
      className={cn(
        "fixed top-0 z-50 h-full bg-background shadow-lg transition-transform duration-300 ease-in-out",
        side === "right" ? "right-0" : "left-0",
        "w-full max-w-md",
        open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
        className
      )}
    >
      {children}
    </div>
  )
}

function SheetHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between border-b px-6 py-4", className)}>
      {children}
    </div>
  )
}

function SheetTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}

function SheetClose({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { setOpen } = useSheetContext()
  return (
    <button
      type="button"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => setOpen(false)}
    >
      {children}
    </button>
  )
}

function SheetBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-4 py-4 sm:px-6", className)}>
      {children}
    </div>
  )
}

function SheetFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-t px-6 py-4", className)}>
      {children}
    </div>
  )
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetBody, SheetFooter }
