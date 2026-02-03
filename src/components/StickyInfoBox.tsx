"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import type { DkmData, Ptk, DatadikData } from "@/context/AppProvider";
import { useDraggable } from "@/hooks/useDraggable";
import Fuse from "fuse.js";
import Spinner from "./Spinner";

interface StickyInfoBoxProps {
  formData: DkmData["hisense"]["schoolInfo"];
  apiData: DkmData["datadik"];
  ptkList: DkmData["datadik"]["ptk"];
  onRefetchDatadik?: () => void;
}

const cleanAndCompare = (val1?: string, val2?: string) => {
  if (typeof val1 !== "string" || typeof val2 !== "string") return false;
  return val1.trim().toLowerCase() === val2.trim().toLowerCase();
};

export default function StickyInfoBox({
  formData: initialFormData,
  apiData: initialApiData,
  ptkList: initialPtkList,
  onRefetchDatadik,
}: StickyInfoBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null!);
  const { position, handleMouseDown } = useDraggable<HTMLDivElement>(
    boxRef,
    "sticky-info-box",
  );

  const [apiData, setApiData] = useState(initialApiData);
  const [ptkList, setPtkList] = useState(initialPtkList);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setApiData(initialApiData);
    setPtkList(initialPtkList);
  }, [initialApiData, initialPtkList]);

  const handleRefresh = async () => {
    if (onRefetchDatadik) {
      setIsRefreshing(true);
      await onRefetchDatadik();
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Check if an input field or textarea is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA");

      if (event.key === "f" && !isInputFocused) {
        event.preventDefault(); // Prevent default browser behavior for 'f' key
        handleRefresh();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [handleRefresh]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Ptk[]>([]);

  const isAddressMatch =
    !!initialFormData &&
    cleanAndCompare(initialFormData.Alamat, apiData?.address) &&
    cleanAndCompare(initialFormData.Kecamatan, apiData?.kecamatan) &&
    cleanAndCompare(initialFormData.Kabupaten, apiData?.kabupaten);

  const statusColor = isAddressMatch ? "#e8f5e9" : "#ffdddd";
  const borderColor = isAddressMatch ? "#66bb6a" : "#e57373";

  // Fuse setup
  const fuse = useMemo(() => {
    const options = {
      keys: ["nama"],
      includeScore: true,
      threshold: 0.4,
    };
    return new Fuse(ptkList ?? [], options);
  }, [ptkList]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const result = fuse.search(query);
    setSearchResults(result.map((r) => r.item));
  };

  if (!apiData) {
    return null;
  }

  return (
    <div
      ref={boxRef}
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 1000,
        maxWidth: "320px",
        borderRadius: "8px",
        fontFamily: "sans-serif",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        backgroundColor: statusColor,
        border: `2px solid ${borderColor}`,
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 18px",
          cursor: "move",
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: "#f0f0f0",
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
        }}
      >
        <div>
          <div
            style={{ fontWeight: "bold", fontSize: "15px", color: "#0056b3" }}
          >
            {initialFormData?.Nama ?? ""}
          </div>
          <div style={{ fontSize: "12px", color: "#555" }}>
            NPSN: {initialFormData?.NPSN ?? ""}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh Datadik"
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            backgroundColor: isRefreshing ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isRefreshing ? (
            <Spinner size={14} />
          ) : (
            <img
              src="/refresh.svg"
              alt="Refresh"
              style={{ width: "14px", height: "14px" }}
            />
          )}
        </button>
      </div>

      <div style={{ padding: "12px 18px" }}>
        <div style={{ fontWeight: "bold", fontSize: "13px", color: "#555" }}>
          Serial Number
        </div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#000" }}>
          {initialFormData?.["Serial Number"]}
        </div>

        {/* ================= Alamat dari kedua sumber ================= */}
        <div
          style={{
            marginTop: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Alamat
          </div>
          <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
            <b>Form:</b> {initialFormData?.Alamat}, {initialFormData?.Kecamatan}
            , {initialFormData?.Kabupaten}
          </div>
          {/* <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
            <b>API:</b> {apiData?.address}, {apiData?.kecamatan},{" "}
            {apiData?.kabupaten}
          </div> */}
        </div>
        {/* ========================================================== */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#0056b3",
          }}
        >
          <b>Kepala Sekolah:</b> {apiData?.kepalaSekolah}

        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#0056b3",
          }}
        >
          <b>NIP:</b>{" "}
          {ptkList?.find((p) => p.nama === apiData?.kepalaSekolah)?.nip}
        </div>

        {/* ================= PTK Search Box ================= */}
        <div style={{ marginTop: "12px" }}>
          <input
            type="text"
            placeholder="Cari PTK..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: "13px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          />

          <div
            style={{
              marginTop: "6px",
              maxHeight: "140px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "#fff",
            }}
          >
            {searchQuery && searchResults.length === 0 && (
              <div
                style={{
                  padding: "8px",
                  fontSize: "12px",
                  textAlign: "center",
                  color: "#888",
                }}
              >
                PTK tidak ditemukan.
              </div>
            )}
            {searchResults.map((ptk, i) => (
              <div
                key={i}
                style={{ padding: "8px", borderBottom: "1px solid #f0f0f0" }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {ptk.nama}
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {ptk.jabatan_ptk || ptk.jenis_ptk}
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  NIP: {ptk.nip || "-"}
                </div>
              </div>
            ))}
            {!searchQuery && (
              <div
                style={{
                  padding: "8px",
                  fontSize: "12px",
                  textAlign: "center",
                  color: "#aaa",
                }}
              >
                Cari nama guru/staff di sini...
              </div>
            )}
          </div>
        </div>
        {/* ================================================== */}
      </div>
    </div>
  );
}
