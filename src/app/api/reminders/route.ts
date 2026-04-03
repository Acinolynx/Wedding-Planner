import { getSheetData, SHEET_NAMES, getConfig } from '@/lib/sheets'
import type { ChecklistItem, TaskStatus, Priority } from '@/types'
import { Resend } from 'resend'

function parseChecklistRow(row: string[], index: number): ChecklistItem {
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

function getIndonesianDate(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

const priorityLabel: Record<Priority, string> = {
  high: 'TINGGI',
  medium: 'SEDANG',
  low: 'RENDAH',
}

export async function POST(req: Request): Promise<Response> {
  const reminderSecret = process.env.REMINDER_SECRET
  if (!reminderSecret) {
    return Response.json({ error: 'REMINDER_SECRET not configured' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${reminderSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const toEmail = process.env.ALLOWED_EMAIL
  if (!toEmail) {
    return Response.json({ error: 'ALLOWED_EMAIL not configured' }, { status: 500 })
  }

  try {
    const rows = await getSheetData(SHEET_NAMES.CHECKLIST)
    const items = rows.map((row, i) => parseChecklistRow(row, i))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const approachingTasks = items.filter((item) => {
      if (!item.due_date || item.status === 'done') return false
      const dueDate = new Date(item.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === sevenDaysFromNow.getTime()
    })

    if (approachingTasks.length === 0) {
      return Response.json({ sent: false, count: 0, message: 'No tasks due in 7 days' })
    }

    const config = await getConfig()
    const coupleNames = config
      ? `${config.nama_pengantin_1} & ${config.nama_pengantin_2}`
      : 'Wedding Planner'

    const taskList = approachingTasks
      .map(
        (t, i) =>
          `${i + 1}. [${priorityLabel[t.prioritas]}] ${t.task} — Due: ${getIndonesianDate(t.due_date!)}${t.assignee ? ` (${t.assignee})` : ''}`
      )
      .join('\n')

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Wedding Planner — ${approachingTasks.length} Task Mendatang</h2>
        <p>Berikut adalah task yang jatuh tempo dalam <strong>7 hari</strong> ke depan:</p>
        <ol style="line-height: 1.8;">
          ${approachingTasks.map((t) => `
            <li>
              <strong>[${priorityLabel[t.prioritas]}]</strong> ${t.task}
              <br><span style="color: #666;">Due: ${getIndonesianDate(t.due_date!)}${t.assignee ? ` — ${t.assignee}` : ''}</span>
            </li>
          `).join('')}
        </ol>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 14px;">— ${coupleNames}</p>
      </div>
    `

    const textBody = `Wedding Planner — ${approachingTasks.length} Task Mendatang (7 Hari Lagi)

Berikut adalah task yang jatuh tempo dalam 7 hari ke depan:

${taskList}

Segera selesaikan task-task ini!

— ${coupleNames}`

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: 'Wedding Planner <onboarding@resend.dev>',
      to: [toEmail],
      subject: `Wedding Planner — ${approachingTasks.length} Task Mendatang (7 Hari Lagi)`,
      html: htmlBody,
      text: textBody,
    })

    return Response.json({
      sent: true,
      count: approachingTasks.length,
      tasks: approachingTasks.map((t) => t.task),
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
