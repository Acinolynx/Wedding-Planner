import { getSheetData, SHEET_NAMES, getConfig } from "@/lib/sheets"
import { getIndonesianDate, formatRupiah } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Wallet, CheckSquare, Calendar, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  let guests: string[][] = []
  let budget: string[][] = []
  let checklist: string[][] = []
  let vendors: string[][] = []
  let config: Awaited<ReturnType<typeof getConfig>> = null

  try {
    [guests, budget, checklist, vendors, config] = await Promise.all([
      getSheetData(SHEET_NAMES.GUESTS),
      getSheetData(SHEET_NAMES.BUDGET),
      getSheetData(SHEET_NAMES.CHECKLIST),
      getSheetData(SHEET_NAMES.VENDORS),
      getConfig(),
    ])
  } catch { /* empty arrays on error */ }

  const totalEstimasi = budget.reduce((sum, r) => sum + (Number(r[3]) || 0), 0)
  const totalRealisasi = budget.reduce((sum, r) => sum + (Number(r[4]) || 0), 0)
  const remaining = totalEstimasi - totalRealisasi

  const confirmed = guests.filter((r) => r[5] === "confirmed").length
  const pending = guests.filter((r) => r[5] === "pending").length
  const declined = guests.filter((r) => r[5] === "declined").length

  const doneTasks = checklist.filter((r) => r[5] === "done").length
  const totalTasks = checklist.length
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const totalVendors = vendors.length
  const paidVendors = vendors.filter((r) => r[7] === "TRUE" || r[7] === "true").length

  const weddingDate = config?.tanggal_pernikahan
  const daysUntil = weddingDate ? getDaysUntil(weddingDate) : null
  const isPast = daysUntil !== null && daysUntil < 0
  const isToday = daysUntil === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan perencanaan pernikahan Anda</p>
      </div>

      {/* Wedding date countdown */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Pernikahan</p>
              {weddingDate ? (
                <>
                  <p className="text-lg font-semibold">
                    {getIndonesianDate(weddingDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPast
                      ? `${Math.abs(daysUntil)} hari yang lalu`
                      : isToday
                        ? "Hari ini!"
                        : `${daysUntil} hari lagi`}
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold">Belum diatur</p>
              )}
            </div>
            {config?.venue && (
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="text-sm font-medium">{config.venue}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tamu</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guests.length}</div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">{confirmed} confirmed</span>
              <span className="text-amber-600">{pending} pending</span>
              <span className="text-red-600">{declined} declined</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalEstimasi)}</div>
            <p className="text-xs text-muted-foreground">
              Realisasi: {formatRupiah(totalRealisasi)} &middot; Sisa: {formatRupiah(remaining)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checklist</CardTitle>
            <CheckSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneTasks}/{totalTasks}</div>
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{progressPercent}% selesai</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendor</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              {paidVendors} lunas &middot; {totalVendors - paidVendors} belum lunas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RSVP breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">{confirmed}</p>
              </div>
              <Badge variant="success">Hadir</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{pending}</p>
              </div>
              <Badge variant="warning">Menunggu</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-3xl font-bold text-red-600">{declined}</p>
              </div>
              <Badge variant="danger">Tidak Hadir</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
