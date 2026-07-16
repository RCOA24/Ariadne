import { NextResponse } from "next/server";
import { JobQueue } from "@/modules/shared/jobs/job-queue";
export const runtime = "nodejs";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cancelled = await new JobQueue().cancel((await params).id);
  return cancelled
    ? NextResponse.json({ cancelled: true })
    : NextResponse.json({ error: "Job cannot be cancelled." }, { status: 404 });
}
