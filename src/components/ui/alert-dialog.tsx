"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const AlertDialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
} | null>(null)

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error("AlertDialog components must be used within an AlertDialog")
  }
  return context
}

function AlertDialog({
  children,
  open,
  onOpenChange,
  onConfirm,
}: {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialogContext.Provider value={{ open, setOpen: onOpenChange, onConfirm }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => onOpenChange(false)}
        />
      )}
    </AlertDialogContext.Provider>
  )
}

function AlertDialogContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = useAlertDialogContext()

  if (!open) return null

  return (
    <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
      <div className={cn(
        "w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg",
        className
      )}>
        {children}
      </div>
    </div>
  )
}

function AlertDialogTitle({
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

function AlertDialogDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-2", className)}>
      {children}
    </p>
  )
}

function AlertDialogAction({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { setOpen, onConfirm } = useAlertDialogContext()
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground hover:bg-destructive/90",
        className
      )}
      onClick={() => {
        onConfirm()
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

function AlertDialogCancel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { setOpen } = useAlertDialogContext()
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted",
        className
      )}
      onClick={() => setOpen(false)}
    >
      {children}
    </button>
  )
}

function AlertDialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex justify-end gap-2 mt-4", className)}>
      {children}
    </div>
  )
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
}
