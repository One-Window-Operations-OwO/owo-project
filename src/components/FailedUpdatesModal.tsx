import React from "react";

interface FailedUpdate {
  id: number;
  schoolName: string;
  error: string;
}

interface FailedUpdatesModalProps {
  failures: FailedUpdate[];
  onRetry: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const FailedUpdatesModal: React.FC<FailedUpdatesModalProps> = ({
  failures,
  onRetry,
  onClose,
  isOpen,
}) => {
  if (!isOpen || failures.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Gagal Sinkronisasi</h2>
        <p className="mb-4 text-sm text-gray-600">
          Beberapa data gagal dikirim ke server. Anda bisa mencoba lagi.
        </p>
        <div className="max-h-60 overflow-y-auto border rounded-md p-2 mb-4 space-y-2 bg-gray-50">
          {failures.map((fail) => (
            <div key={fail.id} className="text-sm p-2 border-b">
              <p className="font-semibold text-gray-700">{fail.schoolName}</p>
              <p className="text-red-600">{fail.error}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
          >
            Tutup
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Coba Lagi Semua
          </button>
        </div>
      </div>
    </div>
  );
};

export default FailedUpdatesModal;
