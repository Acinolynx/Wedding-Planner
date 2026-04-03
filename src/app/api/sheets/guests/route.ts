import { getSheetData, appendRow, updateRow, deleteRow, SHEET_NAMES } from '@/lib/sheets'
import type { Guest, RSVPStatus } from '@/types'
import { randomUUID } from 'crypto'

function parseGuestRow(row: string[], index: number): Guest {
  return {
    id: row[0] || String(index),
    nama: row[1] || '',
    telepon: row[2] || undefined,
    email: row[3] || undefined,
    undangan_dikirim: row[4] === 'TRUE' || row[4] === 'true',
    rsvp_status: (row[5] as RSVPStatus) || 'pending',
    jumlah_hadir: Number(row[6]) || 0,
    pilihan_makan: row[7] || undefined,
    nomor_meja: row[8] ? Number(row[8]) : undefined,
    catatan: row[9] || undefined,
  }
}

function guestToRow(guest: Guest): string[] {
  return [
    guest.id,
    guest.nama,
    guest.telepon || '',
    guest.email || '',
    String(guest.undangan_dikirim),
    guest.rsvp_status,
    String(guest.jumlah_hadir),
    guest.pilihan_makan || '',
    guest.nomor_meja ? String(guest.nomor_meja) : '',
    guest.catatan || '',
  ]
}

export async function GET(): Promise<Response> {
  try {
    const rows = await getSheetData(SHEET_NAMES.GUESTS)
    const guests: Guest[] = rows.map((row, i) => parseGuestRow(row, i))
    return Response.json({ guests })
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

    if (!body.nama) {
      return Response.json({ error: 'Nama is required' }, { status: 400 })
    }

    const id = randomUUID()
    const guest: Guest = {
      id,
      nama: body.nama,
      telepon: body.telepon,
      email: body.email,
      undangan_dikirim: body.undangan_dikirim ?? false,
      rsvp_status: body.rsvp_status || 'pending',
      jumlah_hadir: body.jumlah_hadir || 0,
      pilihan_makan: body.pilihan_makan,
      nomor_meja: body.nomor_meja,
      catatan: body.catatan,
    }

    await appendRow(SHEET_NAMES.GUESTS, guestToRow(guest))
    return Response.json({ guest }, { status: 201 })
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

    const rows = await getSheetData(SHEET_NAMES.GUESTS)
    const rowIndex = rows.findIndex((r) => r[0] === body.id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Guest not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    const guest: Guest = {
      id: body.id,
      nama: body.nama,
      telepon: body.telepon,
      email: body.email,
      undangan_dikirim: body.undangan_dikirim ?? false,
      rsvp_status: body.rsvp_status,
      jumlah_hadir: body.jumlah_hadir || 0,
      pilihan_makan: body.pilihan_makan,
      nomor_meja: body.nomor_meja,
      catatan: body.catatan,
    }

    await updateRow(SHEET_NAMES.GUESTS, actualRow, guestToRow(guest))
    return Response.json({ guest })
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

    const rows = await getSheetData(SHEET_NAMES.GUESTS)
    const rowIndex = rows.findIndex((r) => r[0] === id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Guest not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    await deleteRow(SHEET_NAMES.GUESTS, actualRow)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
