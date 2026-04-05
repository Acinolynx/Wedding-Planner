"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
import type { BudgetItem, PaymentStatus } from "@/types"
import { Pencil, Trash2, Plus, RotateCcw, Download } from "lucide-react"
import { exportToExcel } from "@/lib/export"
import { formatRupiah } from "@/lib/utils"
import { toast } from "sonner"
import { BudgetCard } from "@/components/app/mobile-cards"

function getStatusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
    lunas: { label: "Lunas", variant: "success" },
    dp: { label: "DP", variant: "warning" },
    belum: { label: "Belum", variant: "danger" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

const categories = [
  "Venue",
  "Catering",
  "Dekorasi",
  "Busana",
  "Fotografi",
  "Hiburan",
  "Undangan",
  "Lainnya",
]

const emptyItem: Omit<BudgetItem, "id"> = {
  kategori: "",
  item: "",
  estimasi: 0,
  realisasi: 0,
  status_bayar: "belum",
  vendor: "",
  tanggal_bayar: "",
  catatan: "",
}

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterKategori, setFilterKategori] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [formData, setFormData] = useState(emptyItem)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/sheets/budget")
      if (!res.ok) throw new Error("Failed to fetch budget")
      const json = await res.json()
      setItems(json.budget)
    } catch {
      setError("Gagal memuat data budget")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = items.filter((item) => {
    const matchSearch =
      item.item.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filterKategori === "all" || item.kategori === filterKategori
    return matchSearch && matchFilter
  })

  const totalEstimasi = items.reduce((sum, i) => sum + i.estimasi, 0)
  const totalRealisasi = items.reduce((sum, i) => sum + i.realisasi, 0)
  const remaining = totalEstimasi - totalRealisasi

  function handleAdd() {
    setEditingItem(null)
    setFormData(emptyItem)
    setSheetOpen(true)
  }

  function handleEdit(item: BudgetItem) {
    setEditingItem(item)
    setFormData({
      kategori: item.kategori,
      item: item.item,
      estimasi: item.estimasi,
      realisasi: item.realisasi,
      status_bayar: item.status_bayar,
      vendor: item.vendor || "",
      tanggal_bayar: item.tanggal_bayar || "",
      catatan: item.catatan || "",
    })
    setSheetOpen(true)
  }

  function handleDelete(item: BudgetItem) {
    setDeleteId(item.id)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/sheets/budget?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete item")
      toast.success("Item budget berhasil dihapus")
      await fetchItems()
    } catch {
      toast.error("Gagal menghapus item")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...formData } : formData
      const res = await fetch("/api/sheets/budget", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save item")
      setSheetOpen(false)
      toast.success(editingItem ? "Item budget berhasil diperbarui" : "Item budget berhasil ditambahkan")
      await fetchItems()
    } catch {
      toast.error("Gagal menyimpan item")
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: string, value: string | number | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Budget",
          headers: ["Kategori", "Item", "Estimasi", "Realisasi", "Status Bayar", "Vendor", "Tanggal Bayar", "Catatan"],
          rows: filtered.map((item) => ({
            Kategori: item.kategori,
            Item: item.item,
            Estimasi: item.estimasi,
            Realisasi: item.realisasi,
            "Status Bayar": item.status_bayar,
            Vendor: item.vendor,
            "Tanggal Bayar": item.tanggal_bayar,
            Catatan: item.catatan,
          })),
        },
      ],
      "budget"
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
        <Button onClick={fetchItems}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Budget Tracker</h1>
          <p className="text-sm text-muted-foreground">Kelola anggaran pernikahan Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export Excel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Estimasi</p>
            <p className="text-xl font-bold">{formatRupiah(totalEstimasi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Realisasi</p>
            <p className="text-xl font-bold">{formatRupiah(totalRealisasi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Sisa Budget</p>
            <p className={`text-xl font-bold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
              {formatRupiah(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari item atau kategori..."
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

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {search || filterKategori !== "all"
              ? "Tidak ada item yang cocok dengan filter"
              : "Belum ada item budget. Klik \"Tambah Item\" untuk menambah."}
          </div>
        ) : (
          filtered.map((item) => (
            <BudgetCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Desktop table view */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Estimasi</TableHead>
            <TableHead className="text-right">Realisasi</TableHead>
            <TableHead>Status Bayar</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                {search || filterKategori !== "all"
                  ? "Tidak ada item yang cocok dengan filter"
                  : "Belum ada item budget. Klik \"Tambah Item\" untuk menambah."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.kategori}</TableCell>
                <TableCell className="font-medium">{item.item}</TableCell>
                <TableCell className="text-right">{formatRupiah(item.estimasi)}</TableCell>
                <TableCell className="text-right">{formatRupiah(item.realisasi)}</TableCell>
                <TableCell>{getStatusBadge(item.status_bayar)}</TableCell>
                <TableCell>{item.vendor || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
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
              {editingItem ? "Edit Item Budget" : "Tambah Item Budget Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmit}>
            <SheetBody className="space-y-4">
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
                <Label htmlFor="item">Nama Item *</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => updateField("item", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimasi">Estimasi (Rp)</Label>
                <Input
                  id="estimasi"
                  type="number"
                  min={0}
                  value={formData.estimasi}
                  onChange={(e) => updateField("estimasi", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="realisasi">Realisasi (Rp)</Label>
                <Input
                  id="realisasi"
                  type="number"
                  min={0}
                  value={formData.realisasi}
                  onChange={(e) => updateField("realisasi", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_bayar">Status Bayar</Label>
                <Select
                  id="status_bayar"
                  value={formData.status_bayar}
                  onChange={(e) => updateField("status_bayar", e.target.value)}
                >
                  <option value="belum">Belum Bayar</option>
                  <option value="dp">DP</option>
                  <option value="lunas">Lunas</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => updateField("vendor", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_bayar">Tanggal Bayar</Label>
                <Input
                  id="tanggal_bayar"
                  type="date"
                  value={formData.tanggal_bayar}
                  onChange={(e) => updateField("tanggal_bayar", e.target.value)}
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
                {submitting ? "Menyimpan..." : editingItem ? "Simpan" : "Tambah"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
          <AlertDialogDescription>
            Item ini akan dihapus secara permanen dari budget. Tindakan ini tidak dapat dibatalkan.
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
