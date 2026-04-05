import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

function getDriveAuth(): GoogleAuth {
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
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
}

const drive = google.drive({ version: 'v3', auth: getDriveAuth() })

export function getDriveFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!id) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is not configured')
  }
  return id
}

export async function uploadImageToDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<string> {
  const folderId = getDriveFolderId()

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  }

  const media = {
    mimeType,
    body: buffer,
  }

  const { data } = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id',
  })

  if (!data.id) {
    throw new Error('Failed to upload file — no file ID returned')
  }

  await drive.permissions.create({
    fileId: data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return `https://drive.google.com/uc?export=view&id=${data.id}`
}

export async function deleteImageFromDrive(fileUrl: string): Promise<void> {
  const match = fileUrl.match(/id=([^&]+)/)
  if (!match) return

  const fileId = match[1]
  try {
    await drive.files.delete({ fileId })
  } catch {
    // ignore — file may already be deleted or permissions changed
  }
}
