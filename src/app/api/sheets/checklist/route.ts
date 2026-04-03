export async function GET() {
  return Response.json({ checklist: [] })
}

export async function POST() {
  return Response.json({ item: {} })
}

export async function PUT() {
  return Response.json({ item: {} })
}

export async function DELETE() {
  return Response.json({ success: true })
}
