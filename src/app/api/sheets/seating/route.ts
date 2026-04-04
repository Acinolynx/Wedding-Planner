import { NextRequest } from 'next/server'
import {
  getSeatingTables,
  addSeatingTable,
  updateSeatingTable,
  deleteSeatingTable,
  initSeatingSheet,
} from '@/lib/sheets'
import type { SeatingTable } from '@/types'

export async function GET(): Promise<Response> {
  try {
    const tables = await getSeatingTables()
    return Response.json({ data: tables })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return Response.json({ data: [] })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const table: SeatingTable = {
      nomor_meja: Number(body.nomor_meja),
      nama_meja: body.nama_meja,
      kapasitas: Number(body.kapasitas),
    }

    await addSeatingTable(table)
    const tables = await getSeatingTables()
    return Response.json({ data: tables })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const table: SeatingTable = {
      nomor_meja: Number(body.nomor_meja),
      nama_meja: body.nama_meja,
      kapasitas: Number(body.kapasitas),
    }

    await updateSeatingTable(body.rowIndex, table)
    const tables = await getSeatingTables()
    return Response.json({ data: tables })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const rowIndex = Number(searchParams.get('rowIndex'))

    if (isNaN(rowIndex)) {
      return Response.json({ error: 'rowIndex is required' }, { status: 400 })
    }

    await deleteSeatingTable(rowIndex)
    const tables = await getSeatingTables()
    return Response.json({ data: tables })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(): Promise<Response> {
  try {
    await initSeatingSheet()
    const tables = await getSeatingTables()
    return Response.json({ data: tables })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
