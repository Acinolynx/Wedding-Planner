"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import type { Guest, RSVPStatus } from "@/types"
import { Pencil, Trash2, Plus, RotateCcw, Download, QrCode, Copy, Share2 } from "lucide-react"
import { exportToExcel } from "@/lib/export"
import { toast } from "sonner"
import { GuestCard } from "@/components/app/mobile-cards"
import { QRCodeSVG } from "qrcode.react"

function getRsvpBadge(status: RSVPStatus) {
  const map: Record<RSVPStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
    confirmed: { label: "Confirmed", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    declined: { label: "Declined", variant: "danger" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

const emptyGuest: Omit<Guest, "id"> = {
  nama: "",
  telepon: "",
  email: "",
  undangan_dikirim: false,
  rsvp_status: "pending",
  jumlah_hadir: 0,
  pilihan_makan: "",
  nomor_meja: undefined,
  catatan: "",
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [formData, setFormData] = useState(emptyGuest)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [qrGuest, setQrGuest] = useState<Guest | null>(null)

  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/sheets/guests")
      if (!res.ok) throw new Error("Failed to fetch guests")
      const json = await res.json()
      setGuests(json.guests)
    } catch {
      setError("Gagal memuat data tamu")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  const filtered = guests.filter((g) => {
    const matchSearch = g.nama.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterStatus === "all" || g.rsvp_status === filterStatus
    return matchSearch && matchFilter
  })

  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvp_status === "confirmed").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
    declined: guests.filter((g) => g.rsvp_status === "declined").length,
  }

  function handleAdd() {
    setEditingGuest(null)
    setFormData(emptyGuest)
    setSheetOpen(true)
  }

  function handleEdit(guest: Guest) {
    setEditingGuest(guest)
    setFormData({
      nama: guest.nama,
      telepon: guest.telepon || "",
      email: guest.email || "",
      undangan_dikirim: guest.undangan_dikirim,
      rsvp_status: guest.rsvp_status,
      jumlah_hadir: guest.jumlah_hadir,
      pilihan_makan: guest.pilihan_makan || "",
      nomor_meja: guest.nomor_meja,
      catatan: guest.catatan || "",
    })
    setSheetOpen(true)
  }

  function handleDelete(guest: Guest) {
    setDeleteId(guest.id)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/sheets/guests?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete guest")
      toast.success("Tamu berhasil dihapus")
      await fetchGuests()
    } catch {
      toast.error("Gagal menghapus tamu")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const method = editingGuest ? "PUT" : "POST"
      const body = editingGuest ? { id: editingGuest.id, ...formData } : formData
      const res = await fetch("/api/sheets/guests", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save guest")
      setSheetOpen(false)
      toast.success(editingGuest ? "Tamu berhasil diperbarui" : "Tamu berhasil ditambahkan")
      await fetchGuests()
    } catch {
      toast.error("Gagal menyimpan tamu")
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: string, value: string | number | boolean | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleCopyRsvpLink(guest: Guest) {
    const url = getRsvpLink(guest)
    navigator.clipboard.writeText(url)
    toast.success("Link RSVP berhasil disalin")
  }

  function getRsvpLink(guest: Guest) {
    const baseUrl = window.location.origin
    return `${baseUrl}/rsvp?id=${guest.id}&name=${encodeURIComponent(guest.nama)}`
  }

  function handleShowQR(guest: Guest) {
    setQrGuest(guest)
  }

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Tamu",
          headers: ["Nama", "Telepon", "Email", "Undangan Dikirim", "RSVP Status", "Jumlah Hadir", "Pilihan Makan", "Nomor Meja", "Catatan"],
          rows: filtered.map((g) => ({
            Nama: g.nama,
            Telepon: g.telepon,
            Email: g.email,
            "Undangan Dikirim": g.undangan_dikirim ? "Ya" : "Tidak",
            "RSVP Status": g.rsvp_status,
            "Jumlah Hadir": g.jumlah_hadir,
            "Pilihan Makan": g.pilihan_makan,
            "Nomor Meja": g.nomor_meja ?? "",
            Catatan: g.catatan,
          })),
        },
      ],
      "daftar-tamu"
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchGuests}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Daftar Tamu</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar tamu undangan pernikahan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export Excel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Tambah Tamu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Tamu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari nama tamu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="max-w-[180px]"
        >
          <option value="all">Semua Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </Select>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {search || filterStatus !== "all"
              ? "Tidak ada tamu yang cocok dengan filter"
              : "Belum ada tamu. Klik \"Tambah Tamu\" untuk menambah."}
          </div>
        ) : (
          filtered.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyLink={handleCopyRsvpLink}
              onShowQR={handleShowQR}
            />
          ))
        )}
      </div>

      {/* Desktop table view */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>RSVP Status</TableHead>
            <TableHead className="text-center">Jumlah Hadir</TableHead>
            <TableHead className="text-center">Nomor Meja</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                {search || filterStatus !== "all"
                  ? "Tidak ada tamu yang cocok dengan filter"
                  : "Belum ada tamu. Klik \"Tambah Tamu\" untuk menambah."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.nama}</TableCell>
                <TableCell>{guest.telepon || "-"}</TableCell>
                <TableCell>{getRsvpBadge(guest.rsvp_status)}</TableCell>
                <TableCell className="text-center">{guest.jumlah_hadir}</TableCell>
                <TableCell className="text-center">{guest.nomor_meja ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleShowQR(guest)} title="Lihat QR Code">
                      <QrCode className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyRsvpLink(guest)} title="Salin link RSVP">
                      <Copy className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(guest)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(guest)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {editingGuest ? "Edit Tamu" : "Tambah Tamu Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmit}>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => updateField("nama", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  value={formData.telepon}
                  onChange={(e) => updateField("telepon", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvp_status">RSVP Status</Label>
                <Select
                  id="rsvp_status"
                  value={formData.rsvp_status}
                  onChange={(e) => updateField("rsvp_status", e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlah_hadir">Jumlah Hadir</Label>
                <Input
                  id="jumlah_hadir"
                  type="number"
                  min={0}
                  value={formData.jumlah_hadir}
                  onChange={(e) => updateField("jumlah_hadir", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pilihan_makan">Pilihan Makan</Label>
                <Input
                  id="pilihan_makan"
                  value={formData.pilihan_makan}
                  onChange={(e) => updateField("pilihan_makan", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor_meja">Nomor Meja</Label>
                <Input
                  id="nomor_meja"
                  type="number"
                  min={1}
                  value={formData.nomor_meja ?? ""}
                  onChange={(e) =>
                    updateField("nomor_meja", e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="undangan_dikirim">Undangan Dikirim</Label>
                <Switch
                  id="undangan_dikirim"
                  checked={formData.undangan_dikirim}
                  onChange={(e) => updateField("undangan_dikirim", e.target.checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) => updateField("catatan", e.target.value)}
                  rows={3}
                />
              </div>
            </SheetBody>
            <SheetFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : editingGuest ? "Simpan" : "Tambah"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Tamu?</AlertDialogTitle>
          <AlertDialogDescription>
            Tamu ini akan dihapus secara permanen dari daftar. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      {qrGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-center text-lg font-semibold">QR Code RSVP</h2>
            <div className="mt-4 flex flex-col items-center gap-4">
              <div className="rounded-lg border bg-white p-4">
                <QRCodeSVG
                  value={getRsvpLink(qrGuest)}
                  size={200}
                  level="M"
                />
              </div>
              <div className="w-full text-center">
                <p className="text-sm font-medium">{qrGuest.nama}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {getRsvpLink(qrGuest)}
                </p>
              </div>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(getRsvpLink(qrGuest))
                    toast.success("Link berhasil disalin")
                  }}
                >
                  <Copy className="mr-1.5 size-3.5" />
                  Salin Link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    const url = getRsvpLink(qrGuest)
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `RSVP Pernikahan - ${qrGuest.nama}`,
                          url,
                        })
                      } catch {
                        // user cancelled share
                      }
                    } else {
                      navigator.clipboard.writeText(url)
                      toast.success("Link berhasil disalin")
                    }
                  }}
                >
                  <Share2 className="mr-1.5 size-3.5" />
                  Bagikan
                </Button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setQrGuest(null)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
