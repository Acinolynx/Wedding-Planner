"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import type { MoodboardNote, MoodboardCategory } from "@/types"
import {
  Plus,
  Pencil,
  Trash2,
  ImageOff,
  RotateCcw,
  ExternalLink,
  Palette,
} from "lucide-react"

const CATEGORIES: { value: MoodboardCategory; label: string; color: string }[] = [
  { value: "dekorasi", label: "Dekorasi", color: "bg-blue-500" },
  { value: "busana", label: "Busana", color: "bg-purple-500" },
  { value: "fotografi", label: "Fotografi", color: "bg-pink-500" },
  { value: "venue", label: "Venue", color: "bg-green-500" },
  { value: "bunga", label: "Bunga", color: "bg-rose-500" },
  { value: "kue", label: "Kue", color: "bg-amber-500" },
  { value: "undangan", label: "Undangan", color: "bg-cyan-500" },
  { value: "warna", label: "Palet Warna", color: "bg-orange-500" },
  { value: "lainnya", label: "Lainnya", color: "bg-gray-500" },
]

function getCategoryBadge(kategori: MoodboardCategory) {
  const cat = CATEGORIES.find((c) => c.value === kategori)
  if (!cat) return <Badge variant="default">Lainnya</Badge>
  return (
    <Badge variant="default" className={`${cat.color} border-0 text-white`}>
      {cat.label}
    </Badge>
  )
}

const emptyNote: Omit<MoodboardNote, "id" | "tanggal_dibuat"> = {
  judul: "",
  kategori: "lainnya",
  gambar_url: "",
  catatan: "",
}

function generateId() {
  return `mb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function MoodboardPage() {
  const [notes, setNotes] = useState<MoodboardNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<MoodboardNote | null>(null)
  const [editRowIndex, setEditRowIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyNote)
  const [submitting, setSubmitting] = useState(false)
  const [deleteRowIndex, setDeleteRowIndex] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/sheets/moodboard")
      if (!res.ok) throw new Error("Failed to fetch moodboard notes")
      const json = await res.json()
      setNotes(json.data)
      setImageErrors({})
    } catch {
      setError("Gagal memuat data moodboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function handleInitMoodboard() {
    try {
      setInitError(null)
      const res = await fetch("/api/sheets/moodboard", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to init moodboard")
      await fetchNotes()
    } catch {
      setInitError("Gagal menginisialisasi moodboard")
    }
  }

  const filtered = notes.filter((n) => {
    const matchSearch =
      n.judul.toLowerCase().includes(search.toLowerCase()) ||
      n.catatan.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterCategory === "all" || n.kategori === filterCategory
    return matchSearch && matchFilter
  })

  const stats = {
    total: notes.length,
    withImage: notes.filter((n) => n.gambar_url).length,
    categories: new Set(notes.map((n) => n.kategori)).size,
  }

  function handleAdd() {
    setEditingNote(null)
    setEditRowIndex(null)
    setFormData(emptyNote)
    setSheetOpen(true)
  }

  function handleEdit(note: MoodboardNote, rowIndex: number) {
    setEditingNote(note)
    setEditRowIndex(rowIndex)
    setFormData({
      judul: note.judul,
      kategori: note.kategori,
      gambar_url: note.gambar_url || "",
      catatan: note.catatan,
    })
    setSheetOpen(true)
  }

  function handleDelete(note: MoodboardNote, rowIndex: number) {
    setDeleteRowIndex(rowIndex)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (deleteRowIndex === null) return
    try {
      const res = await fetch(`/api/sheets/moodboard?rowIndex=${deleteRowIndex}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete note")
      const json = await res.json()
      setNotes(json.data)
    } catch {
      alert("Gagal menghapus catatan")
    } finally {
      setDeleteOpen(false)
      setDeleteRowIndex(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingNote) {
        const res = await fetch("/api/sheets/moodboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowIndex: editRowIndex,
            id: editingNote.id,
            ...formData,
            tanggal_dibuat: editingNote.tanggal_dibuat,
          }),
        })
        if (!res.ok) throw new Error("Failed to update note")
        const json = await res.json()
        setNotes(json.data)
      } else {
        const res = await fetch("/api/sheets/moodboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: generateId(),
            ...formData,
          }),
        })
        if (!res.ok) throw new Error("Failed to add note")
        const json = await res.json()
        setNotes(json.data)
      }
      setSheetOpen(false)
    } catch {
      alert("Gagal menyimpan catatan")
    } finally {
      setSubmitting(false)
    }
  }

  function handleImageError(noteId: string) {
    setImageErrors((prev) => ({ ...prev, [noteId]: true }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchNotes}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Moodboard & Catatan</h1>
          <p className="text-sm text-muted-foreground">Kumpulkan inspirasi dan catatan pernikahan</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Palette className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Moodboard Belum Diinisialisasi</p>
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk membuat tab Moodboard di Google Sheets
              </p>
            </div>
            <Button onClick={handleInitMoodboard}>
              <Plus className="mr-2 size-4" />
              Inisialisasi Moodboard
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
          <h1 className="text-2xl font-semibold tracking-tight">Moodboard & Catatan</h1>
          <p className="text-sm text-muted-foreground">
            Kumpulkan inspirasi dan catatan untuk pernikahan
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          Tambah Catatan
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Catatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.withImage}
            </div>
            <p className="text-xs text-muted-foreground">Dengan Gambar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {stats.categories}
            </div>
            <p className="text-xs text-muted-foreground">Kategori Aktif</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari judul atau catatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex h-9 w-full max-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Semua Kategori</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <ImageOff className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">
                {notes.length === 0
                  ? "Belum Ada Catatan"
                  : "Tidak Ada yang Cocok"}
              </p>
              <p className="text-sm text-muted-foreground">
                {notes.length === 0
                  ? 'Klik "Tambah Catatan" untuk mulai mengumpulkan inspirasi'
                  : "Coba ubah filter atau kata kunci pencarian"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {filtered.map((note, rowIndex) => (
            <div
              key={note.id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {note.gambar_url && !imageErrors[note.id] ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={note.gambar_url}
                    alt={note.judul}
                    className="w-full object-cover"
                    onError={() => handleImageError(note.id)}
                    loading="lazy"
                  />
                  <a
                    href={note.gambar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 opacity-0 transition-opacity hover:bg-background"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              ) : null}

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{note.judul}</h3>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleEdit(note, rowIndex)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleDelete(note, rowIndex)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mb-2">{getCategoryBadge(note.kategori)}</div>

                {note.catatan && (
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {note.catatan}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  {note.tanggal_dibuat}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingNote ? "Edit Catatan" : "Tambah Catatan Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmit}>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul *</Label>
                <Input
                  id="judul"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, judul: e.target.value }))
                  }
                  placeholder="contoh: Dekorasi Rustic Outdoor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <select
                  id="kategori"
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kategori: e.target.value as MoodboardCategory,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gambar_url">URL Gambar</Label>
                <Input
                  id="gambar_url"
                  type="url"
                  value={formData.gambar_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gambar_url: e.target.value }))
                  }
                  placeholder="https://contoh.com/gambar.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Paste URL gambar dari Google Drive, Imgur, atau sumber lainnya
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, catatan: e.target.value }))
                  }
                  placeholder="Tambahkan catatan atau deskripsi..."
                  rows={4}
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
                  : editingNote
                    ? "Simpan"
                    : "Tambah"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
          <AlertDialogDescription>
            Catatan ini akan dihapus secara permanen dari moodboard. Tindakan ini tidak dapat dibatalkan.
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
