import { getConfig, updateConfig } from '@/lib/sheets'
import type { WeddingConfig } from '@/types'

export async function GET(): Promise<Response> {
  try {
    const config = await getConfig()
    return Response.json({ config })
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

    if (!body.tanggal_pernikahan) {
      return Response.json({ error: 'Tanggal pernikahan is required' }, { status: 400 })
    }

    if (!body.nama_pengantin_1 || !body.nama_pengantin_2) {
      return Response.json({ error: 'Nama pengantin is required' }, { status: 400 })
    }

    const config: WeddingConfig = {
      tanggal_pernikahan: body.tanggal_pernikahan,
      nama_pengantin_1: body.nama_pengantin_1,
      nama_pengantin_2: body.nama_pengantin_2,
      venue: body.venue || '',
      total_budget: Number(body.total_budget) || 0,
      target_tamu: Number(body.target_tamu) || 0,
    }

    await updateConfig(config)
    return Response.json({ config })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
