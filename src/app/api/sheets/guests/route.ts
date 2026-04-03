export async function GET() {
  return Response.json({ guests: [] })
}

export async function POST() {
  return Response.json({ guest: {} })
}

export async function PUT() {
  return Response.json({ guest: {} })
}

export async function DELETE() {
  return Response.json({ success: true })
}
