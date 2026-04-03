import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'
import type { WeddingConfig } from '@/types'

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to fetch sheet ${sheetName}: ${message}`)
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to fetch config: ${message}`)
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
