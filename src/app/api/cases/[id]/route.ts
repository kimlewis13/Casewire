import { NextResponse } from "next/server";
import { deleteCase, getCase } from "@/lib/db";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/cases/[id]">
) {
  const { id } = await ctx.params;
  const existing = getCase(id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  deleteCase(id);
  return NextResponse.json({ ok: true });
}
