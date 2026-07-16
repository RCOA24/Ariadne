import { NextResponse } from "next/server";
import {
  githubInput,
  managementService,
  ownerIdFrom,
} from "@/modules/repository/api/repository-api";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return NextResponse.json(
    await managementService().list(ownerIdFrom(request)),
  );
}
export async function POST(request: Request) {
  try {
    const parsed = githubInput.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid GitHub repository input." },
        { status: 400 },
      );
    return NextResponse.json(
      await managementService().createFromGitHub(
        ownerIdFrom(request),
        parsed.data,
      ),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Repository could not be created.",
      },
      { status: 422 },
    );
  }
}
