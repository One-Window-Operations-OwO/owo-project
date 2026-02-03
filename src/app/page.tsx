"use client";
// boku cinnamon :3
import { useAppContext } from "@/context/AppProvider";
import DkmDetails from "@/components/DkmDetails";

export default function Home() {
  const { 
    dkmData, 
    isLoading, 
    error, 
    pendingCount, 
    verifierName, 
    handleLogout // Mengambil fungsi logout dari context
  } = useAppContext(); 

  const renderContent = () => {
    if (isLoading) return <p>Mencari data spreadsheet untuk <b>{verifierName}</b>...</p>;
    if (error) return <p className="text-red-500 font-bold bg-red-100 p-4 rounded-lg">Error: {error}</p>;
    
    if (pendingCount === 0 && !isLoading) {
      return (
        <div className="text-center bg-white rounded-lg shadow-md p-6">
          <p className="text-2xl text-green-600 font-bold">🎉</p>
          <p className="mt-2 font-semibold">Semua pekerjaan untuk <b>{verifierName}</b> sudah selesai!</p>
        </div>
      );
    }
    
    if (pendingCount !== null && pendingCount > 0 && !dkmData) {
        return <p className="animate-pulse">Memuat detail pekerjaan berikutnya...</p>
    }

    if (dkmData) {
        return <DkmDetails data={dkmData} />
    }
    
    return null;
  };

  return (
    <div className="flex flex-col w-full h-full p-4 bg-gray-50">
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-800">
          Detail Pekerjaan
        </h1>
        
        <div className="flex items-center gap-4 h-[72px]"> {/* Set tinggi container yang konsisten */}
          <div className="flex items-center gap-3 bg-white p-3 px-4 rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="text-right flex flex-col justify-center gap-1"> {/* Tambahkan gap untuk jarak vertikal */}
              <p className="font-bold text-lg text-gray-800 leading-none">
                {verifierName}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1"> {/* Tambahkan margin top untuk jarak tambahan */}
                Verifier Aktif
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors group h-10 w-10 flex items-center justify-center"
              title="Logout / Bersihkan Sesi"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          {pendingCount !== null && (
            <div className="bg-blue-600 rounded-lg p-3 text-white text-center shadow-lg min-w-[100px] h-full flex flex-col justify-center">
              <p className="text-3xl font-bold leading-none">
                {pendingCount}
              </p>
              <p className="text-xs font-semibold tracking-wider mt-1">
                DATA LAGI
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow p-6 bg-white rounded-lg shadow-md">
        {renderContent()}
      </main>
    </div>
  );
}
