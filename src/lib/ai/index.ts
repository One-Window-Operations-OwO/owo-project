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
1. NPSN dianggap valid hanya jika ditemukan teks eksplisit yang mengandung kata "NPSN" dan berisi 8 digit. Contoh valid: "NPSN : 12345678", "NPSN-1234", "Kode NPSN 1234".
2. Jika ditemukan NPSN:
   - Ambil hanya angkanya.
   - Bandingkan secara ketat (harus identik 100%).
   - Beda 1 digit pun dianggap mismatch berat.
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
3. Jika menemukan detected or expected "O" atau "VV" turunkan  similarity ke 75% namun result tetap bisa "ok" jika karakter sesuai.
3. Bandingkan hasil OCR dengan serial number yang benar (SEMUA HARUS PERSIS (namun abaikan kapital), "jika ada perbedaan 1 karakter pun maka result = FOTO SERIAL NUMBER tidak sesuai").
4. Hanya beri FAILED jika:
   - Foto tidak terlihat (buram/tidak fokus), JANGAN COBA MENEBAK, jika gambar tidak terbaca jelas sedikitpun, anggap tidak terlihat dan beri result "FOTO SERIAL NUMBER tidak terlihat".
   - foto bukan SN sama sekali (foto random), atau
   - serial number terlihat tapi ada perbedaan (walau hanya 1 karakter pun).
5. "message" = kesimpulan singkat (beri reminder jika menemukan "O" atau "VV").
6. result harus berisi "ok" tanpa kapital jika gambar sesuai.

PENTING:
- Jangan menambahkan komentar apa pun.
- Jangan menggunakan markdown.
- Jangan mengubah struktur JSON.
- Output harus TEXT biasa.
`;}

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
  "similarity": 0-100,
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
- similarity dihitung dari kemiripan NAMA SEKOLAH dan NPSN.
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
JANGAN RESPOND DALAM BLOCK CODE (\\\`\\\`\\\`) DAN JANGAN GUNAKAN MARKDOWN.
Balas dalam TEXT BIASA dan ikuti FORMAT JSON berikut (STRUKTUR HARUS SAMA):

{
  "code": "OK / failed",
  "detected": {
    "school_name": "",
    "training_participant": "",
    "hisense_signature_name": "",
    "tanggal": "mm/dd/yyyy" 
  },
  "expected": {
    "school_name": ""
  },
  "suspected_differences": [],
  "result": "ok" ATAU array berisi:
  [
    "Sekolah tidak sesuai"
    "FOTO BAPP HAL 2 tidak jelas",
    "Stempel tidak ada",
    "ttd tidak ditemukan",
    "peserta pelatihan tidak ada"
  ],
  "message": ""
}

DATA YANG BENAR:
expected.school_name = ${expectedSchoolName || "-"}

PANDUAN LOKASI (BERDASARKAN FORMAT DOKUMEN BAPP HAL 2):

training_participant:
- Lokasinya di tabel bagian tengah dokumen.
- Kolom “Nama Perwakilan Satuan Pendidikan yang Mengikuti Pelatihan”.
- Jika tulisan berupa garis, dicoret, blur, samar, atau hanya sebagian huruf (MINIMAL ADA 3 HURUF, jika kurang maka anggap tidak ada) → training_participant = "".
- jika tidak ada nama peserta pelatihan → tambahkan "peserta pelatihan tidak ada". ke result.

school_name:
- Lokasinya di area bawah kiri.
- Tepat di atas nama & NIP Kepala Sekolah (Pihak Pertama).
- Jika tidak terbaca karena coretan/blur → kosongkan field lalu tambahkan "FOTO BAPP HAL 2 tidak jelas" ke result.
- Jika berbeda jauh dari expected.school_name → tambahkan "Sekolah tidak sesuai" ke result.
- Jika hanya berbeda sedikit tetap berikan result "ok".
- Typo kecil & singkatan (Jl vs Jalan, PG vs pagi, SDI vs SD Inpres) dianggap sama.
- Variasi tambahan seperti "UPT", "UPTD" "Negeri", "Swasta", dll → tidak dianggap berbeda dan tetap berikan result "ok".

hisense_signature_name:
- Lokasi bawah kanan.
- Tepat di bawah tanda tangan pihak Hisense.
- Jika tulisan berupa garis, dicoret, blur, samar, atau hanya sebagian huruf (MINIMAL ADA 3 HURUF, jika kurang maka anggap tidak ada) → hisense_signature_name = "".
- Jika hanya terlihat huruf acak (“H”, “Z”, “S”) atau serpihan tanda tangan → hisense_signature_name = "".
- Jika tidak terbaca jelas → tambahkan "ttd tidak ditemukan" ke result.

stempel :
- Lokasi di bawah kanan (di tanda tangan sekolah).
- Jika nama sekolah stempel berbeda sedikit atau tidak terbaca maka toleransi saja (nama sekolah yang diperiksa hanya yang diatas ttd).
- Jika stempel tidak ada sama sekali → tambahkan "Stempel tidak ada" ke result.
- beri result "Stempel tidak ada" hanya jika stempel benar-benar tidak ada.

tanda tangan : 
- Lokasi di bawah kanan (di bawah Pihak kedua, Perwakilan PT Hisense Internasional...).
- Jika tanda tangan buram, samar, atau hanya terlihat coretan garis acak → kosongkan field hisense_signature_name dan tambahkan "ttd tidak ditemukan" ke result.
- Jika ada tanda tangan tapi tidak ada namanya → tambahkan "ttd tidak ditemukan" ke result.
- Jika ada nama tapi tidak ada tanda tangan → kosongkan field hisense_signature_name dan tambahkan "ttd tidak ditemukan" ke result.

tanggal:
- Lokasi bawah tengah pada teks “Ditetapkan di Kab…, tanggal XX [bulan] 2025”.
- Hanya isi tanggal jika HARI + BULAN + TAHUN terbaca lengkap.
- Jika bulan saja, atau bulan+tahun, atau format “11/xx/2025”, atau samar → HAPUS field tanggal sama sekali.

ATURAN ANTI-PREDIKSI:
- Jika teks buram, tertutup coretan, atau terlalu samar → wajib dianggap TIDAK TERBACA.
- DILARANG menebak teks.
- Jika ragu sedikit saja → kosongkan field.
- Jika training_participant tidak terbaca → tambahkan "peserta pelatihan tidak ada" ke result.
- Jika hisense_signature_name tidak terbaca → tambahkan "ttd tidak ditemukan" ke result.
- Jika stempel tidak ada sama sekali → tambahkan "Stempel tidak ada" ke result.
- Jika banyak elemen tidak terbaca → tambahkan "FOTO BAPP HAL 2 tidak jelas" ke result.

ATURAN VALIDASI:
- Jika school_name berbeda JAUH dari expected → tambahkan "Sekolah tidak sesuai" ke result.
- Jika semua data sesuai (atau nama sekolah berbeda sedikit) → result = "ok".

ATURAN RESPONSE:
- Message berisi kesimpulan singkat hasil evaluasi.
- Jangan membuat field baru.
- Jangan mengubah nama field.
- Jangan menebak teks.
- JSON harus valid.
- Respons HARUS berupa TEXT BIASA TANPA MARKDOWN.

`;
}
