import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Datadik via new service, follows NPSN (iin) and returns new shape
async function getDatadik(npsn: string) {
  if (!npsn) return null;
  const url = `https://jkt-dc01.taila6748c.ts.net/fetch-school-data?npsn=${encodeURIComponent(
    npsn || ""
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Datadik fetch failed: ${res.status}`);
  }

  // Returns shape: { npsn, namaSekolah, namaKepsek, noHpKepsek, guruLain: [...], ptkIdKepsek }
  const data = await res.json();

  // Ensure namaKepsek is in guruLain
  if (data && data.namaKepsek) {
    const alreadyInList = Array.isArray(data.guruLain)
      ? data.guruLain.some((g: any) =>
        (g.nama || "").trim().toLowerCase() === data.namaKepsek.trim().toLowerCase()
      )
      : false;
    if (!alreadyInList) {
      if (!Array.isArray(data.guruLain)) data.guruLain = [];
      data.guruLain.unshift({
        nama: data.namaKepsek,
        ptk_id: data.ptkIdKepsek || undefined,
        jabatan: "Kepala Sekolah",
      });
    }
  }
  return data;
}

const hisenseUrl = "https://kemendikdasmen.hisense.id/";

async function getHisense(npsn: string, cookie: string) {
  if (!cookie) throw new Error("Cookie PHPSESSID diperlukan");

  const res = await fetch(`${hisenseUrl}r_monitoring.php?inpsn=${npsn}`, {
    method: "GET",
    headers: { Cookie: `PHPSESSID=${cookie}` },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const firstRow = $(
    "#main-content > div > div > div > div.table-container > div > table > tbody tr"
  ).first();
  const onClickAttribute = firstRow.attr("onclick");
  const urlMatch = onClickAttribute?.match(/window\.open\('([^']*)'/);
  let nextPath = urlMatch ? urlMatch[1] : null;

  const firstTdStyle = firstRow.find("td").first().attr("style") || "";
  const isGreen = firstTdStyle.includes("color:green");

  if (!nextPath) return { isGreen, nextPath: null };

  const res2 = await fetch(`${hisenseUrl}${nextPath}`, {
    method: "GET",
    headers: { Cookie: `PHPSESSID=${cookie}` },
  });

  const dkmHtml = await res2.text();
  const $dkm = cheerio.load(dkmHtml);

  const queryString = nextPath.substring(nextPath.indexOf("?") + 1);
  nextPath = "?" + queryString;

  const schoolInfo: { [key: string]: string } = {};
  $dkm('.filter-section input[type="text"]').each((_, el) => {
    const label = $dkm(el)
      .prev("label")
      .text()
      .trim()
      .replace("Telp", "Telp PIC");
    const value = $dkm(el).val() as string;
    if (label) schoolInfo[label] = value;
  });

  const images: { [key: string]: string } = {};
  $dkm("#flush-collapseTwo img").each((_, el) => {
    const label = $dkm(el).closest(".card").find("label").text().trim();
    const src = $dkm(el).attr("src");
    if (label && src) images[label] = src;
  });
  const note: { [key: string]: string } = {};
  $dkm("#flush-collapseTwo #icttn").each((_, el) => {
    const card = $dkm(el);

    const label = $dkm(el)
      .closest(".col-md")
      .find("label")
      .first()
      .text()
      .trim();
    const catatan = (card.val() ?? "").toString().trim();
    const buktiLink =
      card.closest(".col-md").find(".form-group a").attr("onclick") || "";

    if (label) note[label] = catatan;
    if (buktiLink.trim()) note["bukti"] = buktiLink;
    console.log({ label, catatan, buktiLink });
  });

  const processHistory: {
    tanggal: string;
    status: string;
    keterangan: string;
  }[] = [];
  $dkm("#flush-collapseOne tbody tr").each((_, row) => {
    const columns = $dkm(row).find("td");
    processHistory.push({
      tanggal: $dkm(columns[0]).text().trim(),
      status: $dkm(columns[1]).text().trim(),
      keterangan: $dkm(columns[2]).text().trim(),
    });
  });

  const qs = new URLSearchParams(nextPath);
  const finalData = {
    schoolInfo,
    note,
    images,
    processHistory,
    q: qs.get("q") || "",
    npsn: schoolInfo["NPSN"] || "",
    iprop: qs.get("iprop") || "",
    ikab: qs.get("ikab") || "",
    ikec: qs.get("ikec") || "",
    iins: qs.get("iins") || "",
    ijenjang: qs.get("ijenjang") || "",
    ibp: qs.get("ibp") || "",
    iss: qs.get("iss") || "",
    isf: qs.get("isf") || "",
    istt: qs.get("istt") || "",
    itgl: qs.get("itgl") || "",
    itgla: qs.get("itgla") || "",
    itgle: qs.get("itgle") || "",
    ipet: qs.get("ipet") || "",
    ihnd: qs.get("ihnd") || "",
  };

  return { isGreen, ...finalData };
}

export async function POST(req: Request) {
  try {
    const { q_raw, q, cookie } = await req.json();
    // Fetch Hisense, but don't fail overall response if it errors
    let hisense: any = null;
    let hisenseError: string | null = null;
    try {
      hisense = await getHisense(q_raw, cookie);
    } catch (e: any) {
      hisenseError = e?.message || "Failed to fetch Hisense";
    }

    // Determine NPSN to follow for Datadik
    const npsnCandidate =
      (hisense && (hisense.npsn || hisense.iins)) || q || "";

    let datadik: any = null;
    let datadikError: string | null = null;
    try {
      datadik = await getDatadik(npsnCandidate);
    } catch (e: any) {
      datadikError = e?.message || "Failed to fetch Datadik";
    }

    return NextResponse.json({
      datadik: datadikError ? { error: datadikError } : datadik,
      hisense: hisenseError ? { error: hisenseError } : hisense,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
