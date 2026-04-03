import * as XLSX from 'xlsx'

interface SheetTab {
  name: string
  headers: string[]
  rows: Record<string, string | number | boolean | undefined>[]
}

export function exportToExcel(tabs: SheetTab[], filename = 'wedding-planner'): void {
  const workbook = XLSX.utils.book_new()

  for (const tab of tabs) {
    const wsData = [tab.headers, ...tab.rows.map((row) => tab.headers.map((h) => row[h] ?? ''))]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(workbook, ws, tab.name)
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
