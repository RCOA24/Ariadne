import { NextResponse } from "next/server";
import {
  importService,
  ownerIdFrom,
} from "@/modules/repository/api/repository-api";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return NextResponse.json(
      await importService().importAsync(
        (await params).id,
        ownerIdFrom(request),
      ),
    );
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
