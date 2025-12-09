import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await req.json(); 
    return NextResponse.json({ status: "success", message: "Logged successfully" });
  } catch (error: any) {
    console.error("[Client Log Error]:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
