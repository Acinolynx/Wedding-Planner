import { getSheetData, appendRow, updateRow, deleteRow, SHEET_NAMES } from '@/lib/sheets'
import type { BudgetItem, PaymentStatus } from '@/types'
import { randomUUID } from 'crypto'

function parseBudgetRow(row: string[], index: number): BudgetItem {
  return {
    id: row[0] || String(index),
    kategori: row[1] || '',
    item: row[2] || '',
    estimasi: Number(row[3]) || 0,
    realisasi: Number(row[4]) || 0,
    status_bayar: (row[5] as PaymentStatus) || 'belum',
    vendor: row[6] || undefined,
    tanggal_bayar: row[7] || undefined,
    catatan: row[8] || undefined,
  }
}

function budgetToRow(item: BudgetItem): string[] {
  return [
    item.id,
    item.kategori,
    item.item,
    String(item.estimasi),
    String(item.realisasi),
    item.status_bayar,
    item.vendor || '',
    item.tanggal_bayar || '',
    item.catatan || '',
  ]
}

export async function GET(): Promise<Response> {
  try {
    const rows = await getSheetData(SHEET_NAMES.BUDGET)
    const budget: BudgetItem[] = rows.map((row, i) => parseBudgetRow(row, i))
    return Response.json({ budget })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()

    if (!body.item || !body.kategori) {
      return Response.json({ error: 'Item and kategori are required' }, { status: 400 })
    }

    const id = randomUUID()
    const item: BudgetItem = {
      id,
      kategori: body.kategori,
      item: body.item,
      estimasi: body.estimasi || 0,
      realisasi: body.realisasi || 0,
      status_bayar: body.status_bayar || 'belum',
      vendor: body.vendor,
      tanggal_bayar: body.tanggal_bayar,
      catatan: body.catatan,
    }

    await appendRow(SHEET_NAMES.BUDGET, budgetToRow(item))
    return Response.json({ item }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const body = await req.json()

    if (!body.id) {
      return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const rows = await getSheetData(SHEET_NAMES.BUDGET)
    const rowIndex = rows.findIndex((r) => r[0] === body.id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Budget item not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    const item: BudgetItem = {
      id: body.id,
      kategori: body.kategori,
      item: body.item,
      estimasi: body.estimasi || 0,
      realisasi: body.realisasi || 0,
      status_bayar: body.status_bayar,
      vendor: body.vendor,
      tanggal_bayar: body.tanggal_bayar,
      catatan: body.catatan,
    }

    await updateRow(SHEET_NAMES.BUDGET, actualRow, budgetToRow(item))
    return Response.json({ item })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 })
    }

    const rows = await getSheetData(SHEET_NAMES.BUDGET)
    const rowIndex = rows.findIndex((r) => r[0] === id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Budget item not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    await deleteRow(SHEET_NAMES.BUDGET, actualRow)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
