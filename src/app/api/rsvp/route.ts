import { getSheetData, updateRow, SHEET_NAMES } from '@/lib/sheets'
import type { Guest, RSVPStatus } from '@/types'

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

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')

    if (!name || name.length < 2) {
      return Response.json({ error: 'Name query parameter required (min 2 chars)' }, { status: 400 })
    }

    const rows = await getSheetData(SHEET_NAMES.GUESTS)
    const guests = rows
      .map((row, i) => parseGuestRow(row, i))
      .filter((g) => g.nama.toLowerCase().includes(name.toLowerCase()))
      .slice(0, 10)
      .map((g) => ({
        id: g.id,
        nama: g.nama,
        rsvp_status: g.rsvp_status,
        jumlah_hadir: g.jumlah_hadir,
        pilihan_makan: g.pilihan_makan || '',
        catatan: g.catatan || '',
      }))

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

    if (!body.id) {
      return Response.json({ error: 'Guest ID is required' }, { status: 400 })
    }

    const rows = await getSheetData(SHEET_NAMES.GUESTS)
    const rowIndex = rows.findIndex((r) => r[0] === body.id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Guest not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    const guest: Guest = {
      id: body.id,
      nama: rows[rowIndex][1] || '',
      telepon: rows[rowIndex][2] || undefined,
      email: rows[rowIndex][3] || undefined,
      undangan_dikirim: rows[rowIndex][4] === 'TRUE' || rows[rowIndex][4] === 'true',
      rsvp_status: (body.rsvp_status as RSVPStatus) || 'pending',
      jumlah_hadir: Number(body.jumlah_hadir) || 0,
      pilihan_makan: body.pilihan_makan || undefined,
      nomor_meja: rows[rowIndex][8] ? Number(rows[rowIndex][8]) : undefined,
      catatan: body.catatan || undefined,
    }

    const rowValues = [
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

    await updateRow(SHEET_NAMES.GUESTS, actualRow, rowValues)
    return Response.json({ success: true, guest: { nama: guest.nama, rsvp_status: guest.rsvp_status } })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
