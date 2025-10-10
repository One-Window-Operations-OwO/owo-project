
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { cookie } = await req.json();

    if (!cookie) {
      return NextResponse.json(
        { detail: "Cookie diperlukan." },
        { status: 400 },
      );
    }

    const res = await fetch("https://kemendikdasmen.hisense.id/r_dkm.php", {
      method: "GET",
      headers: { Cookie: `PHPSESSID=${cookie}` },
      redirect: "manual",
    });

    if (res.status === 200) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const verifierName = $(".dropdown-toggle").text().trim();

      if (verifierName) {
        return NextResponse.json({ valid: true, name: verifierName });
      }
    }

    return NextResponse.json({ valid: false });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
