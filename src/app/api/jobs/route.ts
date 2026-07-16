import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { JobQueue, type JobType } from "@/modules/shared/jobs/job-queue";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(await new JobQueue().monitoring());
}
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type: JobType;
      payload: Record<string, unknown>;
      maxAttempts?: number;
    };
    return NextResponse.json(await new JobQueue().enqueue(body.type, body.payload as Prisma.InputJsonValue, body.maxAttempts), { status: 202 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Job could not be queued.",
      },
      { status: 400 },
    );
  }
}
