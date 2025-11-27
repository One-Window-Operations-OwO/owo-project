import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildPromptBapp1, buildPromptPlang, buildPromptSerial, buildPromptBapp2 } from "@/lib/ai";

async function generateWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1500
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error("Retry failed")
}


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
  
  let prompt = "";

  if (imageIndex === 0) {
    prompt = buildPromptPlang({
      expectedSchoolName,
      expectedNPSN,
      expectedAddress,
    });
  } else if (imageIndex === 4) {
    prompt = buildPromptSerial({
      expectedSerialNumber,
    });
  } else if (imageIndex === 6) {
    prompt = buildPromptBapp1({
      expectedSchoolName,
      expectedNPSN,
    });
  } else if (imageIndex === 7) {
    prompt = buildPromptBapp2({
      expectedSchoolName,
    });
  } else {
    return NextResponse.json(
      { error: "Invalid imageIndex" },
      { status: 400 }
    );
  }

  const result = await generateWithRetry(() => {
  if (imageIndex === 7) {
    return ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64 } },
        { text: prompt },
      ],
    })
  } else {
    return ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64 } },
        { text: prompt },
      ],
    })
  }
})


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
  switch(imageIndex) {
    case 0:{
      parsed.autoEvaluation = {
      K: parsed.result === "ok" ? "Sesuai" : "Tidak Sesuai",
      }; 
      break;}
    case 4:{
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
      break;}
    case 6:{
      if (parsed.result === "ok") {
        parsed.autoEvaluation = { Q: "Lengkap" };
      } else if (parsed.result === "BAPP Tidak Jelas") {
        parsed.autoEvaluation = { Q: "BAPP Tidak Jelas" };
      } else if (parsed.result === "Nama Sekolah berbeda" || parsed.result === "NPSN berbeda") {
        parsed.autoEvaluation = { P: "Tidak Sesuai" };
      } else {
        parsed.autoEvaluation = { Q: "Tidak Sesuai" };
      } 
      break;}
    case 7:{
      const result = parsed.result;
      if (result === "ok") {
        parsed.autoEvaluation = { U: "Lengkap" };
        return NextResponse.json(parsed);
      }
      if (Array.isArray(result)) {
        const autoEval: Record<string, string> = {};

        if (result.includes("FOTO BAPP HAL 2 tidak jelas")) {
          autoEval.U = "BAPP Tidak Jelas";
        }

        if (result.includes("Stempel tidak ada")) {
          autoEval.T = "Tidak Ada";
        }
        if (result.includes("Sekolah tidak sesuai")) {
          autoEval.T = "Tidak Sesuai";
        }

        if (result.includes("ttd tidak ditemukan")) {
          autoEval.S = "TTD Tidak Ada";
        }

        if (result.includes("peserta pelatihan tidak ada")) {
          autoEval.V = "Tidak Ada";
        }

        parsed.autoEvaluation = autoEval;
      }
      break;}
  }
  return NextResponse.json(parsed);
}