import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

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

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

export const SHEET_NAMES = {
  GUESTS: 'Tamu',
  BUDGET: 'Budget',
  VENDORS: 'Vendor',
  CHECKLIST: 'Checklist',
  CONFIG: 'Config',
} as const

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
    // rowIndex is 1-based; Sheets API uses 0-based index for dimensions
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
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
