"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { formatRupiah } from "@/lib/utils"

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"]

export function RsvpChart({
  confirmed,
  pending,
  declined,
}: {
  confirmed: number
  pending: number
  declined: number
}) {
  const data = [
    { name: "Confirmed", value: confirmed },
    { name: "Pending", value: pending },
    { name: "Declined", value: declined },
  ]

  const total = confirmed + pending + declined

  return (
    <Card>
      <CardHeader>
        <CardTitle>RSVP Breakdown</CardTitle>
        <CardDescription>Distribusi status kehadiran tamu</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Belum ada data RSVP
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} tamu`, ""]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-semibold text-green-600">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </div>
          <div>
            <p className="font-semibold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="font-semibold text-red-600">{declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetChart({
  budget,
}: {
  budget: string[][]
}) {
  const categoryMap = new Map<string, { estimasi: number; realisasi: number }>()

  for (const row of budget) {
    const kategori = row[1] || "Lainnya"
    const estimasi = Number(row[3]) || 0
    const realisasi = Number(row[4]) || 0
    const existing = categoryMap.get(kategori) || { estimasi: 0, realisasi: 0 }
    existing.estimasi += estimasi
    existing.realisasi += realisasi
    categoryMap.set(kategori, existing)
  }

  const data = Array.from(categoryMap.entries()).map(([name, values]) => ({
    name,
    estimasi: values.estimasi,
    realisasi: values.realisasi,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget per Kategori</CardTitle>
        <CardDescription>Perbandingan estimasi dan realisasi</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Belum ada data budget
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `Rp ${(v / 1000000).toFixed(0)}jt`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatRupiah(value as number), ""]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
                <Bar
                  dataKey="estimasi"
                  name="Estimasi"
                  fill="hsl(var(--muted-foreground))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="realisasi"
                  name="Realisasi"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
