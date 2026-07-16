import { NextResponse } from "next/server";
import { SearchService } from "@/modules/analysis";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  const filters = {
    repositoryId: params.get("repository") ?? undefined,
    language: params.get("language") ?? undefined,
    fileType: params.get("fileType") ?? undefined,
    symbolType: params.get("symbolType") ?? undefined,
  };
  return NextResponse.json(
    await new SearchService().search(
      query,
      filters,
      Number(params.get("limit") ?? 50),
    ),
  );
}
