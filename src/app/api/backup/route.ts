import { getSheetData, appendRow, SHEET_NAMES } from '@/lib/sheets'
import { getSpreadsheetId, sheets } from '@/lib/sheets'

const ALL_SHEETS = [
  SHEET_NAMES.GUESTS,
  SHEET_NAMES.BUDGET,
  SHEET_NAMES.VENDORS,
  SHEET_NAMES.CHECKLIST,
  SHEET_NAMES.CONFIG,
  SHEET_NAMES.SEATING,
  SHEET_NAMES.MOODBOARD,
  SHEET_NAMES.TIMELINE,
]

export async function GET(): Promise<Response> {
  try {
    const results = await Promise.allSettled(
      ALL_SHEETS.map(async (name) => {
        const rows = await getSheetData(name)
        return { name, rows }
      })
    )

    const backup: Record<string, string[][]> = {}
    for (const result of results) {
      if (result.status === 'fulfilled') {
        backup[result.value.name] = result.value.rows
      }
    }

    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      spreadsheetId: getSpreadsheetId(),
      data: backup,
    }

    return Response.json(payload)
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

    if (!body.data || typeof body.data !== 'object') {
      return Response.json({ error: 'Invalid backup data' }, { status: 400 })
    }

    const results: { sheet: string; status: string; error?: string }[] = []

    for (const sheetName of ALL_SHEETS) {
      const rows = body.data[sheetName]
      if (!rows || !Array.isArray(rows)) {
        results.push({ sheet: sheetName, status: 'skipped', error: 'No data in backup' })
        continue
      }

      try {
        await clearSheet(sheetName)

        if (rows.length > 0) {
          const headers = getHeadersForSheet(sheetName)
          if (headers) {
            await appendRow(sheetName, headers)
          }

          for (const row of rows) {
            await appendRow(sheetName, row)
          }
        }

        results.push({ sheet: sheetName, status: 'restored' })
      } catch (err) {
        results.push({
          sheet: sheetName,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.status === 'restored').length
    const failedCount = results.filter((r) => r.status === 'failed').length

    return Response.json({
      results,
      summary: {
        total: ALL_SHEETS.length,
        restored: successCount,
        failed: failedCount,
        skipped: results.filter((r) => r.status === 'skipped').length,
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getHeadersForSheet(sheetName: string): string[] | null {
  switch (sheetName) {
    case SHEET_NAMES.GUESTS:
      return ['id', 'nama', 'telepon', 'email', 'undangan_dikirim', 'rsvp_status', 'jumlah_hadir', 'pilihan_makan', 'nomor_meja', 'catatan']
    case SHEET_NAMES.BUDGET:
      return ['id', 'kategori', 'item', 'estimasi', 'realisasi', 'status_bayar', 'vendor', 'tanggal_bayar', 'catatan']
    case SHEET_NAMES.VENDORS:
      return ['id', 'nama', 'kategori', 'kontak', 'telepon', 'harga', 'dp_dibayar', 'lunas', 'tanggal_kontrak', 'catatan']
    case SHEET_NAMES.CHECKLIST:
      return ['id', 'task', 'kategori', 'due_date', 'assignee', 'status', 'prioritas', 'catatan']
    case SHEET_NAMES.CONFIG:
      return ['tanggal_pernikahan', 'nama_pengantin_1', 'nama_pengantin_2', 'venue', 'total_budget', 'target_tamu']
    case SHEET_NAMES.SEATING:
      return ['nomor_meja', 'nama_meja', 'kapasitas']
    case SHEET_NAMES.MOODBOARD:
      return ['id', 'judul', 'kategori', 'gambar_url', 'catatan', 'tanggal_dibuat']
    case SHEET_NAMES.TIMELINE:
      return ['id', 'waktu', 'judul', 'lokasi', 'catatan', 'urutan']
    default:
      return null
  }
}

async function clearSheet(sheetName: string): Promise<void> {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: getSpreadsheetId(),
    })

    const sheet = response.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    )

    if (!sheet?.properties?.sheetId) return

    const rowCount = sheet.properties?.gridProperties?.rowCount || 1000
    if (rowCount <= 1) return

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: rowCount,
              },
            },
          },
        ],
      },
    })
  } catch {
    // sheet may not exist yet — skip
  }
}
