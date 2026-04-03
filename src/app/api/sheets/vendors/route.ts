export async function GET() {
  return Response.json({ vendors: [] })
}

export async function POST() {
  return Response.json({ vendor: {} })
}

export async function PUT() {
  return Response.json({ vendor: {} })
}

export async function DELETE() {
  return Response.json({ success: true })
}
