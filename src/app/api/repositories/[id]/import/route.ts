import { NextResponse } from "next/server";
import {
  importService,
  analyzeImportedRepository,
  ownerIdFrom,
} from "@/modules/repository/api/repository-api";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const repositoryId = (await params).id;
    const ownerId = ownerIdFrom(request);
    const imported = await importService().importAsync(repositoryId, ownerId);
    if (imported.status !== "completed")
      return NextResponse.json(imported, { status: 422 });
    const analysis = await analyzeImportedRepository(repositoryId, ownerId);
    return NextResponse.json({ import: imported, analysis });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Import could not start.",
      },
      { status: 422 },
    );
  }
}
