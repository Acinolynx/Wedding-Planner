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
import type { ChecklistItem, TaskStatus, Priority } from "@/types"
import { Pencil, Trash2, Plus, RotateCcw, Download } from "lucide-react"
import { exportToExcel } from "@/lib/export"
import { toast } from "sonner"
import { ChecklistCard } from "@/components/app/mobile-cards"

function getStatusBadge(status: TaskStatus) {
  const map: Record<TaskStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
    done: { label: "Selesai", variant: "success" },
    "in-progress": { label: "Proses", variant: "warning" },
    todo: { label: "Belum", variant: "danger" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function getPriorityBadge(priority: Priority) {
  const map: Record<Priority, { label: string; variant: "success" | "warning" | "danger" }> = {
    high: { label: "Tinggi", variant: "danger" },
    medium: { label: "Sedang", variant: "warning" },
    low: { label: "Rendah", variant: "success" },
  }
  const { label, variant } = map[priority]
  return <Badge variant={variant}>{label}</Badge>
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

const categories = [
  "Venue",
  "Catering",
  "Dekorasi",
  "Busana",
  "Fotografi",
  "Hiburan",
  "Undangan",
  "Administrasi",
  "Lainnya",
]

const emptyItem: Omit<ChecklistItem, "id"> = {
  task: "",
  kategori: "",
  due_date: "",
  assignee: "",
  status: "todo",
  prioritas: "medium",
  catatan: "",
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [weddingDate, setWeddingDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPrioritas, setFilterPrioritas] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)
  const [formData, setFormData] = useState(emptyItem)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [checklistRes, configRes] = await Promise.all([
        fetch("/api/sheets/checklist"),
        fetch("/api/sheets/config"),
      ])
      if (!checklistRes.ok) throw new Error("Failed to fetch checklist")
      const checklistJson = await checklistRes.json()
      setItems(checklistJson.checklist)

      if (configRes.ok) {
        const configJson = await configRes.json()
        setWeddingDate(configJson.config?.tanggal_pernikahan || null)
      }
    } catch {
      setError("Gagal memuat data checklist")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sorted = [...items].sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    if (weddingDate) {
      const weddingTime = new Date(weddingDate).getTime()
      const diffA = Math.abs(new Date(a.due_date).getTime() - weddingTime)
      const diffB = Math.abs(new Date(b.due_date).getTime() - weddingTime)
      return diffA - diffB
    }
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  const filtered = sorted.filter((item) => {
    const matchSearch =
      item.task.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || item.status === filterStatus
    const matchPrioritas = filterPrioritas === "all" || item.prioritas === filterPrioritas
    return matchSearch && matchStatus && matchPrioritas
  })

  const doneCount = items.filter((i) => i.status === "done").length
  const progressPercent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  function handleAdd() {
    setEditingItem(null)
    setFormData(emptyItem)
    setSheetOpen(true)
  }

  function handleEdit(item: ChecklistItem) {
    setEditingItem(item)
    setFormData({
      task: item.task,
      kategori: item.kategori,
      due_date: item.due_date || "",
      assignee: item.assignee || "",
      status: item.status,
      prioritas: item.prioritas,
      catatan: item.catatan || "",
    })
    setSheetOpen(true)
  }

  function handleDelete(item: ChecklistItem) {
    setDeleteId(item.id)
    setDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/sheets/checklist?id=${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete item")
      toast.success("Task berhasil dihapus")
      await fetchData()
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
      const res = await fetch("/api/sheets/checklist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save item")
      setSheetOpen(false)
      toast.success(editingItem ? "Task berhasil diperbarui" : "Task berhasil ditambahkan")
      await fetchData()
    } catch {
      toast.error("Gagal menyimpan item")
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: string, value: string | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Checklist",
          headers: ["Task", "Kategori", "Due Date", "Assignee", "Status", "Prioritas", "Catatan"],
          rows: filtered.map((item) => ({
            Task: item.task,
            Kategori: item.kategori,
            "Due Date": item.due_date,
            Assignee: item.assignee,
            Status: item.status,
            Prioritas: item.prioritas,
            Catatan: item.catatan,
          })),
        },
      ],
      "checklist"
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-20 w-full" />
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
        <Button onClick={fetchData}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Checklist & Timeline</h1>
          <p className="text-sm text-muted-foreground">Pantau progres persiapan pernikahan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export Excel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Tambah Task
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progres Checklist</p>
              <p className="text-2xl font-bold">
                {doneCount}/{items.length} selesai
              </p>
            </div>
            <div className="max-w-48 w-full sm:w-48">
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">{progressPercent}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari task atau kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="max-w-[160px]"
        >
          <option value="all">Semua Status</option>
          <option value="todo">Belum</option>
          <option value="in-progress">Proses</option>
          <option value="done">Selesai</option>
        </Select>
        <Select
          value={filterPrioritas}
          onChange={(e) => setFilterPrioritas(e.target.value)}
          className="max-w-[160px]"
        >
          <option value="all">Semua Prioritas</option>
          <option value="high">Tinggi</option>
          <option value="medium">Sedang</option>
          <option value="low">Rendah</option>
        </Select>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {search || filterStatus !== "all" || filterPrioritas !== "all"
              ? "Tidak ada task yang cocok dengan filter"
              : "Belum ada task. Klik \"Tambah Task\" untuk menambah."}
          </div>
        ) : (
          filtered.map((item) => (
            <ChecklistCard
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
            <TableHead>Task</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioritas</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                {search || filterStatus !== "all" || filterPrioritas !== "all"
                  ? "Tidak ada task yang cocok dengan filter"
                  : "Belum ada task. Klik \"Tambah Task\" untuk menambah."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.task}</TableCell>
                <TableCell>{item.kategori}</TableCell>
                <TableCell>{formatDate(item.due_date || "")}</TableCell>
                <TableCell>{item.assignee || "-"}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>{getPriorityBadge(item.prioritas)}</TableCell>
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
              {editingItem ? "Edit Task" : "Tambah Task Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmit}>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task">Task *</Label>
                <Input
                  id="task"
                  value={formData.task}
                  onChange={(e) => updateField("task", e.target.value)}
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
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={formData.assignee}
                  onChange={(e) => updateField("assignee", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option value="todo">Belum</option>
                  <option value="in-progress">Proses</option>
                  <option value="done">Selesai</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioritas">Prioritas</Label>
                <Select
                  id="prioritas"
                  value={formData.prioritas}
                  onChange={(e) => updateField("prioritas", e.target.value)}
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </Select>
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
          <AlertDialogTitle>Hapus Task?</AlertDialogTitle>
          <AlertDialogDescription>
            Task ini akan dihapus secara permanen dari checklist. Tindakan ini tidak dapat dibatalkan.
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
