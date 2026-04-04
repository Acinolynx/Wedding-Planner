import { NextRequest } from 'next/server'
import {
  getMoodboardNotes,
  addMoodboardNote,
  updateMoodboardNote,
  deleteMoodboardNote,
  initMoodboardSheet,
} from '@/lib/sheets'
import type { MoodboardNote } from '@/types'

export async function GET(): Promise<Response> {
  try {
    const notes = await getMoodboardNotes()
    return Response.json({ data: notes })
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
    const note: Omit<MoodboardNote, 'tanggal_dibuat'> = {
      id: body.id,
      judul: body.judul,
      kategori: body.kategori,
      gambar_url: body.gambar_url || undefined,
      catatan: body.catatan || '',
    }

    await addMoodboardNote(note)
    const notes = await getMoodboardNotes()
    return Response.json({ data: notes })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const note: MoodboardNote = {
      id: body.id,
      judul: body.judul,
      kategori: body.kategori,
      gambar_url: body.gambar_url || undefined,
      catatan: body.catatan || '',
      tanggal_dibuat: body.tanggal_dibuat,
    }

    await updateMoodboardNote(body.rowIndex, note)
    const notes = await getMoodboardNotes()
    return Response.json({ data: notes })
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

    await deleteMoodboardNote(rowIndex)
    const notes = await getMoodboardNotes()
    return Response.json({ data: notes })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(): Promise<Response> {
  try {
    await initMoodboardSheet()
    const notes = await getMoodboardNotes()
    return Response.json({ data: notes })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
