"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeddingConfig } from "@/types"
import { RotateCcw, Check } from "lucide-react"

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

const emptyConfig: WeddingConfig = {
  tanggal_pernikahan: "",
  nama_pengantin_1: "",
  nama_pengantin_2: "",
  venue: "",
  total_budget: 0,
  target_tamu: 0,
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyConfig)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/sheets/config")
      if (!res.ok) throw new Error("Failed to fetch config")
      const json = await res.json()
      if (json.config) {
        setFormData(json.config)
      }
    } catch {
      setError("Gagal memuat pengaturan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSaved(false)
    try {
      const res = await fetch("/api/sheets/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Failed to save config")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert("Gagal menyimpan pengaturan")
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchConfig}>
          <RotateCcw className="mr-2 size-4" />
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Atur informasi dasar pernikahan Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Info Pernikahan */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pernikahan</CardTitle>
              <CardDescription>
                Data ini akan digunakan untuk dashboard dan countdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tanggal_pernikahan">Tanggal Pernikahan *</Label>
                  <Input
                    id="tanggal_pernikahan"
                    type="date"
                    value={formData.tanggal_pernikahan}
                    onChange={(e) => updateField("tanggal_pernikahan", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => updateField("venue", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nama_pengantin_1">Nama Pengantin 1 *</Label>
                  <Input
                    id="nama_pengantin_1"
                    value={formData.nama_pengantin_1}
                    onChange={(e) => updateField("nama_pengantin_1", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama_pengantin_2">Nama Pengantin 2 *</Label>
                  <Input
                    id="nama_pengantin_2"
                    value={formData.nama_pengantin_2}
                    onChange={(e) => updateField("nama_pengantin_2", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget & Target */}
          <Card>
            <CardHeader>
              <CardTitle>Budget & Target Tamu</CardTitle>
              <CardDescription>
                Angka ini akan ditampilkan di dashboard overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total_budget">Total Budget (Rp)</Label>
                  <Input
                    id="total_budget"
                    type="number"
                    min={0}
                    value={formData.total_budget}
                    onChange={(e) => updateField("total_budget", Number(e.target.value))}
                  />
                  {formData.total_budget > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(formData.total_budget)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_tamu">Target Jumlah Tamu</Label>
                  <Input
                    id="target_tamu"
                    type="number"
                    min={0}
                    value={formData.target_tamu}
                    onChange={(e) => updateField("target_tamu", Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {saved ? (
                <Check className="mr-2 size-4" />
              ) : null}
              {submitting ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Pengaturan"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
