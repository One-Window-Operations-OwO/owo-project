"use client";

import { useState, useEffect, useRef } from "react";
import type { DkmData } from "@/context/AppProvider";
import StickyInfoBox from "./StickyInfoBox";
import type { HisenseData, HisenseProcessHistory } from "@/context/AppProvider";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import StickyEvaluationBox from "./StickyEvaluationBox";

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

export default function DkmDetails({ data }: { data: DkmData }) {
  const [isProsesOpen, setIsProsesOpen] = useState(false);
  const [isDokumentasiOpen, setIsDokumentasiOpen] = useState(true);
  const [mismatches, setMismatches] = useState<Record<string, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null
  );
  // State baru untuk rotasi gambar
  const [imageRotation, setImageRotation] = useState(0);

  const prosesRef = useRef<HTMLDivElement>(null);

  // Ambil data dari datadik dan hisense
  const datadik = data.datadik || {};
  const ptkList = datadik.ptk || [];
  const hisense = data.hisense;
  const schoolInfo = (hisense as HisenseData).schoolInfo || {};
  const images = (hisense as HisenseData).images || {};
  const processHistory = (hisense as HisenseData).processHistory || [];
  const imageList = Object.values(images);

  // Fungsi bandingkan string
  const cleanAndCompare = (val1?: string, val2?: string) => {
    if (typeof val1 !== "string" || typeof val2 !== "string") return false;
    return val1.trim().toLowerCase() === val2.trim().toLowerCase();
  };
  useEffect(() => {
    processHistory.map((item: HisenseProcessHistory) => {
      if (/DATA DITOLAK/.test(item.status!)) {
        setIsProsesOpen(true);
      }
    });
    // scroll otomatis setelah dibuka
    setTimeout(() => {
      if (prosesRef.current) {
        prosesRef.current.scrollTop = prosesRef.current.scrollHeight;
      }
    }, 100); // kasih delay kecil supaya render selesai
  }, [processHistory]);
  // Cek mismatch antar hisense dan datadik
  useEffect(() => {
    if (!schoolInfo || !datadik) return;
    const newMismatches: Record<string, boolean> = {};
    newMismatches["Nama"] = !cleanAndCompare(schoolInfo.Nama, datadik.name);
    newMismatches["Alamat"] = !cleanAndCompare(
      schoolInfo.Alamat,
      datadik.address
    );
    newMismatches["Kecamatan"] = !cleanAndCompare(
      schoolInfo.Kecamatan,
      datadik.kecamatan
    );
    newMismatches["Kabupaten"] = !cleanAndCompare(
      schoolInfo.Kabupaten,
      datadik.kabupaten
    );
    newMismatches["PIC"] = !cleanAndCompare(
      schoolInfo.PIC,
      datadik.kepalaSekolah
    );
    setMismatches(newMismatches); // Update state mismatches
  }, [schoolInfo, datadik]);

  // Reset rotasi saat gambar berubah
  useEffect(() => {
    setImageRotation(0);
  }, [currentImageIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (currentImageIndex === null) return;

      // Abaikan input aktif
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.getAttribute("contenteditable") === "true")
      ) {
        if (event.key === "Escape") setCurrentImageIndex(null);
        return;
      }

      // Escape → tutup gambar
      if (event.key === "Escape") setCurrentImageIndex(null);

      // Next
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D")
        setCurrentImageIndex((prev) => (prev! + 1) % imageList.length);

      // Prev
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A")
        setCurrentImageIndex(
          (prev) => (prev! - 1 + imageList.length) % imageList.length
        );
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (currentImageIndex === null) return;

      // Tombol samping mouse
      if (event.button === 3 || event.button === 4) {
        // 🔒 Cegah browser navigasi back/forward
        event.preventDefault();
      }

      if (event.button === 4) {
        // Forward → next
        setCurrentImageIndex((prev) => (prev! + 1) % imageList.length);
      }
      if (event.button === 3) {
        // Back → previous
        setCurrentImageIndex(
          (prev) => (prev! - 1 + imageList.length) % imageList.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const handleMouseUp = (event: MouseEvent) => {
      if (currentImageIndex === null) return;
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [currentImageIndex, imageList.length]);

  const rotateImage = (direction: "left" | "right") => {
    if (direction === "right") {
      setImageRotation((prev) => (prev + 90) % 360);
    } else {
      setImageRotation((prev) => (prev - 90 + 360) % 360);
    }
  };

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
      {/* StickyInfoBox bisa diisi jika ingin menampilkan info PTK dsb */}
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
              {" "}
              <table className="table-auto w-full">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {processHistory.map(
                    (item: HisenseProcessHistory, index: number) => {
                      const isDitolak = /DITOLAK/i.test(item.status || ""); // cek case-insensitive
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
                    }
                  )}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <TransformWrapper initialScale={1} key={currentImageIndex}>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div
                  className="absolute top-4 right-4 z-[51] flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    title="Zoom In"
                    onClick={() => zoomIn()}
                    className="bg-white text-black w-10 h-10 rounded-full font-bold text-xl shadow-lg"
                  >
                    +
                  </button>
                  <button
                    title="Zoom Out"
                    onClick={() => zoomOut()}
                    className="bg-white text-black w-10 h-10 rounded-full font-bold text-xl shadow-lg"
                  >
                    -
                  </button>
                  <button
                    title="Reset Zoom"
                    onClick={() => {
                      resetTransform();
                      setImageRotation(0);
                    }}
                    className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg"
                  >
                    Reset
                  </button>

                  <button
                    title="Putar Kiri"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateImage("left");
                    }}
                    className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg"
                  >
                    &#x21BA;
                  </button>

                  <button
                    title="Putar Kanan"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateImage("right");
                    }}
                    className="bg-white text-black px-4 h-10 rounded-full font-semibold shadow-lg"
                  >
                    &#x21BB;
                  </button>
                </div>
                <div
                  className="w-full h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TransformComponent
                    wrapperStyle={{ maxWidth: "100%", maxHeight: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}
                  >
                    <img
                      src={imageList[currentImageIndex] as string}
                      alt="Tampilan Penuh"
                      className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
                      style={{ transform: `rotate(${imageRotation}deg)` }} // Apply rotation
                    />
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>
          <button
            title="Gambar Sebelumnya (Panah Kiri)"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(
                (prev) => (prev! - 1 + imageList.length) % imageList.length
              );
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:opacity-75 transition-opacity"
          >
            &#10094;
          </button>
          <button
            title="Gambar Berikutnya (Panah Kanan)"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev! + 1) % imageList.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl hover:opacity-75 transition-opacity"
          >
            &#10095;
          </button>
        </div>
      )}
    </>
  );
}
