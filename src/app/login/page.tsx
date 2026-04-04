"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Heart } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-900/10" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-900/10" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8 px-6">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-purple-500 shadow-lg shadow-rose-500/25 dark:shadow-rose-500/10">
            <Heart className="size-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Wedding Planner
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola pernikahan impian Anda dengan mudah
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">Masuk</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Sign in button */}
        <Button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md transition-all hover:from-rose-600 hover:to-purple-700 hover:shadow-lg"
          size="lg"
        >
          <svg className="mr-2 size-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Masuk dengan Google
        </Button>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Hanya untuk penggunaan pribadi
        </p>
      </div>
    </div>
  )
}
