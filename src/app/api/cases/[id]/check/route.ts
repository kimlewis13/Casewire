import { NextResponse } from "next/server";
import { evaluateAndTrigger } from "@/lib/followup";

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/cases/[id]/check">
) {
  const { id } = await ctx.params;
  try {
    const result = await evaluateAndTrigger(id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
}
