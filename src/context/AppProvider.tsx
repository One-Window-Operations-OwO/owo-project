"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useSession, signIn } from "next-auth/react";
import { validateHisenseCookie } from "@/helpers/HisenseCookie";

import LoginComponent from "@/components/LoginComponent";
import Sidebar from "@/components/Sidebar";

const defaultEvaluationValues: Record<string, string> = {
  J: "Sesuai",
  K: "Sesuai",
  L: "Sesuai",
  M: "Sesuai",
  N: "Sesuai",
  P: "Sesuai",
  Q: "Lengkap",
  S: "Konsisten",
  T: "Sesuai",
  U: "Lengkap",
  V: "Ada",
  W: "Ya",
};

export interface Ptk {
  ptk_terdaftar_id?: string;
  ptk_id?: string;
  nama?: string;
  jenis_kelamin?: 'L' | 'P';
  tanggal_lahir?: string;
  nik?: string;
  nuptk?: string | null;
  nip?: string | null;
  nrg?: string | null;
  kepegawaian?: string;
  jenis_ptk?: string;
  jabatan_ptk?: string;
  nomor_surat_tugas?: string;
  tanggal_surat_tugas?: string;
  tmt_tugas?: string;
  ptk_induk?: 'Ya' | 'Tidak';
  last_update?: string;
}

export interface DatadikData {
  id?: string;
  name?: string;
  address?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kepalaSekolah?: string;
  ptk?: Ptk[];
  error?: string; // untuk kasus error response
}

export interface HisenseSchoolInfo {
  NPSN?: string;
  Nama?: string;
  Alamat?: string;
  Provinsi?: string;
  Kabupaten?: string;
  Kecamatan?: string;
  "Kelurahan/Desa"?: string;
  Jenjang?: string;
  Bentuk?: string;
  Sekolah?: string;
  Formal?: string;
  PIC?: string;
  "Telp PIC"?: string;
  "Resi Pengiriman"?: string;
  "Serial Number"?: string;
  Status?: string;
  // tambahkan field lain jika ada
}

export interface HisenseProcessHistory {
  tanggal?: string;
  status?: string;
  keterangan?: string;
}

export interface HisenseData {
  isGreen: boolean;
  nextPath?: string | null;
  schoolInfo?: HisenseSchoolInfo;
  images?: Record<string, string>;
  processHistory?: HisenseProcessHistory[];
  q?: string;
  npsn?: string;
  iprop?: string;
  ikab?: string;
  ikec?: string;
  iins?: string;
  ijenjang?: string;
  ibp?: string;
  iss?: string;
  isf?: string;
  istt?: string;
  itgl?: string;
  itgla?: string;
  itgle?: string;
  ipet?: string;
  ihnd?: string;
}

export interface DkmData {
  datadik: DatadikData;
  hisense: HisenseData;
}

export interface SheetRow {
  rowIndex: number;
  rowData: (string | number)[];
  headerRow?: string[];
}

interface AppContextType {
  verifierName: string | null;
  pendingCount: number;
  dkmData: DkmData | null;
  isLoading: boolean;
  isFetchingDetails: boolean;
  error: string | null;
  isSubmitting: boolean;
  evaluationForm: Record<string, string>;
  setEvaluationForm: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  customReason: string;
  setCustomReason: React.Dispatch<React.SetStateAction<string>>;
  handleTerima: () => void;
  handleTolak: () => void;
  handleSkip: (isValidData: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [verifierName, setVerifierName] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cookieValid, setCookieValid] = useState(false);

  const [allPendingRows, setAllPendingRows] = useState<SheetRow[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [dkmData, setDkmData] = useState<DkmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState<Record<string, string>>(
    defaultEvaluationValues
  );
  const [customReason, setCustomReason] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleSkip = useCallback(
    async (isValidData: boolean) => {
      if (allPendingRows.length === 0) return;
      if (allPendingRows.length === 1) {
        const currentRow = allPendingRows[0];
        try {
          await fetch("/api/sheets/batch-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: isValidData ? "formatSkip" : "formatSkipHitam",
              sheetId: process.env.NEXT_PUBLIC_SHEET_ID,
              rowIndex: currentRow.rowIndex,
            }),
          });
        } catch (error) {
          console.error("Gagal format baris skip terakhir:", error);
        }
        setAllPendingRows([]);
        return;
      }

      const currentRow = allPendingRows[currentRowIndex];

      try {
        await fetch("/api/sheets/batch-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: isValidData ? "formatSkip" : "formatSkipHitam",
            sheetId: process.env.NEXT_PUBLIC_SHEET_ID,
            rowIndex: currentRow.rowIndex,
          }),
        });
      } catch (error) {
        console.error("Gagal format baris skip:", error);
      } finally {
        const newRows = allPendingRows.filter(
          (_, index) => index !== currentRowIndex
        );
        setAllPendingRows([...newRows, currentRow]); // Pindahkan ke akhir
        if (currentRowIndex >= newRows.length && newRows.length > 0) {
          setCurrentRowIndex(0);
        }
      }
    },
    [allPendingRows, currentRowIndex]
  );

  // Fungsi fetchDetailsForRow yang sudah di-upgrade
  const fetchDetailsForRow = useCallback(
    async (row: SheetRow) => {
      if (!row) return;
      setIsFetchingDetails(true);
      setDkmData(null);
      setError(null);
      try {
        const headerRow = row.headerRow;
        if (!headerRow) throw new Error("Header row tidak ditemukan.");
        const npsnCol = headerRow.indexOf("NPSN");
        const npsn = row.rowData[npsnCol];
        if (!npsn) throw new Error("NPSN tidak ditemukan di baris ini.");

        const cookie = localStorage.getItem("hisense_cookie");
        if (!cookie) throw new Error("Cookie Hisense tidak ditemukan.");

        const validName = await validateHisenseCookie(cookie);
        if (!validName) {
          setCookieValid(false);
          setVerifierName(null);
          setShowLoginModal(true);
          setIsSubmitting(false);
          setError("Cookie Hisense kadaluarsa atau tidak valid.");
          return;
        }

        const response = await fetch("/api/combined", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: npsn, cookie }),
        });

        if (!response.ok) {
          throw new Error(`Gagal mengambil data dari API eksternal. Status: ${response.status}`);
        }

        const data: DkmData = await response.json();

        // === LOGIKA AUTO-SKIP DIMASUKKAN DI SINI ===
        if (!data.hisense.isGreen) {
          console.log(`Auto-skipping NPSN: ${npsn} karena warna bukan hijau.`);
          handleSkip(false);
          setIsFetchingDetails(false);
          return;
        }

        setDkmData(data);
        setEvaluationForm(defaultEvaluationValues);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred in fetchDetailsForRow.");
      } finally {
        setIsFetchingDetails(false);
      }
    },
    [handleSkip]
  );

  useEffect(() => {
    const isReadyToFetch =
      cookieValid && sessionStatus === "authenticated" && verifierName;
    if (!isReadyToFetch) {
      setIsLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      setAllPendingRows([]);
      try {
        const res = await fetch("/api/sheets");
        if (!res.ok)
          throw new Error("Gagal mengambil data dari Google Sheets.");
        const data = await res.json();
        const allData: SheetRow[] = data.values;
        if (!allData || allData.length < 3) {
          setAllPendingRows([]);
          return;
        }

        const headerRow = allData[2].rowData as string[];
        const verifikatorCol = headerRow.indexOf("VERIFIKATOR");
        const statusCol = headerRow.indexOf("STATUS (DITERIMA/DITOLAK)");

        if (verifikatorCol === -1 || statusCol === -1) {
          throw new Error(
            "Kolom VERIFIKATOR atau STATUS tidak ditemukan di Sheet."
          );
        }

        const filtered = allData
          .slice(3)
          .filter(
            (item: SheetRow) =>
              item.rowData[verifikatorCol] === verifierName &&
              (!item.rowData[statusCol] ||
                String(item.rowData[statusCol]).trim() === "")
          );

        const rowsWithHeader = filtered.map((row: SheetRow) => ({
          ...row,
          headerRow,
        }));
        setAllPendingRows(rowsWithHeader);
        setCurrentRowIndex(0);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred in fetchInitialData.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [cookieValid, sessionStatus, verifierName]);

  useEffect(() => {
    if (allPendingRows.length > 0 && currentRowIndex < allPendingRows.length) {
      const currentRow = allPendingRows[currentRowIndex];
      fetchDetailsForRow(currentRow);
    } else if (allPendingRows.length === 0 && !isLoading) {
      setDkmData(null);
    }
  }, [currentRowIndex, allPendingRows, fetchDetailsForRow, isLoading]);

  const generateRejectionMessage = useCallback(() => {
    const rejectionReasons: { [key: string]: string } = {
      J: "(5A) Geo Tagging tidak sesuai",
      K: "(4A) Foto plang sekolah tidak sesuai",
      L: "(4C) Foto Box dan PIC tidak sesuai",
      M: "(2A) Foto kelengkapan IFP tidak lengkap (Kabel HDMI; USB type A to B, stylus, remote)",
      N: "(3B) Serial number yang diinput tidak sesuai dengan yang tertera pada IFP",
      P: "(1L) Data BAPP sekolah tidak sesuai (cek Barcode atas dan NPSN dengan foto sekolah atau NPSN yang diinput)",
      Q: "(1D) Ceklis BAPP tidak lengkap pada halaman 1",
      S: "(1K) Data penanda tangan pada halaman 1 dan halaman 2 BAPP tidak konsisten",
      T: "(1O) Stempel pada BAPP halaman 2 tidak sesuai dengan sekolahnya",
      U: "(1Q) Ceklis pada BAPP halaman 2 tidak lengkap",
      V: "(1S) Satuan Pendidikan yang Mengikuti Pelatihan, tidak ada dalam BAPP hal.2",
      W: "(1A) Simpulan BAPP pada hal 2 belum dipilih atau dicoret",
    };

    const specificReasons: { [key: string]: { [key: string]: string } } = {
      N: {
        "Tidak Terlihat":
          "(3A) Foto serial number pada belakang unit IFP tidak jelas",
        "Tidak Ada": "(3C) Foto Serial Number pada belakang unit IFP tidak ada",
        "Diedit": "(1AB) Foto serial number tidak boleh diedit digital",
      },
      Q: {
        "Tidak Sesuai": "(1D) Ceklis BAPP tidak sesuai pada halaman 1",
        "BAPP Tidak Jelas": "(1M) BAPP Halaman 1 tidak terlihat jelas",
        "Surat Tugas Tidak Ada": "(1V) Nomor surat tugas pada halaman 1 tidak ada",
        "Diedit": "(1Y) BAPP Hal 1 tidak boleh diedit digital",
        "Tanggal Tidak Ada": "(1F) Tanggal BAPP tidak diisi",
      },
      S: {
        "Tidak Terdaftar di Datadik":
          "(1C) Pihak sekolah yang menandatangani BAPP tidak terdaftar dalam data Dapodik",
        "PIC Tidak Sama":
          "(1U) PIC dari pihak sekolah berbeda dengan yang di BAPP",
        "TTD Tidak Ada":
          "(1X) Tidak ada tanda tangan dari pihak sekolah",
        "NIP Tidak Ada":
          "(1AA) NIP penandatangan pihak sekolah tidak ada",
      },
      T: {
        "Tidak Ada": "(1B) Tidak ada stempel sekolah pada BAPP",
        "Tidak Sesuai Tempatnya": "(1W) Stempel tidak mengenai tanda tangan pihak sekolah",
      },
      U: {
        "Tidak Sesuai": "(1Q) Ceklis BAPP tidak sesuai pada halaman 2",
        "BAPP Tidak Jelas": "(1T) BAPP Halaman 2 tidak terlihat jelas",
        "Diedit": "(1Z) BAPP Hal 2 tidak boleh diedit digital",
        "Tanggal Tidak Ada": "(1F) Tanggal BAPP tidak diisi",
      },
      V: {
        "Media Pelatihan": "(1AC) Harap ceklis di luar jaringan pada media pelatihan (jangan double ceklis/tidak ceklis)",
      },
    };

    const reasons = Object.entries(evaluationForm)
      .filter(([key, value]) => {
        const isDefault = defaultEvaluationValues[key] === value;
        const isSpecificReject = Object.keys(
          specificReasons[key] || {}
        ).includes(value);
        return !isDefault || isSpecificReject;
      })
      .map(([key, value]) => {
        if (specificReasons[key] && specificReasons[key][value]) {
          return specificReasons[key][value];
        } else if (
          rejectionReasons[key] &&
          value !== defaultEvaluationValues[key]
        ) {
          return rejectionReasons[key];
        }
        return null;
      })
      .filter(Boolean)
      .join(", ");

    return reasons;
  }, [evaluationForm]);

  // Setiap kali evaluationForm berubah, update customReason
  useEffect(() => {
    setCustomReason(generateRejectionMessage());
  }, [generateRejectionMessage]);

  const updateSheetAndProceed = useCallback(
    async (action: "terima" | "tolak") => {
      setIsSubmitting(true);
      setError(null);
      try {
        if (allPendingRows.length === 0 || !dkmData)
          throw new Error("Tidak ada data untuk diupdate.");

        const cookie = localStorage.getItem("hisense_cookie");
        if (!cookie) throw new Error("Cookie Hisense tidak ditemukan.");

        const validName = await validateHisenseCookie(cookie);
        if (!validName) {
          setCookieValid(false);
          setVerifierName(null);
          setShowLoginModal(true);
          setIsSubmitting(false);
          setError("Cookie Hisense kadaluarsa atau tidak valid.");
          return;
        }

        let hisensePath = "r_dkm_apr_p.php?";
        const params: Record<string, string> = {
          q: dkmData.hisense.q || "",
          s: "",
          v: "",
          npsn: dkmData.hisense.npsn || "",
          iprop: dkmData.hisense.iprop || "",
          ikab: dkmData.hisense.ikab || "",
          ikec: dkmData.hisense.ikec || "",
          iins: dkmData.hisense.iins || "",
          ijenjang: dkmData.hisense.ijenjang || "",
          ibp: dkmData.hisense.ibp || "",
          iss: dkmData.hisense.iss || "",
          isf: dkmData.hisense.isf || "",
          istt: dkmData.hisense.istt || "",
          itgl: dkmData.hisense.itgl || "",
          itgla: dkmData.hisense.itgla || "",
          itgle: dkmData.hisense.itgle || "",
          ipet: dkmData.hisense.ipet || "",
          ihnd: dkmData.hisense.ihnd || "",
        };

        if (action === "terima") {
          params.s = "A";
        } else if (action === "tolak") {
          params.s = "R";
          params.v = customReason;
        }

        const hisenseQueryString = new URLSearchParams(params).toString();
        hisensePath += hisenseQueryString;

        // Panggil API Hisense
        const hisenseRes = await fetch("/api/hisense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: hisensePath, cookie }),
        });

        if (!hisenseRes.ok) {
          throw new Error(`Gagal update Hisense: ${await hisenseRes.text()}`);
        }

        // Update Google Sheets
        const currentRow = allPendingRows[currentRowIndex];
        const res = await fetch("/api/sheets/batch-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            sheetId: process.env.NEXT_PUBLIC_SHEET_ID,
            rowIndex: currentRow.rowIndex,
            updates: { ...evaluationForm },
            customReason:
              customReason && customReason != generateRejectionMessage()
                ? customReason
                : null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.details || "Gagal batch update sheet.");
        }

        const newRows = allPendingRows.filter(
          (_, index) => index !== currentRowIndex
        );
        setAllPendingRows(newRows);

        if (currentRowIndex >= newRows.length && newRows.length > 0) {
          setCurrentRowIndex(0);
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("An unknown error occurred in updateSheetAndProceed.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [allPendingRows, currentRowIndex, dkmData, evaluationForm, customReason]
  );

  const handleTerima = useCallback(
    () => updateSheetAndProceed("terima"),
    [updateSheetAndProceed]
  );
  const handleTolak = useCallback(
    () => updateSheetAndProceed("tolak"),
    [updateSheetAndProceed]
  );

  const authenticate = useCallback(async () => {
    const savedCookie = localStorage.getItem("hisense_cookie");

    if (savedCookie) {
      const validName = await validateHisenseCookie(savedCookie);
      if (validName) {
        setCookieValid(true);
        setVerifierName(validName);
        setShowLoginModal(false);
        return;
      }
    }

    // If validation fails (which includes re-login attempt), show login modal.
    setShowLoginModal(true);
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  const handleLoginSuccess = () => {
    authenticate();
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-800">
        <p>Loading session...</p>
      </div>
    );
  }
  if (showLoginModal) {
    return <LoginComponent onLoginSuccess={handleLoginSuccess} />;
  }
  if (!session) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 bg-gray-100 text-gray-800">
        <p className="text-lg font-semibold">
          Selamat Datang di Aplikasi Verifier
        </p>
        <p>Silakan login dengan Google untuk melanjutkan.</p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Login Google
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        verifierName,
        pendingCount: allPendingRows.length,
        dkmData,
        isLoading,
        isFetchingDetails,
        error,
        isSubmitting,
        evaluationForm,
        setEvaluationForm,
        handleTerima,
        handleTolak,
        handleSkip,
        isSidebarOpen,
        toggleSidebar,
        customReason,
        setCustomReason,
      }}
    >
      <div className="flex h-screen bg-gray-200">
        <Sidebar />
        <main className="relative flex-grow p-6 overflow-y-auto bg-gray-100 text-gray-900">
          {children}
        </main>
      </div>
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 bg-black/50 z-20"
        />
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
}
