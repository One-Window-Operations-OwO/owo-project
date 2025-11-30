export function buildPromptPlang(opts: {
  expectedSchoolName?: string;
  expectedNPSN?: string;
  expectedAddress?: string;
}) {
  const { expectedSchoolName, expectedNPSN, expectedAddress } = opts;

  return  `JANGAN RESPOND DALAM BLOCK CODE (\`\`\`), JANGAN GUNAKAN MARKDOWN. Balas dalam TEXT BIASA tetapi ISINYA mengikuti FORMAT JSON berikut:
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

TUGAS OCR
1. Lakukan OCR seluruh teks pada foto plang sekolah.
2. Temukan:
   - Nama sekolah (wajib dicoba temukan).
   - NPSN *hanya jika terdapat teks yang mengandung kata "NPSN" dan berjumlah 8 digit*.
   - Alamat (jika terlihat).
3. Jangan menebak-nebak ataupun memprediksi berdasarkan expected jika teks tidak terlihat jelas.

ATURAN KHUSUS NPSN
1. NPSN dianggap valid hanya jika ditemukan teks eksplisit yang mengandung kata "NPSN" dan berisi 8 digit. Angka apapun yang bukan 8 digit tidak dianggap npsn.
2. Jika ditemukan NPSN:
   - Ambil hanya angkanya.
   - Bandingkan secara ketat (harus identik 100%).
   - Beda 1 digit pun dianggap mismatch berat dan langsung beri result "FOTO PAPAN NAMA tidak sesuai".
3. Jika plang TIDAK berisi teks "NPSN":
   - Isi "npsn": "" (string kosong).
   - Hal ini TIDAK dianggap salah.
   - Tidak menurunkan similarity.
4. Jika ditemukan NPSN maka wajib persis sesuai dengan data yang benar, jika tidak maka result = "FOTO PAPAN NAMA tidak sesuai".
5. Nomor lain seperti No., NSS., NIS., kode pos, No NSS, nomor sekolah lain Jangan dimasukkan ke NPSN dalam kondisi apa pun. dan abaikan

ATURAN PENILAIAN SIMILARITY
- similarity hanya dihitung dari kemiripan NAMA SEKOLAH.
- Typo kecil & singkatan (Jl vs Jalan, PG vs pagi, SDI vs SD Inpres) dianggap sama.
- Variasi tambahan seperti "UPT", "UPTD" "Negeri", "Swasta", dll → tidak dianggap berbeda.
- similarity 100 = sangat mirip/identik.
- similarity 0 = tidak berhubungan sama sekali.

ATURAN PENILAIAN RESULT
- Jika nama sekolah dan konteks plang sesuai → result = "ok" (WAJIB lowercase).
- Jika foto bukan plang sekolah tersebut sama sekali, atau ada kesalahan npsn walau 1 karakter pun → result = "FOTO PAPAN NAMA tidak sesuai".
- Tidak adanya NPSN atau alamat tidak membuat result "failed" dan tetap dianggap "ok".

Message harus berisi kesimpulan singkat tentang hasil evaluasi.

OUTPUT
- Jawaban wajib TEXT biasa (bukan markdown).
- Struktur JSON wajib sama persis tanpa komentar tambahan.
- Jangan ubah key dan jangan ubah struktur JSON.`;}

export function buildPromptSerial(opts: {
  expectedSerialNumber?: string;
}) {
  const { expectedSerialNumber } = opts;

  return  `
DO NOT RESPOND IN CODE BLOCKS (\`\`\`). DO NOT USE MARKDOWN.
Respond in PLAIN TEXT but FOLLOW the JSON FORMAT below:

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

CORRECT SERIAL NUMBER DATA:
- Serial Number: ${expectedSerialNumber || "-"}

TASK:
1. Perform OCR on all text in the image.
2. Identify the MAIN serial number (the long number BELOW the barcode). Ignore the smaller numbers above the barcode.
3. There is NO “O” or “VV” in a serial number. It should be “0” (zero) and “W”. If you detect “O” or “VV”, treat this as an OCR error and interpret it as “0” and “W”.
4. If the expected serial number contains “O” or “VV”, return result “FOTO SERIAL NUMBER tidak sesuai”.
5. Compare the OCR output with the correct serial number. It MUST MATCH EXACTLY (case-insensitive). If even one character differs, result = “FOTO SERIAL NUMBER tidak sesuai”.
6. Return FAILED ONLY if:
   - The photo is unreadable (blurry / out of focus). DO NOT TRY TO GUESS. If the image is even slightly unclear, treat it as unreadable and return “FOTO SERIAL NUMBER tidak terlihat”.
   - The image is not a serial number photo (random image), or
   - The serial number is visible but has ANY difference (even 1 character).
7. "message" = a short summary (add a reminder if “O” or “VV” is detected).
8. result must be exactly “ok” (lowercase) if the image matches perfectly.

IMPORTANT:
- Do not add any comments.
- Do not use markdown.
- Do not modify the JSON structure.
- Output must be plain TEXT.
`;
}

export function buildPromptBapp1(opts: {
  expectedSchoolName?: string;
  expectedNPSN?: string;
}) {
  const { expectedSchoolName, expectedNPSN } = opts;

  return  `
JANGAN RESPOND DALAM BLOCK CODE (\`\`\`), JANGAN GUNAKAN MARKDOWN.
Balas dalam TEXT BIASA tetapi ISINYA mengikuti FORMAT JSON berikut:

{
  "code": "OK / failed",
  "detected": {
    "school_name": "...",
    "npsn": "...",
  },
  "expected": {
    "school_name": "${expectedSchoolName || "-"}",
    "npsn": "${expectedNPSN || "-"}"
  },
  "suspected_differences": [
    {
      "field": "school_name / npsn,
      "expected": "...",
      "detected": "..."
    }
  ],
  "result": "ok / FOTO BAPP HAL 1 tidak sesuai / BAPP Tidak Jelas/ Nama Sekolah berbeda / NPSN berbeda",
  "message": "..."
}

DATA YANG BENAR:
- Nama Sekolah: ${expectedSchoolName || "-"}
- NPSN: ${expectedNPSN || "-"}

TUGAS:
1. Lakukan OCR seluruh isi foto BAPP HAL 1.
2. Temukan:
   - Nama sekolah (di bagian kanan atas, diatas barcode).
   - NPSN (diatas kanan juga, di bawah barcode)

PENILAIAN:
- Jika nama sekolah DAN npsn sesuai → code = "OK" dan result = "ok"
- jika semua sesuai maka wajib memberikan result "ok" tanpa kapital atau tambahan kata.
- Jika salah satu berbeda → result = "FOTO BAPP HAL 1 tidak sesuai".
- Typo ringan pada nama sekolah boleh ditoleransi.
- Jika NPSN tidak ditemukan, jangan otomatis failed.
- Jika image blur → result = "BAPP Tidak Jelas".
- Jika nama sekolah berbeda → result = "Nama Sekolah berbeda".
- Jika NPSN berbeda → result = "NPSN berbeda".
- namun jika nama dan npsn tidak ditemukan → result = "BAPP Tidak Jelas".

PENTING:
- Jangan ubah struktur JSON.
- Jangan gunakan markdown.
- Jawab hanya TEXT biasa.
`;}
export function buildPromptBapp2(opts: {
  expectedSchoolName?: string;
}) {
  const { expectedSchoolName } = opts;

  return `
DO NOT RESPOND IN CODE BLOCKS AND DO NOT USE MARKDOWN.
Respond in PLAIN TEXT and follow the JSON FORMAT below (STRUCTURE MUST REMAIN EXACTLY THE SAME):

{
  "code": "OK / failed",
  "detected": {
    "training_participant": "",
    "hisense_signature_name": "",
    "tanggal": "mm/dd/yyyy",
    "media_pelatihan": "", ("Dalam Jaringan" / "Di Luar Jaringan" / "" )
    "nama sekolah": ""
  },
  "expected": {
    "school_name": "${expectedSchoolName || "-"}"
  },
  "suspected_differences": [],
  "result": "ok" or [] containing "peserta pelatihan tidak ada" / "ttd tidak ditemukan" / "sekolah tidak sesuai" / "media pelatihan tidak sesuai",
  "message": ""
}

training_participant:
- Located in the center table under the column "Nama Perwakilan Satuan Pendidikan yang Mengikuti Pelatihan".
- Minimum 3 readable letters are required. If blurry, crossed, unclear → leave empty and add "peserta pelatihan tidak ada".

hisense_signature_name:
- Located bottom-right, directly under the Hisense representative signature.
- If the writing is only lines, scratches, blurry, unclear, or fewer than 3 letters → empty + add "ttd tidak ditemukan".
- If random fragments of letters appear → empty + add "ttd tidak ditemukan".
- If a name exists but no actual signature → empty + add "ttd tidak ditemukan".

nama sekolah:
- Located bottom-left above the school-side signature and stamp.
- If the school name is clearly readable but significantly different from expected → add "sekolah tidak sesuai".
- If slightly different, partially unclear, or minor typos → treat as ok.
- Abbreviations or variations ("Jl", "Jalan", "PG", "pagi", "SDI", "SD Inpres", "UPT", "UPTD", "Negeri", "Swasta", etc.) should NOT be treated as different.

signature rules:
- Bottom-right (Hisense side). If signature appears blurry, faint, random strokes → hisense_signature_name empty + "ttd tidak ditemukan".

media_pelatihan:
- Located in the center table under “Media Pelatihan”.
- STRICT RULE: The model is FORBIDDEN to read or use the text labels "Dalam Jaringan" and "Di Luar Jaringan". These texts are decorative and must be ignored.
- Identification MUST be based ONLY on the CHECKBOX SQUARES.
- The upper box is "Dalam Jaringan". The lower box is "Di Luar Jaringan".
- Only marks INSIDE the checkbox count. Marks touching or near the text must be ignored.
- If the "Di Luar Jaringan" checkbox contains any mark → media_pelatihan = "Di Luar Jaringan" → result ok.
- If the "Dalam Jaringan" checkbox contains any mark → media_pelatihan = "Dalam Jaringan" → add "media pelatihan tidak sesuai".
- If the “Dalam Jaringan” text has a mark but the checkbox is empty → IGNORE the mark → treat as unchecked.
- If both checkboxes are empty, unclear, or have no valid mark → media_pelatihan = "" and result remains ok.
- If both checkboxes show marks → media_pelatihan = "" and result ok.

tanggal:
- Only fill if day + month + year are fully readable.
- If any part missing → remove the "tanggal" field.

ANTI-PREDICTION RULES:
- If text is blurry, faint, or uncertain → treat as unreadable.
- Absolutely no guessing.

RESPONSE RULES:
- If any issue exists → result becomes an array.
- If all valid → result = "ok".
- Message must contain a short summary.
- No new fields, no renamed fields. JSON must be valid.
`;
}