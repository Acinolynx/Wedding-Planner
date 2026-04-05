"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import type { TimelineEvent } from "@/types"
import { Plus, Pencil, Trash2, RotateCcw, Clock, MapPin, FileText, Calendar } from "lucide-react"
import { toast } from "sonner"

const emptyEvent: Omit<TimelineEvent, "id" | "urutan"> = {
  waktu: "",
  judul: "",
  lokasi: "",
  catatan: "",
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [editRowIndex, setEditRowIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyEvent)
  const [submitting, setSubmitting] = useState(false)
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/sheets/timeline")
      if (!res.ok) {
        setInitError("Timeline belum diinisialisasi")
        setEvents([])
        return
      }
      const json = await res.json()
      setEvents(json.data)
    } catch {
      setError("Gagal memuat data timeline")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  async function handleInitTimeline() {
    try {
      setInitError(null)
      const res = await fetch("/api/sheets/timeline", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to init timeline")
      await fetchEvents()
    } catch {
      setInitError("Gagal menginisialisasi timeline")
    }
  }

  function handleAdd() {
    setEditingEvent(null)
    setEditRowIndex(null)
    setFormData(emptyEvent)
    setSheetOpen(true)
  }

  function handleEdit(event: TimelineEvent, rowIndex: number) {
    setEditingEvent(event)
    setEditRowIndex(rowIndex)
    setFormData({
      waktu: event.waktu,
      judul: event.judul,
      lokasi: event.lokasi || "",
      catatan: event.catatan || "",
    })
    setSheetOpen(true)
  }

  function handleDelete(rowIndex: number) {
    setDeleteRowIndex(rowIndex)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (deleteRowIndex === null) return
    try {
      const res = await fetch(`/api/sheets/timeline?rowIndex=${deleteRowIndex}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete event")
      const json = await res.json()
      toast.success("Acara berhasil dihapus")
      setEvents(json.data)
    } catch {
      toast.error("Gagal menghapus acara")
    } finally {
      setDeleteOpen(false)
      setDeleteRowIndex(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const maxUrutan = events.length > 0 ? Math.max(...events.map((ev) => ev.urutan)) : 0
      if (editingEvent) {
        const res = await fetch("/api/sheets/timeline", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowIndex: editRowIndex,
            id: editingEvent.id,
            ...formData,
            urutan: editingEvent.urutan,
          }),
        })
        if (!res.ok) throw new Error("Failed to update event")
        const json = await res.json()
        toast.success("Acara berhasil diperbarui")
        setEvents(json.data)
      } else {
        const res = await fetch("/api/sheets/timeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            urutan: maxUrutan + 1,
          }),
        })
        if (!res.ok) throw new Error("Failed to add event")
        const json = await res.json()
        toast.success("Acara berhasil ditambahkan")
        setEvents(json.data)
      }
      setSheetOpen(false)
    } catch {
      toast.error("Gagal menyimpan acara")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchEvents}>
          <RotateCcw className="mr-2 size-4" />
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline Hari H</h1>
          <p className="text-sm text-muted-foreground">Atur jadwal acara pernikahan Anda</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Calendar className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Timeline Belum Diinisialisasi</p>
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk membuat tab Timeline di Google Sheets
              </p>
            </div>
            <Button onClick={handleInitTimeline}>
              <Plus className="mr-2 size-4" />
              Inisialisasi Timeline
            </Button>
            {initError && (
              <p className="text-sm text-destructive">{initError}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline Hari H</h1>
          <p className="text-sm text-muted-foreground">
            Jadwal acara pernikahan dari awal hingga akhir
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          Tambah Acara
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Clock className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Belum Ada Acara</p>
              <p className="text-sm text-muted-foreground">
                Klik &quot;Tambah Acara&quot; untuk mulai mengatur jadwal hari H
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border md:left-6" />

          <div className="space-y-6">
            {events.map((event, rowIndex) => (
              <div key={event.id} className="relative flex gap-4 md:gap-6">
                {/* Dot */}
                <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background md:size-10">
                  <div className="size-2 rounded-full bg-primary md:size-3" />
                </div>

                {/* Content */}
                <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                          <Clock className="size-3.5" />
                          {event.waktu}
                        </span>
                        <h3 className="font-semibold">{event.judul}</h3>
                      </div>
                      {event.lokasi && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {event.lokasi}
                        </p>
                      )}
                      {event.catatan && (
                        <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                          <FileText className="mt-0.5 size-3.5 shrink-0" />
                          {event.catatan}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(event, rowIndex)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDelete(rowIndex)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingEvent ? "Edit Acara" : "Tambah Acara Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmit}>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waktu">Waktu *</Label>
                <Input
                  id="waktu"
                  type="time"
                  value={formData.waktu}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, waktu: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="judul">Judul Acara *</Label>
                <Input
                  id="judul"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, judul: e.target.value }))
                  }
                  placeholder="contoh: Akad Nikah, Resepsi, dll."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lokasi">Lokasi</Label>
                <Input
                  id="lokasi"
                  value={formData.lokasi}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lokasi: e.target.value }))
                  }
                  placeholder="contoh: Gedung Serbaguna"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, catatan: e.target.value }))
                  }
                  placeholder="Detail tambahan..."
                  rows={3}
                />
              </div>
            </SheetBody>
            <SheetFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Menyimpan..."
                  : editingEvent
                    ? "Simpan"
                    : "Tambah"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Acara?</AlertDialogTitle>
          <AlertDialogDescription>
            Acara ini akan dihapus secara permanen dari timeline. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
