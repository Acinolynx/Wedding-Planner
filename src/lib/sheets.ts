import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'
import type { WeddingConfig, SeatingTable, MoodboardNote, Guest, RSVPStatus, ChecklistItem, TaskStatus, Priority, BudgetItem, PaymentStatus, Vendor, TimelineEvent } from '@/types'

function getAuth(): GoogleAuth {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials not configured')
  }

  return new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export const sheets = google.sheets({ version: 'v4', auth: getAuth() })

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID
  if (!id) {
    throw new Error('GOOGLE_SPREADSHEET_ID environment variable is not configured')
  }
  return id
}

export const SPREADSHEET_ID = getSpreadsheetId()

export const SHEET_NAMES = {
  GUESTS: 'Tamu',
  BUDGET: 'Budget',
  VENDORS: 'Vendor',
  CHECKLIST: 'Checklist',
  CONFIG: 'Config',
  SEATING: 'Tata Letak',
  MOODBOARD: 'Moodboard',
  TIMELINE: 'Timeline',
} as const

async function getSheetId(sheetName: string): Promise<number> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  })

  const sheet = response.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  )

  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet "${sheetName}" not found in spreadsheet`)
  }

  return sheet.properties.sheetId
}

export async function getSheetData(sheetName: string): Promise<string[][]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return []
    }

    // Skip header row (index 0)
    return rows.slice(1)
  } catch {
    return []
  }
}

export async function appendRow(sheetName: string, values: string[]): Promise<void> {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to append row to ${sheetName}: ${message}`)
  }
}

export async function updateRow(
  sheetName: string,
  rowIndex: number,
  values: string[]
): Promise<void> {
  try {
    // rowIndex is 1-based (row 1 = header), so we target the exact row
    const range = `${sheetName}!A${rowIndex}:ZZ${rowIndex}`
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to update row ${rowIndex} in ${sheetName}: ${message}`)
  }
}

export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  try {
    const sheetId = await getSheetId(sheetName)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to delete row ${rowIndex} from ${sheetName}: ${message}`)
  }
}

const CONFIG_HEADERS = [
  'tanggal_pernikahan',
  'nama_pengantin_1',
  'nama_pengantin_2',
  'venue',
  'total_budget',
  'target_tamu',
]

export async function getConfig(): Promise<WeddingConfig | null> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAMES.CONFIG}!A2:F2`,
    })

    const row = response.data.values?.[0]
    if (!row) return null

    return {
      tanggal_pernikahan: row[0] || '',
      nama_pengantin_1: row[1] || '',
      nama_pengantin_2: row[2] || '',
      venue: row[3] || '',
      total_budget: Number(row[4]) || 0,
      target_tamu: Number(row[5]) || 0,
    }
  } catch {
    return null
  }
}

export async function updateConfig(config: WeddingConfig): Promise<void> {
  try {
    const values = [
      config.tanggal_pernikahan,
      config.nama_pengantin_1,
      config.nama_pengantin_2,
      config.venue || '',
      String(config.total_budget),
      String(config.target_tamu),
    ]

    const existing = await getConfig()
    if (existing) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.CONFIG}!A2:F2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      })
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAMES.CONFIG,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [CONFIG_HEADERS, values] },
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to update config: ${message}`)
  }
}

const SEATING_HEADERS = ['nomor_meja', 'nama_meja', 'kapasitas']

export async function getSeatingTables(): Promise<SeatingTable[]> {
  const rows = await getSheetData(SHEET_NAMES.SEATING)
  return rows
    .filter((row) => row.length >= 3 && row[0])
    .map((row) => ({
      nomor_meja: Number(row[0]) || 0,
      nama_meja: row[1] || '',
      kapasitas: Number(row[2]) || 0,
    }))
}

export async function addSeatingTable(table: SeatingTable): Promise<void> {
  try {
    await appendRow(SHEET_NAMES.SEATING, [
      String(table.nomor_meja),
      table.nama_meja,
      String(table.kapasitas),
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to add seating table: ${message}`)
  }
}

export async function updateSeatingTable(
  rowIndex: number,
  table: SeatingTable
): Promise<void> {
  try {
    await updateRow(SHEET_NAMES.SEATING, rowIndex + 1, [
      String(table.nomor_meja),
      table.nama_meja,
      String(table.kapasitas),
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to update seating table: ${message}`)
  }
}

export async function deleteSeatingTable(rowIndex: number): Promise<void> {
  try {
    await deleteRow(SHEET_NAMES.SEATING, rowIndex + 1)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to delete seating table: ${message}`)
  }
}

export async function initSeatingSheet(): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAMES.SEATING,
                gridProperties: { rowCount: 100, columnCount: 10 },
              },
            },
          },
        ],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (!message.includes('already exists')) {
      throw new Error(`Failed to initialize seating sheet: ${message}`)
    }
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAMES.SEATING}!A1:C1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SEATING_HEADERS] },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to initialize seating sheet headers: ${message}`)
  }
}

const MOODBOARD_HEADERS = ['id', 'judul', 'kategori', 'gambar_url', 'catatan', 'tanggal_dibuat']

export async function getMoodboardNotes(): Promise<MoodboardNote[]> {
  const rows = await getSheetData(SHEET_NAMES.MOODBOARD)
  return rows
    .filter((row) => row.length >= 6 && row[0])
    .map((row) => ({
      id: row[0],
      judul: row[1] || '',
      kategori: (row[2] || 'lainnya') as MoodboardNote['kategori'],
      gambar_url: row[3] || undefined,
      catatan: row[4] || '',
      tanggal_dibuat: row[5] || '',
    }))
}

export async function addMoodboardNote(note: Omit<MoodboardNote, 'tanggal_dibuat'>): Promise<void> {
  try {
    const now = new Date().toISOString().split('T')[0]
    await appendRow(SHEET_NAMES.MOODBOARD, [
      note.id,
      note.judul,
      note.kategori,
      note.gambar_url || '',
      note.catatan,
      now,
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to add moodboard note: ${message}`)
  }
}

export async function updateMoodboardNote(
  rowIndex: number,
  note: MoodboardNote
): Promise<void> {
  try {
    await updateRow(SHEET_NAMES.MOODBOARD, rowIndex + 1, [
      note.id,
      note.judul,
      note.kategori,
      note.gambar_url || '',
      note.catatan,
      note.tanggal_dibuat,
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to update moodboard note: ${message}`)
  }
}

export async function deleteMoodboardNote(rowIndex: number): Promise<void> {
  try {
    await deleteRow(SHEET_NAMES.MOODBOARD, rowIndex + 1)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to delete moodboard note: ${message}`)
  }
}

export async function initMoodboardSheet(): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAMES.MOODBOARD,
                gridProperties: { rowCount: 200, columnCount: 10 },
              },
            },
          },
        ],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (!message.includes('already exists')) {
      throw new Error(`Failed to initialize moodboard sheet: ${message}`)
    }
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAMES.MOODBOARD}!A1:F1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [MOODBOARD_HEADERS] },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to initialize moodboard sheet headers: ${message}`)
  }
}

export function parseBudgetRow(row: string[], index: number): BudgetItem {
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

export function budgetToRow(item: BudgetItem): string[] {
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

export function parseVendorRow(row: string[], index: number): Vendor {
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

export function vendorToRow(vendor: Vendor): string[] {
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

export function parseGuestRow(row: string[], index: number): Guest {
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

export function guestToRow(guest: Guest): string[] {
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

export function parseChecklistRow(row: string[], index: number): ChecklistItem {
  return {
    id: row[0] || String(index),
    task: row[1] || '',
    kategori: row[2] || '',
    due_date: row[3] || undefined,
    assignee: row[4] || undefined,
    status: (row[5] as TaskStatus) || 'todo',
    prioritas: (row[6] as Priority) || 'medium',
    catatan: row[7] || undefined,
  }
}

export function checklistToRow(item: ChecklistItem): string[] {
  return [
    item.id,
    item.task,
    item.kategori,
    item.due_date || '',
    item.assignee || '',
    item.status,
    item.prioritas,
    item.catatan || '',
  ]
}

const TIMELINE_HEADERS = ['id', 'waktu', 'judul', 'lokasi', 'catatan', 'urutan']

export function parseTimelineRow(row: string[], index: number): TimelineEvent {
  return {
    id: row[0] || String(index),
    waktu: row[1] || '00:00',
    judul: row[2] || '',
    lokasi: row[3] || undefined,
    catatan: row[4] || undefined,
    urutan: Number(row[5]) || 0,
  }
}

export function timelineToRow(event: TimelineEvent): string[] {
  return [
    event.id,
    event.waktu,
    event.judul,
    event.lokasi || '',
    event.catatan || '',
    String(event.urutan),
  ]
}

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  const rows = await getSheetData(SHEET_NAMES.TIMELINE)
  return rows
    .filter((row) => row.length >= 6 && row[0])
    .map((row, i) => parseTimelineRow(row, i))
    .sort((a, b) => a.urutan - b.urutan)
}

export async function addTimelineEvent(event: TimelineEvent): Promise<void> {
  try {
    await appendRow(SHEET_NAMES.TIMELINE, timelineToRow(event))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to add timeline event: ${message}`)
  }
}

export async function updateTimelineEvent(
  rowIndex: number,
  event: TimelineEvent
): Promise<void> {
  try {
    await updateRow(SHEET_NAMES.TIMELINE, rowIndex + 1, timelineToRow(event))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to update timeline event: ${message}`)
  }
}

export async function deleteTimelineEvent(rowIndex: number): Promise<void> {
  try {
    await deleteRow(SHEET_NAMES.TIMELINE, rowIndex + 1)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to delete timeline event: ${message}`)
  }
}

export async function initTimelineSheet(): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAMES.TIMELINE,
                gridProperties: { rowCount: 50, columnCount: 10 },
              },
            },
          },
        ],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (!message.includes('already exists')) {
      throw new Error(`Failed to initialize timeline sheet: ${message}`)
    }
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAMES.TIMELINE}!A1:F1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [TIMELINE_HEADERS] },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to initialize timeline sheet headers: ${message}`)
  }
}
