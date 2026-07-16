import { NextResponse } from "next/server";
import { analysisPrisma } from "@/modules/analysis/infrastructure/persistence/prisma-structured-knowledge-store";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const { id, fileId } = await params;
  const file = await analysisPrisma.codeFileRecord.findFirst({
    where: { id: fileId, repositoryId: id },
    include: { symbols: true },
  });
  return file
    ? NextResponse.json(file)
    : NextResponse.json({ error: "File not found." }, { status: 404 });
}
