import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  type Payload = {
  imageUrl: string;
  imageIndex: number;
  expectedSchoolName?: string;
  expectedNPSN?: string;
  expectedAddress?: string;
  expectedSerialNumber?: string;
};

const body: Payload = await req.json();

const {
  imageUrl,
  imageIndex,
  expectedSchoolName,
  expectedNPSN,
  expectedAddress,
  expectedSerialNumber,
} = body;

  const ai = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
  });

  // --- Ambil & encode gambar ---
  const imgRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const base64 = buffer.toString("base64");

const promptPlang = `
JANGAN RESPOND DALAM BLOCK CODE (\\\`\\\`\\\`), JANGAN GUNAKAN MARKDOWN.
Balas dalam TEXT BIASA tetapi ISINYA mengikuti FORMAT JSON berikut:

{
  "code": "OK / failed",
  "similarity": 0-100,
  "detected": {
    "school_name": "...",
    "npsn": "...",
    "address": "..."
  },
  "suspected_differences": [
    {
      "field": "school_name / npsn / address",
      "expected": "...",
      "detected": "..."
    }
  ],
  "result": "ok / FOTO PAPAN NAMA tidak sesuai",
  "message": "..."
}

DATA YANG BENAR:
- Nama: ${expectedSchoolName || "-"}
- NPSN: ${expectedNPSN || "-"}
- Alamat: ${expectedAddress || "-"}

TUGAS:
1. Lakukan OCR seluruh teks dalam foto plang sekolah.
2. Temukan nama sekolah, NPSN, dan alamat (NPSN & alamat opsional).
3. Bandingkan dengan data yang benar.
4. "similarity" = tingkat kemiripan nama sekolah (0-100).
5. Typo kecil & singkatan (Jl vs Jalan) TIDAK dianggap berbeda.
6. Tidak adanya NPSN atau alamat TIDAK membuat result failed.
7. Hanya beri result "FOTO PAPAN NAMA tidak sesuai" jika foto benar-benar BUKAN plang sekolah tersebut.
8. "message" = kesimpulan singkat.

PENTING:
- Jangan menambahkan komentar apa pun.
- Jangan menggunakan markdown.
- Jangan mengubah struktur JSON.
- Output harus TEXT biasa.
`;



const promptSerial = `
JANGAN RESPOND DALAM BLOCK CODE (\\\`\\\`\\\`), JANGAN GUNAKAN MARKDOWN.
Balas dalam TEXT BIASA tetapi ISINYA mengikuti FORMAT JSON berikut:

{
  "code": "OK / failed",
  "similarity": 0-100,
  "detected": {
    "serial_number": "..."
  },
  "expected": {
    "serial_number": "..."
  },
  "suspected_differences": [
    {
      "field": "serial_number",
      "expected": "...",
      "detected": "..."
    }
  ],
  "result": "ok / FOTO SERIAL NUMBER tidak sesuai / FOTO SERIAL NUMBER tidak terlihat",
  "message": "..."
}

DATA SERIAL NUMBER YANG BENAR:
- Serial Number: ${expectedSerialNumber || "-"}

TUGAS:
1. OCR seluruh teks dalam foto.
2. Temukan serial number utama (angka panjang di BAWAH barcode).
   Abaikan angka kecil di atas barcode.
3. Bandingkan hasil OCR dengan serial number yang benar.
4. Hanya beri FAILED jika:
   - foto bukan SN sama sekali (foto random), atau
   - serial number terlihat jelas tetapi berbeda jauh.
5. Jika serial number tidak terlihat → result = "FOTO SERIAL NUMBER tidak terlihat".
6. "message" = kesimpulan singkat.

PENTING:
- Jangan menambahkan komentar apa pun.
- Jangan menggunakan markdown.
- Jangan mengubah struktur JSON.
- Output harus TEXT biasa.
`;


   // pilih prompt
  const selectedPrompt = imageIndex === 0 ? promptPlang : promptSerial;

  // ====== Kirim ke Gemini ======
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      { inlineData: { mimeType: "image/jpeg", data: base64 } },
      { text: selectedPrompt },
    ],
  });

  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[\u0000-\u001F]+/g, "") // remove hidden chars
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON from AI",
        raw,
        cleaned,
      },
      { status: 500 }
    );
  }
  
  if (imageIndex === 0) {
    // Plang = kolom K
    parsed.autoEvaluation = {
      K: parsed.result === "ok" ? "Sesuai" : "Tidak Sesuai",
    };
  }

  if (imageIndex === 4) {
    // Serial Number = kolom N
    if (parsed.result === "ok") {
      parsed.autoEvaluation = { N: "Sesuai" };
    } else if (parsed.result === "FOTO SERIAL NUMBER tidak terlihat") {
      parsed.autoEvaluation = { N: "Tidak Terlihat" };
    } else {
      parsed.autoEvaluation = { N: "Tidak Sesuai" };
    }

    parsed.correctedValues = {
      serial_number: parsed.detected?.serial_number || "",
    };
  }

  return NextResponse.json(parsed);
}