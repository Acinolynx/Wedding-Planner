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
import type { Vendor } from "@/types"
import { Pencil, Trash2, Plus, RotateCcw, Download } from "lucide-react"
import { exportToExcel } from "@/lib/export"

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

function getLunasBadge(lunas: boolean) {
  return lunas
    ? <Badge variant="success">Lunas</Badge>
    : <Badge variant="danger">Belum</Badge>
}

const categories = [
  "Venue",
  "Catering",
  "Fotografer",
  "Videografer",
  "Dekorasi",
  "MC",
  "Band/Musik",
  "Makeup",
  "Busana",
  "Undangan",
  "Lainnya",
]

const emptyVendor: Omit<Vendor, "id"> = {
  nama: "",
  kategori: "",
  kontak: "",
  telepon: "",
  harga: 0,
  dp_dibayar: 0,
  lunas: false,
  tanggal_kontrak: "",
  catatan: "",
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterKategori, setFilterKategori] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState(emptyVendor)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/sheets/vendors")
      if (!res.ok) throw new Error("Failed to fetch vendors")
      const json = await res.json()
      setVendors(json.vendors)
    } catch {
      setError("Gagal memuat data vendor")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const filtered = vendors.filter((v) => {
    const matchSearch =
      v.nama.toLowerCase().includes(search.toLowerCase()) ||
      v.kategori.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterKategori === "all" || v.kategori === filterKategori
    return matchSearch && matchFilter
  })

  const totalHarga = vendors.reduce((sum, v) => sum + v.harga, 0)
  const lunasCount = vendors.filter((v) => v.lunas).length

  function handleAdd() {
    setEditingVendor(null)
    setFormData(emptyVendor)
    setSheetOpen(true)
  }

  function handleEdit(vendor: Vendor) {
    setEditingVendor(vendor)
    setFormData({
      nama: vendor.nama,
      kategori: vendor.kategori,
      kontak: vendor.kontak || "",
      telepon: vendor.telepon || "",
      harga: vendor.harga,
      dp_dibayar: vendor.dp_dibayar,
      lunas: vendor.lunas,
      tanggal_kontrak: vendor.tanggal_kontrak || "",
      catatan: vendor.catatan || "",
    })
    setSheetOpen(true)
  }

  function handleDelete(vendor: Vendor) {
    setDeleteId(vendor.id)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/sheets/vendors?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete vendor")
      await fetchVendors()
    } catch {
      alert("Gagal menghapus vendor")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const method = editingVendor ? "PUT" : "POST"
      const body = editingVendor ? { id: editingVendor.id, ...formData } : formData
      const res = await fetch("/api/sheets/vendors", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save vendor")
      setSheetOpen(false)
      await fetchVendors()
    } catch {
      alert("Gagal menyimpan vendor")
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: string, value: string | number | boolean | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Vendor",
          headers: ["Nama", "Kategori", "Kontak", "Telepon", "Harga", "DP Dibayar", "Lunas", "Tanggal Kontrak", "Catatan"],
          rows: filtered.map((v) => ({
            Nama: v.nama,
            Kategori: v.kategori,
            Kontak: v.kontak,
            Telepon: v.telepon,
            Harga: v.harga,
            "DP Dibayar": v.dp_dibayar,
            Lunas: v.lunas ? "Ya" : "Tidak",
            "Tanggal Kontrak": v.tanggal_kontrak,
            Catatan: v.catatan,
          })),
        },
      ],
      "vendor"
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
        <Button onClick={fetchVendors}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Vendor Manager</h1>
          <p className="text-sm text-muted-foreground">Kelola vendor pernikahan Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export Excel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Tambah Vendor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Vendor</p>
            <p className="text-2xl font-bold">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Harga</p>
            <p className="text-xl font-bold">{formatRupiah(totalHarga)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Sudah Lunas</p>
            <p className="text-2xl font-bold text-green-600">{lunasCount}/{vendors.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari nama atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="max-w-[180px]"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead className="text-right">DP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                {search || filterKategori !== "all"
                  ? "Tidak ada vendor yang cocok dengan filter"
                  : "Belum ada vendor. Klik \"Tambah Vendor\" untuk menambah."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.nama}</TableCell>
                <TableCell>{vendor.kategori}</TableCell>
                <TableCell>{vendor.kontak || "-"}</TableCell>
                <TableCell>{vendor.telepon || "-"}</TableCell>
                <TableCell className="text-right">{formatRupiah(vendor.harga)}</TableCell>
                <TableCell className="text-right">{formatRupiah(vendor.dp_dibayar)}</TableCell>
                <TableCell>{getLunasBadge(vendor.lunas)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(vendor)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor)}>
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
              {editingVendor ? "Edit Vendor" : "Tambah Vendor Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmit}>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Vendor *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => updateField("nama", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Select
                  id="kategori"
                  value={formData.kategori}
                  onChange={(e) => updateField("kategori", e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kontak">Kontak Person</Label>
                <Input
                  id="kontak"
                  value={formData.kontak}
                  onChange={(e) => updateField("kontak", e.target.value)}
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
                <Label htmlFor="harga">Harga (Rp)</Label>
                <Input
                  id="harga"
                  type="number"
                  min={0}
                  value={formData.harga}
                  onChange={(e) => updateField("harga", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dp_dibayar">DP Dibayar (Rp)</Label>
                <Input
                  id="dp_dibayar"
                  type="number"
                  min={0}
                  value={formData.dp_dibayar}
                  onChange={(e) => updateField("dp_dibayar", Number(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="lunas">Sudah Lunas</Label>
                <Switch
                  id="lunas"
                  checked={formData.lunas}
                  onChange={(e) => updateField("lunas", e.target.checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_kontrak">Tanggal Kontrak</Label>
                <Input
                  id="tanggal_kontrak"
                  type="date"
                  value={formData.tanggal_kontrak}
                  onChange={(e) => updateField("tanggal_kontrak", e.target.value)}
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
                {submitting ? "Menyimpan..." : editingVendor ? "Simpan" : "Tambah"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Vendor?</AlertDialogTitle>
          <AlertDialogDescription>
            Vendor ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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
