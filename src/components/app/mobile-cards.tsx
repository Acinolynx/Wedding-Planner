import type { Guest, RSVPStatus, BudgetItem, PaymentStatus, ChecklistItem, TaskStatus, Priority, Vendor } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, QrCode, Copy } from "lucide-react"
import { getIndonesianDate, formatRupiah } from "@/lib/utils"

function getRsvpBadge(status: RSVPStatus) {
  const map: Record<RSVPStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
    confirmed: { label: "Confirmed", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    declined: { label: "Declined", variant: "danger" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function getPaymentBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
    lunas: { label: "Lunas", variant: "success" },
    dp: { label: "DP", variant: "warning" },
    belum: { label: "Belum", variant: "danger" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

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

export function GuestCard({
  guest,
  onEdit,
  onDelete,
  onCopyLink,
  onShowQR,
}: {
  guest: Guest
  onEdit: (guest: Guest) => void
  onDelete: (guest: Guest) => void
  onCopyLink: (guest: Guest) => void
  onShowQR: (guest: Guest) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{guest.nama}</p>
          <p className="mt-1">{getRsvpBadge(guest.rsvp_status)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onShowQR(guest)} title="QR Code">
            <QrCode className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onCopyLink(guest)} title="Salin link">
            <Copy className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(guest)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onDelete(guest)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Telepon</p>
          <p className="truncate">{guest.telepon || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Jumlah Hadir</p>
          <p>{guest.jumlah_hadir}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Nomor Meja</p>
          <p>{guest.nomor_meja ?? "-"}</p>
        </div>
        {guest.pilihan_makan && (
          <div>
            <p className="text-xs text-muted-foreground">Pilihan Makan</p>
            <p className="truncate">{guest.pilihan_makan}</p>
          </div>
        )}
      </div>

      {guest.catatan && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{guest.catatan}</p>
      )}
    </div>
  )
}

export function BudgetCard({
  item,
  onEdit,
  onDelete,
}: {
  item: BudgetItem
  onEdit: (item: BudgetItem) => void
  onDelete: (item: BudgetItem) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.item}</p>
          <p className="text-xs text-muted-foreground">{item.kategori}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(item)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onDelete(item)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Estimasi</p>
          <p>{formatRupiah(item.estimasi)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Realisasi</p>
          <p>{formatRupiah(item.realisasi)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status Bayar</p>
          <p>{getPaymentBadge(item.status_bayar)}</p>
        </div>
        {item.vendor && (
          <div>
            <p className="text-xs text-muted-foreground">Vendor</p>
            <p className="truncate">{item.vendor}</p>
          </div>
        )}
      </div>

      {item.catatan && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{item.catatan}</p>
      )}
    </div>
  )
}

export function ChecklistCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem
  onEdit: (item: ChecklistItem) => void
  onDelete: (item: ChecklistItem) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.task}</p>
          <p className="text-xs text-muted-foreground">{item.kategori}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(item)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onDelete(item)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {getStatusBadge(item.status)}
        {getPriorityBadge(item.prioritas)}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {item.due_date && (
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p>{getIndonesianDate(item.due_date)}</p>
          </div>
        )}
        {item.assignee && (
          <div>
            <p className="text-xs text-muted-foreground">Assignee</p>
            <p className="truncate">{item.assignee}</p>
          </div>
        )}
      </div>

      {item.catatan && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{item.catatan}</p>
      )}
    </div>
  )
}

export function VendorCard({
  vendor,
  onEdit,
  onDelete,
}: {
  vendor: Vendor
  onEdit: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{vendor.nama}</p>
          <p className="text-xs text-muted-foreground">{vendor.kategori}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(vendor)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onDelete(vendor)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Harga</p>
          <p>{formatRupiah(vendor.harga)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">DP Dibayar</p>
          <p>{formatRupiah(vendor.dp_dibayar)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p>{vendor.lunas ? <Badge variant="success">Lunas</Badge> : <Badge variant="danger">Belum</Badge>}</p>
        </div>
        {vendor.kontak && (
          <div>
            <p className="text-xs text-muted-foreground">Kontak</p>
            <p className="truncate">{vendor.kontak}</p>
          </div>
        )}
      </div>

      {vendor.catatan && (
        <p className="mt-2 truncate text-xs text-muted-foreground">{vendor.catatan}</p>
      )}
    </div>
  )
}
