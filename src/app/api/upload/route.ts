import { NextRequest } from 'next/server'
import { uploadImageToDrive } from '@/lib/drive'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'File size must be under 5MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `moodboard-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const url = await uploadImageToDrive(fileName, file.type, buffer)

    return Response.json({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: `Failed to upload image: ${message}` },
      { status: 500 }
    )
  }
}
