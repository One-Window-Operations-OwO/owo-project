"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import StickyInfoBox from "./StickyInfoBox";
import StickyEvaluationBox from "./StickyEvaluationBox";
import {
  useAppContext,
  type DkmData,
  type HisenseData,
} from "@/context/AppProvider";

interface AIPlangResult {
  code: string;
  similarity: number;
  detected: Record<string, string | undefined>;
  suspected_differences?: Array<{
    field: string;
    expected: string;
    detected: string;
  }>;
  result: string;
  message: string;
  autoEvaluation?: Record<string, string>;
  correctedValues?: {
    serial_number?: string;
  };
}

interface AISNResult {
  code: string;
  similarity?: number;
  detected: Record<string, string | undefined>;
  expected?: Record<string, string | undefined>;
  suspected_differences?: Array<{
    field: string;
    expected: string;
    detected: string;
  }>;
  result: string;
  message: string;
  autoEvaluation?: Record<string, string>;
  correctedValues?: {
    serial_number?: string;
  };
}
export interface AIBapp1Result {
  code: string;
  detected: {
    school_name?: string;
    npsn?: string;
    tanggal_pengisian?: string;
  };
  expected: {
    school_name: string;
    npsn: string;
  };
  suspected_differences?: {
    field: string;
    expected: string;
    detected: string;
  }[];
  result: string;
  message: string;
  autoEvaluation?: {
    Q?: string; // BAPP HAL 1
  };
}
export interface AIBapp2Result {
  code: string;
  detected: {
    school_name?: string;
    tanggal?: string;
  };
  expected: {
    school_name: string;
  };
  suspected_differences?: {
    field: string;
    expected: string;
    detected: string;
  }[];
  result: string;
  message: string;
  autoEvaluation?: {
    U?: string; // BAPP HAL 2
  };
}

const InfoField = ({
  label,
  value,
  colSpan,
  isMismatched,
}: {
  label: string;
  value: string;
  colSpan: string;
  isMismatched: boolean;
}) => (
  <div className={colSpan}>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      className={`w-full p-2 border rounded-md text-sm focus:outline-none text-gray-800 transition-colors ${
        isMismatched
          ? "bg-red-100 border-red-400"
          : "bg-gray-100 border-gray-300"
      }`}
      value={value || ""}
      readOnly
    />
  </div>
);

function AIResultBox({
  result,
  title,
}: {
  result: AIPlangResult | AISNResult | AIBapp1Result | AIBapp2Result;
  title: string;
}) {
  if (!result) return null;

  const getSimColor = (sim: number) => {
    if (sim >= 70) return "bg-green-100 text-green-700 border-green-300";
    if (sim >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const detectedEntries = Object.entries(result.detected || {});

  return (
    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md text-gray-900 p-5 rounded-xl shadow-xl border border-gray-200 z-[60] w-80 animate-fadeIn">
      <h2 className="text-lg font-bold mb-3 text-gray-800">🔍 {title}</h2>

      {"similarity" in result && result.similarity !== undefined && (
        <div
          className={`px-3 py-1 rounded-md text-sm font-semibold inline-block mb-3 border ${getSimColor(
            result.similarity
          )}`}
        >
          Similarity: {result.similarity}%
        </div>
      )}

      <div className="text-sm space-y-1 mb-3">
        {detectedEntries.map(([key, val]) => (
          <p key={key}>
            <span className="font-semibold capitalize">
              {key.replace(/_/g, " ")}:
            </span>{" "}
            {String(val ?? "-")}
          </p>
        ))}
      </div>

      {result.suspected_differences &&
        result.suspected_differences.length > 0 && (
          <div className="mt-3">
            <p className="font-semibold mb-1">Perbedaan Terdeteksi:</p>
            <div className="border border-red-200 rounded-md bg-red-50 p-2 text-[13px] max-h-32 overflow-y-auto">
              {result.suspected_differences.map((d, i) => (
                <div key={i} className="mb-2">
                  <span className="font-semibold text-red-700 capitalize">
                    {d.field}
                  </span>
                  <div className="pl-2 text-red-600">
                    <div>
                      <b>Expected:</b> &quot;{d.expected}&quot;
                    </div>
                    <div>
                      <b>Detected:</b> &quot;{d.detected}&quot;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="mt-4 p-3 rounded-md bg-gray-100 border border-gray-300 text-sm leading-relaxed">
        <span className="font-semibold">Kesimpulan:</span> {result.message}
      </div>
    </div>
  );
}

export default function DkmDetails({ data }: { data: DkmData }) {
  const [aiResultBapp1, setAiResultBapp1] = useState<AIBapp1Result | null>(
    null
  );
  const [aiResultBapp2, setAiResultBapp2] = useState<AIBapp2Result | null>(
    null
  );

  const { setEvaluationForm, setCorrectSerialNumber } = useAppContext();
  const { installationDate, setInstallationDate } = useAppContext();
  const aiHasRun = useRef(false);

  const [isProsesOpen, setIsProsesOpen] = useState(false);
  const [isDokumentasiOpen, setIsDokumentasiOpen] = useState(true);

  const [mismatches, setMismatches] = useState<Record<string, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null
  );

  const [imageRotation, setImageRotation] = useState(0);
  const [aiResultPlang, setAiResultPlang] = useState<AIPlangResult | null>(
    null
  );
  const [aiResultSN, setAiResultSN] = useState<AISNResult | null>(null);

  const prosesRef = useRef<HTMLDivElement>(null);

  const datadik = useMemo(() => data.datadik || {}, [data.datadik]);
  const ptkList = useMemo(() => datadik.ptk || [], [datadik.ptk]);
  const hisense = useMemo(() => data.hisense || {}, [data.hisense]);
  const schoolInfo = useMemo(
    () => (hisense as HisenseData).schoolInfo || {},
    [hisense]
  );

  const images = (hisense as HisenseData).images || {};
  const processHistory = useMemo(
    () => (hisense as HisenseData).processHistory || [],
    [hisense]
  );
  const note = useMemo(() => (hisense as HisenseData).note || {}, [hisense]);
  const imageList = useMemo(() => Object.values(images), [images]);

  const cleanAndCompare = (a?: string, b?: string) =>
    typeof a === "string" &&
    typeof b === "string" &&
    a.trim().toLowerCase() === b.trim().toLowerCase();

  useEffect(() => {
    setAiResultPlang(null);
    setAiResultSN(null);
    setAiResultBapp1(null);
    setAiResultBapp2(null);
    aiHasRun.current = false;
  }, [data]);

  useEffect(() => {
    for (const item of processHistory) {
      if (/DATA DITOLAK/.test(item.status || "")) {
        setIsProsesOpen(true);
        break;
      }
    }

    setTimeout(() => {
      if (prosesRef.current) {
        prosesRef.current.scrollTop = prosesRef.current.scrollHeight;
      }
    }, 100);
  }, [processHistory]);

  useEffect(() => {
    if (currentImageIndex === null) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (currentImageIndex === null) return;

      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
      }

      if (e.button === 3) {
        setCurrentImageIndex(
          (prev) => (prev! - 1 + imageList.length) % imageList.length
        );
      }

      if (e.button === 4) {
        setCurrentImageIndex((prev) => (prev! + 1) % imageList.length);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [currentImageIndex, imageList.length]);

  useEffect(() => {
    if (!schoolInfo || !datadik) return;

    const m: Record<string, boolean> = {
      Nama: !cleanAndCompare(schoolInfo.Nama, datadik.name),
      Alamat: !cleanAndCompare(schoolInfo.Alamat, datadik.address),
      Kecamatan: !cleanAndCompare(schoolInfo.Kecamatan, datadik.kecamatan),
      Kabupaten: !cleanAndCompare(schoolInfo.Kabupaten, datadik.kabupaten),
      PIC: !cleanAndCompare(schoolInfo.PIC, datadik.kepalaSekolah),
    };

    setMismatches(m);
  }, [schoolInfo, datadik]);

  useEffect(() => {
    setImageRotation(0);
  }, [currentImageIndex]);
  useEffect(() => {
    aiHasRun.current = false;
  }, [imageList]);

  useEffect(() => {
    if (aiHasRun.current) return;
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY === undefined) return;
    if (!imageList || imageList.length === 0) return;

    aiHasRun.current = true;

    const runAllAI = async () => {
      const tasks: Promise<void>[] = [];

      if (imageList[0]) {
        tasks.push(
          fetch("/api/ai-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageIndex: 0,
              imageUrl: imageList[0],
              expectedSchoolName: schoolInfo.Nama,
              expectedNPSN: schoolInfo.NPSN,
              expectedAddress: schoolInfo.Alamat,
            }),
          })
            .then((r) => r.json())
            .then((d) => setAiResultPlang(d))
            .catch(() => {})
        );
      }

      if (imageList[4]) {
        tasks.push(
          fetch("/api/ai-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageIndex: 4,
              imageUrl: imageList[4],
              expectedSerialNumber: schoolInfo["Serial Number"],
            }),
          })
            .then((r) => r.json())
            .then((d) => setAiResultSN(d))
            .catch(() => {})
        );
      }
      // BAPP HAL 1 (index 6)
      if (imageList[6]) {
        tasks.push(
          fetch("/api/ai-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageIndex: 6,
              imageUrl: imageList[6],
              expectedSchoolName: schoolInfo.Nama,
              expectedNPSN: schoolInfo.NPSN,
            }),
          })
            .then((r) => r.json())
            .then((d) => setAiResultBapp1(d))
            .catch(() => {})
        );
      }

      // BAPP HAL 2 (index 7)
      if (imageList[7]) {
        tasks.push(
          fetch("/api/ai-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageIndex: 7,
              expectedSchoolName: schoolInfo.Nama,
              imageUrl: imageList[7],
            }),
          })
            .then((r) => r.json())
            .then((d) => setAiResultBapp2(d))
            .catch(() => {})
        );
      }

      await Promise.all(tasks);
    };

    runAllAI();
  }, [imageList]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (currentImageIndex === null) return;

      const active = document.activeElement;
      if (e.key === "F") {
        e.preventDefault();
        setCurrentImageIndex(null);
      }
      if (active && ["INPUT", "TEXTAREA"].includes(active.tagName)) {
        if (e.key === "Escape" || e.key === "Space") setCurrentImageIndex(null);
        return;
      }
      if (e.key === "Escape" || e.key === "Space") setCurrentImageIndex(null);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d")
        setCurrentImageIndex((p) => (p! + 1) % imageList.length);
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a")
        setCurrentImageIndex(
          (p) => (p! - 1 + imageList.length) % imageList.length
        );
      if (e.key.toLowerCase() === "q")
        setImageRotation((p) => (p - 90 + 360) % 360);
      if (e.key.toLowerCase() === "e") setImageRotation((p) => (p + 90) % 360);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentImageIndex, imageList.length]);

  useEffect(() => {
    setAiResultPlang(null);
    setAiResultSN(null);
    setAiResultBapp1(null);
    setAiResultBapp2(null);
    aiHasRun.current = false;
  }, [data]);
  useEffect(() => {
    const rawSN = schoolInfo["Serial Number"];

    // Pastikan data SN ada sebelum mengecek
    if (rawSN) {
      // Hapus semua whitespace (spasi, tab, enter)
      const cleanSN = String(rawSN).replace(/\s/g, "");

      // Jika panjang tidak 23 karakter
      if (cleanSN.length !== 23) {
        setEvaluationForm((prev) => ({
          ...prev,
          N: "Tidak Sesuai",
        }));
      }
    }
  }, [schoolInfo, setEvaluationForm]);
  useEffect(() => {
    if (aiResultBapp1?.autoEvaluation) {
      setEvaluationForm((prev) => ({
        ...prev,
        ...aiResultBapp1.autoEvaluation,
      }));
    }
  }, [aiResultBapp1]);

  useEffect(() => {
    const raw = aiResultBapp2?.detected?.tanggal;
    if (!raw) return;

    const [mm, dd, yyyy] = raw.split("/");
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;

    setInstallationDate(iso);
  }, [aiResultBapp2]);

  useEffect(() => {
    if (aiResultBapp2?.autoEvaluation) {
      setEvaluationForm((prev) => ({
        ...prev,
        ...aiResultBapp2.autoEvaluation,
      }));
    }
  }, [aiResultBapp2]);

  useEffect(() => {
    if (!aiResultPlang) return;

    if (aiResultPlang.autoEvaluation) {
      setEvaluationForm((prev) => ({
        ...prev,
        ...aiResultPlang.autoEvaluation,
      }));
    }

    if (aiResultPlang.correctedValues?.serial_number) {
      setCorrectSerialNumber(aiResultPlang.correctedValues.serial_number);
    }
  }, [aiResultPlang, setEvaluationForm, setCorrectSerialNumber]);

  useEffect(() => {
    if (!aiResultSN) return;

    if (aiResultSN.autoEvaluation) {
      setEvaluationForm((prev) => ({
        ...prev,
        ...aiResultSN.autoEvaluation,
      }));
    }

    if (aiResultSN.correctedValues?.serial_number) {
      setCorrectSerialNumber(aiResultSN.correctedValues.serial_number);
    }
  }, [aiResultSN, setEvaluationForm, setCorrectSerialNumber]);

  const rotateImage = (dir: "left" | "right") =>
    setImageRotation((p) =>
      dir === "right" ? (p + 90) % 360 : (p - 90 + 360) % 360
    );

  return (
    <>
      {currentImageIndex !== null && (
        <>
          <StickyInfoBox
            formData={schoolInfo}
            apiData={{
              address: datadik.address || "",
              kecamatan: datadik.kecamatan || "",
              kabupaten: datadik.kabupaten || "",
              kepalaSekolah: datadik.kepalaSekolah || "",
              name: datadik.name || "",
            }}
            ptkList={ptkList}
          />

          <StickyEvaluationBox currentImageIndex={currentImageIndex} />
        </>
      )}

      <div className="w-full bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-4">
            <InfoField
              label="NPSN"
              value={schoolInfo.NPSN || ""}
              colSpan="col-span-12 md:col-span-2"
              isMismatched={false}
            />
            <InfoField
              label="Nama"
              value={schoolInfo.Nama || ""}
              colSpan="col-span-12 md:col-span-4"
              isMismatched={!!mismatches["Nama"]}
            />
            <InfoField
              label="Alamat"
              value={schoolInfo.Alamat || ""}
              colSpan="col-span-12 md:col-span-6"
              isMismatched={!!mismatches["Alamat"]}
            />
          </div>
          <div className="grid grid-cols-12 gap-4">
            <InfoField
              label="Provinsi"
              value={schoolInfo.Provinsi || ""}
              colSpan="col-span-6 md:col-span-2"
              isMismatched={false}
            />
            <InfoField
              label="Kabupaten"
              value={schoolInfo.Kabupaten || ""}
              colSpan="col-span-6 md:col-span-2"
              isMismatched={!!mismatches["Kabupaten"]}
            />
            <InfoField
              label="Kecamatan"
              value={schoolInfo.Kecamatan || ""}
              colSpan="col-span-6 md:col-span-2"
              isMismatched={!!mismatches["Kecamatan"]}
            />
            <InfoField
              label="Kelurahan/Desa"
              value={schoolInfo["Kelurahan/Desa"] || ""}
              colSpan="col-span-6 md:col-span-2"
              isMismatched={false}
            />
            <InfoField
              label="Jenjang"
              value={schoolInfo.Jenjang || ""}
              colSpan="col-span-4 md:col-span-1"
              isMismatched={false}
            />
            <InfoField
              label="Bentuk"
              value={schoolInfo.Bentuk || ""}
              colSpan="col-span-4 md:col-span-1"
              isMismatched={false}
            />
            <InfoField
              label="Sekolah"
              value={schoolInfo.Sekolah || ""}
              colSpan="col-span-4 md:col-span-1"
              isMismatched={false}
            />
            <InfoField
              label="Formal"
              value={schoolInfo.Formal || ""}
              colSpan="col-span-4 md:col-span-1"
              isMismatched={false}
            />
          </div>
          <div className="grid grid-cols-12 gap-4">
            <InfoField
              label="PIC"
              value={schoolInfo.PIC || ""}
              colSpan="col-span-6 md:col-span-2"
              isMismatched={!!mismatches["PIC"]}
            />
            <InfoField
              label="Telp"
              value={schoolInfo["Telp PIC"] || ""}
              colSpan="col-span-6 md:col-span-2"
              isMismatched={false}
            />
            <InfoField
              label="Resi Pengiriman"
              value={schoolInfo["Resi Pengiriman"] || ""}
              colSpan="col-span-12 md:col-span-2"
              isMismatched={false}
            />
            <InfoField
              label="Serial Number"
              value={schoolInfo["Serial Number"] || ""}
              colSpan="col-span-12 md:col-span-3"
              isMismatched={false}
            />
            <InfoField
              label="Status"
              value={schoolInfo.Status || ""}
              colSpan="col-span-12 md:col-span-3"
              isMismatched={false}
            />
          </div>
          {note["Catatan"]?.trim() !== "-" && note["Catatan"]?.trim() && (
            <InfoField
              label="CATATAN"
              value={note["Catatan"]}
              colSpan="col-span-4 md:col-span-1"
              isMismatched={true}
            />
          )}
        </div>

        <div>
          <button
            onClick={() => setIsProsesOpen(!isProsesOpen)}
            className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <span className="font-semibold text-blue-600">Rincian Proses</span>
            <span
              className={`transform transition-transform ${
                isProsesOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {isProsesOpen && (
            <div
              ref={prosesRef}
              className="p-3 mt-2 border rounded-md max-h-60 overflow-y-auto text-xs"
            >
              <table className="table-auto w-full">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {processHistory.map((item, index) => {
                    const isDitolak = /DITOLAK/i.test(item.status || "");
                    return (
                      <tr
                        key={index}
                        className={`border-t hover:bg-gray-50 ${
                          isDitolak
                            ? "bg-red-100 text-red-700 font-semibold"
                            : ""
                        }`}
                      >
                        <td className="p-2">{item.tanggal}</td>
                        <td className="p-2">{item.status}</td>
                        <td className="p-2">{item.keterangan}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setIsDokumentasiOpen(!isDokumentasiOpen)}
            className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <span className="font-semibold text-blue-600">
              Dokumentasi Instalasi
            </span>
            <span
              className={`transform transition-transform ${
                isDokumentasiOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {isDokumentasiOpen && (
            <div className="p-4 mt-2 border rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {Object.entries(images).map(([key, value], index) => (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-xs font-bold mb-2">{key}</span>
                  <div
                    onClick={() => setCurrentImageIndex(index)}
                    className="cursor-pointer"
                  >
                    <img
                      src={value as string}
                      alt={key}
                      className="border rounded-md h-32 w-full object-cover hover:opacity-80 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50 p-4"
          onClick={() => setCurrentImageIndex(null)}
        >
          {currentImageIndex === 0 && aiResultPlang && (
            <AIResultBox result={aiResultPlang} title="Analisis Plang" />
          )}

          {currentImageIndex === 4 && aiResultSN && (
            <AIResultBox result={aiResultSN} title="Analisis Serial Number" />
          )}
          {currentImageIndex === 6 && aiResultBapp1 && (
            <AIResultBox result={aiResultBapp1} title="Analisis BAPP Hal 1" />
          )}
          {currentImageIndex === 7 && aiResultBapp2 && (
            <AIResultBox result={aiResultBapp2} title="Analisis BAPP Hal 2" />
          )}

          <TransformWrapper initialScale={1} key={currentImageIndex}>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div
                  className="absolute top-4 right-4 z-[51] flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => zoomIn()}
                    className="bg-white text-black w-10 h-10 rounded-full font-bold text-xl shadow-lg"
                  >
                    +
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="bg-white text-black w-10 h-10 rounded-full font-bold text-xl shadow-lg"
                  >
                    -
                  </button>

                  <button
                    onClick={() => {
                      resetTransform();
                      setImageRotation(0);
                    }}
                    className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg"
                  >
                    Reset
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateImage("left");
                    }}
                    className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg"
                  >
                    ↺
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateImage("right");
                    }}
                    className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg"
                  >
                    ↻
                  </button>
                </div>

                <div
                  className="w-full h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TransformComponent>
                    <img
                      src={imageList[currentImageIndex] as string}
                      alt="Tampilan Penuh"
                      className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
                      style={{ transform: `rotate(${imageRotation}deg)` }}
                    />
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(
                (prev) => (prev! - 1 + imageList.length) % imageList.length
              );
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:opacity-75 transition-opacity"
          >
            ‹
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev! + 1) % imageList.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:opacity-75 transition-opacity"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
