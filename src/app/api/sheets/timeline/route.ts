import { getTimelineEvents, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, initTimelineSheet } from '@/lib/sheets'
import type { TimelineEvent } from '@/types'
import { randomUUID } from 'crypto'

export async function GET(): Promise<Response> {
  try {
    const data = await getTimelineEvents()
    return Response.json({ data })
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

    if (!body.judul || !body.waktu) {
      return Response.json({ error: 'Judul and waktu are required' }, { status: 400 })
    }

    const id = randomUUID()
    const event: TimelineEvent = {
      id,
      waktu: body.waktu,
      judul: body.judul,
      lokasi: body.lokasi,
      catatan: body.catatan,
      urutan: body.urutan ?? 0,
    }

    await addTimelineEvent(event)
    const data = await getTimelineEvents()
    return Response.json({ data }, { status: 201 })
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

    if (!body.rowIndex && body.rowIndex !== 0) {
      return Response.json({ error: 'rowIndex is required' }, { status: 400 })
    }

    const event: TimelineEvent = {
      id: body.id,
      waktu: body.waktu,
      judul: body.judul,
      lokasi: body.lokasi,
      catatan: body.catatan,
      urutan: body.urutan ?? 0,
    }

    await updateTimelineEvent(body.rowIndex, event)
    const data = await getTimelineEvents()
    return Response.json({ data })
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
    const rowIndex = searchParams.get('rowIndex')

    if (rowIndex === null) {
      return Response.json({ error: 'rowIndex is required' }, { status: 400 })
    }

    await deleteTimelineEvent(Number(rowIndex))
    const data = await getTimelineEvents()
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(): Promise<Response> {
  try {
    await initTimelineSheet()
    const data = await getTimelineEvents()
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
