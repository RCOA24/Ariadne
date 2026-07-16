import { NextResponse } from "next/server";
import { SettingsService } from "@/modules/settings/application/settings-service";
const owner = (request: Request) =>
  request.headers.get("x-ariadne-owner-id") ?? "local-development";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return NextResponse.json(await new SettingsService().get(owner(request)));
}
export async function PUT(request: Request) {
  try {
    return NextResponse.json(
      await new SettingsService().save(owner(request), await request.json()),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Settings could not be saved.",
      },
      { status: 400 },
    );
  }
}
