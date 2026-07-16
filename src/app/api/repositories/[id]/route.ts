import { NextResponse } from "next/server";
import { managementService, ownerIdFrom } from "@/modules/repository/api/repository-api";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const repository = await managementService().get(ownerIdFrom(request), (await params).id); return repository ? NextResponse.json(repository) : NextResponse.json({ error: "Repository not found." }, { status: 404 }); }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { const deleted = await managementService().delete(ownerIdFrom(request), (await params).id); return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Repository not found." }, { status: 404 }); }
