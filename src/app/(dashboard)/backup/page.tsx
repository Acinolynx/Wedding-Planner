"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, RotateCcw, CheckCircle, AlertCircle, Loader2, FileJson } from "lucide-react"
import { toast } from "sonner"

type RestoreResult = {
  sheet: string
  status: "restored" | "failed" | "skipped"
  error?: string
}

type RestoreSummary = {
  total: number
  restored: number
  failed: number
  skipped: number
}

const SHEET_LABELS: Record<string, string> = {
  Tamu: "Daftar Tamu",
  Budget: "Budget",
  Vendor: "Vendor",
  Checklist: "Checklist",
  Config: "Konfigurasi",
  "Tata Letak": "Tata Letak Meja",
  Moodboard: "Moodboard",
}

export default function BackupPage() {
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [results, setResults] = useState<RestoreResult[] | null>(null)
  const [summary, setSummary] = useState<RestoreSummary | null>(null)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/backup")
      if (!res.ok) throw new Error("Failed to export backup")
      const json = await res.json()

      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `wedding-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Backup berhasil diunduh")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal export backup")
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(file: File) {
    setRestoring(true)
    setResults(null)
    setSummary(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.data) {
        throw new Error("File backup tidak valid")
      }

      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to restore backup")
      }

      const json = await res.json()
      setResults(json.results)
      setSummary(json.summary)

      if (json.summary.failed === 0) {
        toast.success("Backup berhasil dipulihkan")
      } else {
        toast.error(`${json.summary.failed} sheet gagal dipulihkan`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal import backup")
    } finally {
      setRestoring(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImport(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backup & Restore</h1>
        <p className="text-sm text-muted-foreground">
          Export semua data sebagai JSON atau restore dari file backup
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Export Backup
            </CardTitle>
            <CardDescription>
              Unduh semua data (tamu, budget, vendor, checklist, config, tata letak, moodboard) sebagai file JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              {exporting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 size-4" />
                  Unduh Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Restore Backup
            </CardTitle>
            <CardDescription>
              Pulihkan semua data dari file JSON backup yang pernah diunduh sebelumnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="block">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
                disabled={restoring}
              />
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                disabled={restoring}
                onClick={(e) => {
                  e.preventDefault()
                  const input = e.currentTarget.parentElement?.querySelector("input")
                  input?.click()
                }}
              >
                {restoring ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Memulihkan...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 size-4" />
                    Pilih File Backup
                  </>
                )}
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Restore Results */}
      {results && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {summary.failed === 0 ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <AlertCircle className="size-5 text-red-600" />
              )}
              Hasil Restore
            </CardTitle>
            <CardDescription>
              {summary.restored}/{summary.total} sheet berhasil dipulihkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.sheet}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {result.status === "restored" && (
                      <CheckCircle className="size-4 text-green-600" />
                    )}
                    {result.status === "failed" && (
                      <AlertCircle className="size-4 text-red-600" />
                    )}
                    {result.status === "skipped" && (
                      <Badge variant="default" className="bg-muted text-muted-foreground">
                        Skip
                      </Badge>
                    )}
                    <span className="text-sm font-medium">
                      {SHEET_LABELS[result.sheet] || result.sheet}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        result.status === "restored"
                          ? "success"
                          : result.status === "failed"
                            ? "danger"
                            : "default"
                      }
                    >
                      {result.status === "restored"
                        ? "Berhasil"
                        : result.status === "failed"
                          ? "Gagal"
                          : "Dilewati"}
                    </Badge>
                    {result.error && (
                      <span className="text-xs text-red-600">{result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
