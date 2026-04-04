"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, Heart, X } from "lucide-react"

type GuestSearchResult = {
  id: string
  nama: string
  rsvp_status: string
  jumlah_hadir: number
  pilihan_makan: string
  catatan: string
}

export default function RSVPPage() {
  const [searchName, setSearchName] = useState("")
  const [searchResults, setSearchResults] = useState<GuestSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<GuestSearchResult | null>(null)
  const [formData, setFormData] = useState({
    rsvp_status: "confirmed",
    jumlah_hadir: 1,
    pilihan_makan: "",
    catatan: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  const autoSearch = useCallback(async (name: string) => {
    if (name.length < 2) {
      setSearchResults([])
      return
    }
    try {
      setSearching(true)
      const res = await fetch(`/api/rsvp?name=${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error("Failed to search")
      const json = await res.json()
      setSearchResults(json.guests || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")
    const name = params.get("name")

    if (id && name) {
      autoSearch(name)
      const timer = setTimeout(() => {
        setSearchResults((prev) => {
          const match = prev.find((g) => g.id === id)
          if (match) {
            setSelectedGuest(match)
            setSearchResults([])
            setSearchName(match.nama)
            setFormData({
              rsvp_status: match.rsvp_status === "confirmed" ? "confirmed" : "pending",
              jumlah_hadir: match.jumlah_hadir || 1,
              pilihan_makan: match.pilihan_makan || "",
              catatan: match.catatan || "",
            })
          }
          setInitialLoading(false)
          return prev
        })
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setInitialLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectGuest(guest: GuestSearchResult) {
    setSelectedGuest(guest)
    setSearchResults([])
    setSearchName(guest.nama)
    setFormData({
      rsvp_status: guest.rsvp_status === "confirmed" ? "confirmed" : "pending",
      jumlah_hadir: guest.jumlah_hadir || 1,
      pilihan_makan: guest.pilihan_makan || "",
      catatan: guest.catatan || "",
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGuest) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGuest.id,
          ...formData,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to submit RSVP")
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim RSVP")
    } finally {
      setSubmitting(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
            <Skeleton className="mt-4 h-6 w-48 mx-auto" />
            <Skeleton className="mt-2 h-4 w-64 mx-auto" />
            <Skeleton className="mt-6 h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Terima Kasih!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              RSVP Anda telah berhasil dikirim.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formData.rsvp_status === "confirmed"
                ? "Kami menantikan kehadiran Anda!"
                : "Mohon maaf Anda tidak bisa hadir."}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSubmitted(false)
                setSelectedGuest(null)
                setSearchName("")
                setFormData({ rsvp_status: "confirmed", jumlah_hadir: 1, pilihan_makan: "", catatan: "" })
              }}
            >
              RSVP Ulang
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-pink-100">
            <Heart className="size-6 text-pink-600" />
          </div>
          <CardTitle className="mt-3">RSVP Pernikahan</CardTitle>
          <CardDescription>Konfirmasi kehadiran Anda di bawah ini</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedGuest ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Cari Nama Anda</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Ketik nama Anda..."
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value)
                      autoSearch(e.target.value)
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {searching && (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {searchResults.length} hasil ditemukan
                  </p>
                  {searchResults.map((guest) => (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => selectGuest(guest)}
                      className="flex w-full items-center justify-between rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="text-sm font-medium">{guest.nama}</p>
                        {guest.rsvp_status && (
                          <Badge
                            variant={
                              guest.rsvp_status === "confirmed"
                                ? "success"
                                : guest.rsvp_status === "declined"
                                  ? "danger"
                                  : "warning"
                            }
                            className="mt-1 text-xs"
                          >
                            {guest.rsvp_status === "confirmed"
                              ? "Confirmed"
                              : guest.rsvp_status === "declined"
                                ? "Declined"
                                : "Pending"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Pilih &rarr;</span>
                    </button>
                  ))}
                </div>
              )}

              {searchName.length >= 2 && searchResults.length === 0 && !searching && (
                <p className="text-center text-sm text-muted-foreground">
                  Nama tidak ditemukan. Pastikan ejaan benar.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <div>
                  <p className="text-xs text-muted-foreground">RSVP untuk</p>
                  <p className="text-sm font-semibold">{selectedGuest.nama}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedGuest(null)
                    setSearchName("")
                    setSearchResults([])
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Konfirmasi Kehadiran</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "confirmed", label: "Hadir" },
                    { value: "pending", label: "Mungkin" },
                    { value: "declined", label: "Tidak" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, rsvp_status: opt.value }))
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        formData.rsvp_status === opt.value
                          ? opt.value === "confirmed"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : opt.value === "declined"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.rsvp_status !== "declined" && (
                <div className="space-y-2">
                  <Label htmlFor="jumlah_hadir">Jumlah Hadir</Label>
                  <Input
                    id="jumlah_hadir"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.jumlah_hadir}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        jumlah_hadir: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pilihan_makan">Pilihan Makan</Label>
                <Input
                  id="pilihan_makan"
                  placeholder="Contoh: Nasi goreng, Ayam bakar..."
                  value={formData.pilihan_makan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pilihan_makan: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  placeholder="Alergi makanan, permintaan khusus, dll."
                  value={formData.catatan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, catatan: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Mengirim..." : "Kirim RSVP"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
