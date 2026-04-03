import { getSheetData, appendRow, updateRow, deleteRow, SHEET_NAMES } from '@/lib/sheets'
import type { Vendor } from '@/types'
import { randomUUID } from 'crypto'

function parseVendorRow(row: string[], index: number): Vendor {
  return {
    id: row[0] || String(index),
    nama: row[1] || '',
    kategori: row[2] || '',
    kontak: row[3] || undefined,
    telepon: row[4] || undefined,
    harga: Number(row[5]) || 0,
    dp_dibayar: Number(row[6]) || 0,
    lunas: row[7] === 'TRUE' || row[7] === 'true',
    tanggal_kontrak: row[8] || undefined,
    catatan: row[9] || undefined,
  }
}

function vendorToRow(vendor: Vendor): string[] {
  return [
    vendor.id,
    vendor.nama,
    vendor.kategori,
    vendor.kontak || '',
    vendor.telepon || '',
    String(vendor.harga),
    String(vendor.dp_dibayar),
    String(vendor.lunas),
    vendor.tanggal_kontrak || '',
    vendor.catatan || '',
  ]
}

export async function GET(): Promise<Response> {
  try {
    const rows = await getSheetData(SHEET_NAMES.VENDORS)
    const vendors: Vendor[] = rows.map((row, i) => parseVendorRow(row, i))
    return Response.json({ vendors })
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

    if (!body.nama || !body.kategori) {
      return Response.json({ error: 'Nama and kategori are required' }, { status: 400 })
    }

    const id = randomUUID()
    const vendor: Vendor = {
      id,
      nama: body.nama,
      kategori: body.kategori,
      kontak: body.kontak,
      telepon: body.telepon,
      harga: body.harga || 0,
      dp_dibayar: body.dp_dibayar || 0,
      lunas: body.lunas ?? false,
      tanggal_kontrak: body.tanggal_kontrak,
      catatan: body.catatan,
    }

    await appendRow(SHEET_NAMES.VENDORS, vendorToRow(vendor))
    return Response.json({ vendor }, { status: 201 })
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

    const rows = await getSheetData(SHEET_NAMES.VENDORS)
    const rowIndex = rows.findIndex((r) => r[0] === body.id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    const vendor: Vendor = {
      id: body.id,
      nama: body.nama,
      kategori: body.kategori,
      kontak: body.kontak,
      telepon: body.telepon,
      harga: body.harga || 0,
      dp_dibayar: body.dp_dibayar || 0,
      lunas: body.lunas ?? false,
      tanggal_kontrak: body.tanggal_kontrak,
      catatan: body.catatan,
    }

    await updateRow(SHEET_NAMES.VENDORS, actualRow, vendorToRow(vendor))
    return Response.json({ vendor })
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

    const rows = await getSheetData(SHEET_NAMES.VENDORS)
    const rowIndex = rows.findIndex((r) => r[0] === id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    await deleteRow(SHEET_NAMES.VENDORS, actualRow)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
