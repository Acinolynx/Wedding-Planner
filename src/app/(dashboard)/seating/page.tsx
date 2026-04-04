"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { Guest, SeatingTable } from "@/types"
import {
  Plus,
  Pencil,
  Trash2,
  UserMinus,
  RotateCcw,
  Table,
} from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function useSortableItem(id: string | number) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return {
    ref: setNodeRef,
    style: {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    },
    attributes,
    listeners,
  }
}

function GuestChip({
  guest,
  onRemove,
}: {
  guest: Guest
  onRemove?: () => void
}) {
  const { ref, style, attributes, listeners } = useSortableItem(guest.id)

  return (
    <div
      ref={ref}
      style={style}
      className="flex cursor-grab items-center justify-between rounded-md border bg-card px-3 py-2 text-sm shadow-sm active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <span className="truncate font-medium">{guest.nama}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <UserMinus className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function TableCard({
  table,
  guests,
  onAddTable,
  onRemoveGuest,
}: {
  table: SeatingTable
  guests: Guest[]
  onAddTable: () => void
  onRemoveGuest: (guestId: string) => void
}) {
  const { ref, style, attributes, listeners } = useSortableItem(table.nomor_meja)
  const isOverCapacity = guests.length > table.kapasitas
  const pct = table.kapasitas > 0 ? Math.round((guests.length / table.kapasitas) * 100) : 0

  return (
    <div
      ref={ref}
      style={style}
      className="flex flex-col rounded-lg border bg-card shadow-sm transition-colors"
    >
      <div
        className="flex cursor-grab items-center justify-between rounded-t-lg border-b px-4 py-3 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div>
          <h3 className="font-semibold">{table.nama_meja}</h3>
          <p className="text-xs text-muted-foreground">
            Meja #{table.nomor_meja}
          </p>
        </div>
        <Badge variant={isOverCapacity ? "danger" : pct >= 80 ? "warning" : "success"}>
          {guests.length}/{table.kapasitas}
        </Badge>
      </div>

      <div className="h-1.5 w-full bg-muted">
        <div
          className={`h-full transition-all ${isOverCapacity ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-green-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <div
        className="flex min-h-[120px] flex-col gap-2 p-3"
        onDragOver={(e) => e.preventDefault()}
      >
        {guests.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Seret tamu ke sini
          </div>
        ) : (
          guests.map((guest) => (
            <GuestChip
              key={guest.id}
              guest={guest}
              onRemove={() => onRemoveGuest(guest.id)}
            />
          ))
        )}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={onAddTable}
        >
          <Plus className="mr-1 size-3" />
          Tambah Tamu
        </Button>
      </div>
    </div>
  )
}

const emptyTable: Omit<SeatingTable, "nomor_meja"> = {
  nama_meja: "",
  kapasitas: 10,
}

export default function SeatingPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [tables, setTables] = useState<SeatingTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<SeatingTable | null>(null)
  const [editRowIndex, setEditRowIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyTable)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTableIndex, setDeleteTableIndex] = useState<number | null>(null)
  const [deleteTableNumber, setDeleteTableNumber] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | number | null>(null)
  const [search, setSearch] = useState("")
  const [initError, setInitError] = useState<string | null>(null)
  const [pendingTable, setPendingTable] = useState<{ guestId: string; tableNumber: number | undefined } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [guestsRes, tablesRes] = await Promise.all([
        fetch("/api/sheets/guests"),
        fetch("/api/sheets/seating"),
      ])
      if (!guestsRes.ok) throw new Error("Failed to fetch guests")
      if (!tablesRes.ok) {
        setInitError("Tata letak belum diinisialisasi")
        setGuests((await guestsRes.json()).guests)
        setTables([])
        return
      }
      const guestsJson = await guestsRes.json()
      const tablesJson = await tablesRes.json()
      setGuests(guestsJson.guests)
      setTables(tablesJson.data)
    } catch {
      setError("Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleInitSeating() {
    try {
      setInitError(null)
      const res = await fetch("/api/sheets/seating", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to init seating")
      await fetchData()
    } catch {
      setInitError("Gagal menginisialisasi tata letak")
    }
  }

  const confirmedGuests = guests.filter(
    (g) => g.rsvp_status === "confirmed"
  )

  const unassignedGuests = confirmedGuests.filter(
    (g) => !g.nomor_meja
  )

  const filteredUnassigned = unassignedGuests.filter((g) =>
    g.nama.toLowerCase().includes(search.toLowerCase())
  )

  const getGuestsByTable = (tableNumber: number) =>
    confirmedGuests.filter((g) => g.nomor_meja === tableNumber)

  function handleAddTable() {
    setEditingTable(null)
    setEditRowIndex(null)
    setFormData(emptyTable)
    setSheetOpen(true)
  }

  function handleEditTable(table: SeatingTable, rowIndex: number) {
    setEditingTable(table)
    setEditRowIndex(rowIndex)
    setFormData({ nama_meja: table.nama_meja, kapasitas: table.kapasitas })
    setSheetOpen(true)
  }

  function handleDeleteTable(table: SeatingTable, rowIndex: number) {
    setDeleteTableIndex(rowIndex)
    setDeleteTableNumber(table.nomor_meja)
    setDeleteOpen(true)
  }

  async function handleDeleteTableConfirm() {
    if (deleteTableIndex === null) return
    try {
      const guestsOnTable = confirmedGuests.filter(
        (g) => g.nomor_meja === deleteTableNumber
      )
      const results = await Promise.allSettled(
        guestsOnTable.map((g) => updateGuestTable(g.id, undefined))
      )
      const allSucceeded = results.every((r) => r.status === "fulfilled")
      if (!allSucceeded) {
        alert("Beberapa tamu gagal dipindahkan. Coba lagi.")
        return
      }
      const res = await fetch(`/api/sheets/seating?rowIndex=${deleteTableIndex}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete table")
      const json = await res.json()
      setTables(json.data)
    } catch {
      alert("Gagal menghapus meja")
    } finally {
      setDeleteOpen(false)
      setDeleteTableIndex(null)
      setDeleteTableNumber(null)
    }
  }

  async function handleSubmitTable(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const maxNomor =
        tables.length > 0 ? Math.max(...tables.map((t) => t.nomor_meja)) : 0
      const method = editingTable ? "PUT" : "POST"
      const body = editingTable
        ? {
            rowIndex: editRowIndex,
            nomor_meja: editingTable.nomor_meja,
            ...formData,
          }
        : {
            nomor_meja: maxNomor + 1,
            ...formData,
          }
      const res = await fetch("/api/sheets/seating", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save table")
      const json = await res.json()
      setTables(json.data)
      setSheetOpen(false)
    } catch {
      alert("Gagal menyimpan meja")
    } finally {
      setSubmitting(false)
    }
  }

  async function updateGuestTable(guestId: string, tableNumber: number | undefined) {
    const guest = guests.find((g) => g.id === guestId)
    if (!guest) return
    try {
      const res = await fetch("/api/sheets/guests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guestId,
          nama: guest.nama,
          telepon: guest.telepon || "",
          email: guest.email || "",
          undangan_dikirim: guest.undangan_dikirim,
          rsvp_status: guest.rsvp_status,
          jumlah_hadir: guest.jumlah_hadir,
          pilihan_makan: guest.pilihan_makan || "",
          nomor_meja: tableNumber,
          catatan: guest.catatan || "",
        }),
      })
      if (!res.ok) throw new Error("Failed to update guest")
      const json = await res.json()
      setGuests((prev) => prev.map((g) => g.id === guestId ? json.guest : g))
    } catch {
      alert("Gagal memperbarui tamu")
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const guestId = String(active.id)
    const guest = guests.find((g) => g.id === guestId)
    if (!guest) return

    if (over.id === "unassigned") {
      setPendingTable({ guestId, tableNumber: undefined })
      return
    }

    const tableNumber = Number(over.id)
    if (!isNaN(tableNumber)) {
      setPendingTable({ guestId, tableNumber })
    }
  }

  function handleDragEnd() {
    if (pendingTable) {
      updateGuestTable(pendingTable.guestId, pendingTable.tableNumber)
      setPendingTable(null)
    }
    setActiveId(null)
  }

  const activeGuest = activeId
    ? guests.find((g) => g.id === activeId)
    : null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        <Button onClick={fetchData}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Tata Letak Meja</h1>
          <p className="text-sm text-muted-foreground">Atur tempat duduk tamu undangan</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Table className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Tata Letak Belum Diinisialisasi</p>
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk membuat tab Tata Letak di Google Sheets
              </p>
            </div>
            <Button onClick={handleInitSeating}>
              <Plus className="mr-2 size-4" />
              Inisialisasi Tata Letak
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
          <h1 className="text-2xl font-semibold tracking-tight">Tata Letak Meja</h1>
          <p className="text-sm text-muted-foreground">
            Atur tempat duduk tamu undangan dengan drag-and-drop
          </p>
        </div>
        <Button onClick={handleAddTable}>
          <Plus className="mr-2 size-4" />
          Tambah Meja
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tables.length}</div>
            <p className="text-xs text-muted-foreground">Total Meja</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {confirmedGuests.length}
            </div>
            <p className="text-xs text-muted-foreground">Tamu Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {unassignedGuests.length}
            </div>
            <p className="text-xs text-muted-foreground">Belum Ditempatkan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tables.reduce((sum, t) => sum + t.kapasitas, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Kapasitas</p>
          </CardContent>
        </Card>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Unassigned guests panel */}
          <div className="w-full shrink-0 lg:w-72">
            <div className="sticky top-20 space-y-3 rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Belum Ditempatkan</h2>
                <Badge variant="warning">{unassignedGuests.length}</Badge>
              </div>
              <Input
                placeholder="Cari tamu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
              <div
                id="unassigned"
                className="flex min-h-[200px] max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-320px)] flex-col gap-2 overflow-y-auto"
              >
                <SortableContext
                  items={filteredUnassigned.map((g) => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredUnassigned.map((guest) => (
                    <GuestChip key={guest.id} guest={guest} />
                  ))}
                </SortableContext>
                {filteredUnassigned.length === 0 && (
                  <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                    {unassignedGuests.length === 0
                      ? "Semua tamu sudah ditempatkan"
                      : "Tidak ada tamu yang cocok"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tables grid */}
          <div className="flex-1">
            {tables.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <Table className="size-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Belum Ada Meja</p>
                    <p className="text-sm text-muted-foreground">
                      Klik &quot;Tambah Meja&quot; untuk mulai mengatur tempat duduk
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SortableContext
                  items={tables.map((t) => t.nomor_meja)}
                  strategy={verticalListSortingStrategy}
                >
                  {tables.map((table, rowIndex) => (
                    <div key={table.nomor_meja} className="relative group">
                      <div className="absolute right-2 top-2 z-10 hidden gap-1 group-hover:flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 bg-background shadow-sm"
                          onClick={() => handleEditTable(table, rowIndex)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 bg-background shadow-sm"
                          onClick={() => handleDeleteTable(table, rowIndex)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                      <TableCard
                        table={table}
                        guests={getGuestsByTable(table.nomor_meja)}
                        onAddTable={() => {
                          setEditingTable(null)
                          setEditRowIndex(null)
                          setFormData(emptyTable)
                          setSheetOpen(true)
                        }}
                        onRemoveGuest={(guestId) => updateGuestTable(guestId, undefined)}
                      />
                    </div>
                  ))}
                </SortableContext>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeGuest ? (
            <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-lg">
              {activeGuest.nama}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Table form sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {editingTable ? "Edit Meja" : "Tambah Meja Baru"}
            </SheetTitle>
            <SheetClose>X</SheetClose>
          </SheetHeader>
          <form onSubmit={handleSubmitTable}>
            <SheetBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_meja">Nama Meja *</Label>
                <Input
                  id="nama_meja"
                  value={formData.nama_meja}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nama_meja: e.target.value }))
                  }
                  placeholder="contoh: Meja 1, VIP, Keluarga"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kapasitas">Kapasitas *</Label>
                <Input
                  id="kapasitas"
                  type="number"
                  min={1}
                  value={formData.kapasitas}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kapasitas: Number(e.target.value),
                    }))
                  }
                  required
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
                {submitting ? "Menyimpan..." : editingTable ? "Simpan" : "Tambah"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete table confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteTableConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Meja?</AlertDialogTitle>
          <AlertDialogDescription>
            Meja ini akan dihapus. Tamu yang duduk di meja ini akan kembali ke daftar &quot;Belum Ditempatkan&quot;.
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
