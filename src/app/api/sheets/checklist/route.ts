import { getSheetData, appendRow, updateRow, deleteRow, SHEET_NAMES, parseChecklistRow, checklistToRow } from '@/lib/sheets'
import type { ChecklistItem } from '@/types'
import { randomUUID } from 'crypto'

export async function GET(): Promise<Response> {
  try {
    const rows = await getSheetData(SHEET_NAMES.CHECKLIST)
    const checklist: ChecklistItem[] = rows.map((row, i) => parseChecklistRow(row, i))
    return Response.json({ checklist })
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

    if (!body.task || !body.kategori) {
      return Response.json({ error: 'Task and kategori are required' }, { status: 400 })
    }

    const id = randomUUID()
    const item: ChecklistItem = {
      id,
      task: body.task,
      kategori: body.kategori,
      due_date: body.due_date,
      assignee: body.assignee,
      status: body.status || 'todo',
      prioritas: body.prioritas || 'medium',
      catatan: body.catatan,
    }

    await appendRow(SHEET_NAMES.CHECKLIST, checklistToRow(item))
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

    const rows = await getSheetData(SHEET_NAMES.CHECKLIST)
    const rowIndex = rows.findIndex((r) => r[0] === body.id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    const item: ChecklistItem = {
      id: body.id,
      task: body.task,
      kategori: body.kategori,
      due_date: body.due_date,
      assignee: body.assignee,
      status: body.status,
      prioritas: body.prioritas,
      catatan: body.catatan,
    }

    await updateRow(SHEET_NAMES.CHECKLIST, actualRow, checklistToRow(item))
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

    const rows = await getSheetData(SHEET_NAMES.CHECKLIST)
    const rowIndex = rows.findIndex((r) => r[0] === id)

    if (rowIndex === -1) {
      return Response.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    const actualRow = rowIndex + 2
    await deleteRow(SHEET_NAMES.CHECKLIST, actualRow)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
