import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function getDatadik(q: string) {
  const apiHeader = {
    "Content-Type": "application/x-www-form-urlencoded",
    cookie: process.env.DATADIK_COOKIE || "",
  };
  const res1 = await fetch(
    "https://datadik.kemendikdasmen.go.id/refsp/q/173F3996-ED37-4D49-8487-534D0CE53421",
    {
      method: "POST",
      headers: apiHeader,
      body: "q=" + encodeURIComponent(q || ""),
    }
  );

  const data = await res1.json();
  if (data.length === 0) {
    return null;
  }
  const id = data[0][0];
  const name = data[0][1];
  const address = data[0][3];
  const kecamatan = data[0][4];
  const kabupaten = data[0][5];
  const provinsi = data[0][6];

  const res2 = await fetch(
    "https://datadik.kemendikdasmen.go.id/ma74/sekolahptk/" + id + "/1",
    { headers: apiHeader }
  );
  const ptk = await res2.json();

  let kepalaSekolah = "";
  for (const person of ptk) {
    if (person.jabatan_ptk === "Kepala Sekolah") {
      kepalaSekolah = person.nama;
    }
  }

  return {
    id,
    name,
    address,
    kecamatan,
    kabupaten,
    provinsi,
    kepalaSekolah,
    ptk,
  };
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

    const [datadik, hisense] = await Promise.allSettled([
      getDatadik(q),
      getHisense(q_raw, cookie),
    ]);

    return NextResponse.json({
      datadik:
        datadik.status === "fulfilled"
          ? datadik.value
          : { error: datadik.reason.message },
      hisense:
        hisense.status === "fulfilled"
          ? hisense.value
          : { error: hisense.reason.message },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
