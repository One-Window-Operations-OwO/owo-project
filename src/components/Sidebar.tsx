"use client";

import { useAppContext } from "@/context/AppProvider";

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

interface EvaluationField {
  col: string;
  label: string;
  options: string[];
}

export const evaluationFields: EvaluationField[] = [
  { col: "J", label: "GEO TAGGING", options: ["Sesuai", "Tidak Sesuai"] },
  { col: "K", label: "FOTO PAPAN NAMA", options: ["Sesuai", "Tidak Sesuai"] },
  { col: "L", label: "FOTO BOX & PIC", options: ["Sesuai", "Tidak Sesuai"] },
  {
    col: "M",
    label: "FOTO KELENGKAPAN UNIT",
    options: ["Sesuai", "Tidak Sesuai"],
  },
  {
    col: "N",
    label: "FOTO SERIAL NUMBER",
    options: ["Sesuai", "Tidak Sesuai", "Tidak Ada", "Tidak Terlihat", "Diedit"],
  },
  { col: "P", label: "BARCODE BAPP", options: ["Sesuai", "Tidak Sesuai"] },
  {
    col: "Q",
    label: "CEKLIS BAPP HAL 1",
    options: [
      "Lengkap",
      "Tidak Lengkap",
      "Tidak Sesuai",
      "BAPP Tidak Jelas",
      "Surat Tugas Tidak Ada",
      "Diedit", 
      "Tanggal Tidak Ada"
    ],
  },
  {
    col: "S",
    label: "NAMA PENANDATANGANAN BAPP",
    options: [
      "Konsisten",
      "Tidak Konsisten",
      "Tidak Terdaftar di Datadik",
      "PIC Tidak Sama",
      "TTD Tidak Ada",
      "NIP Tidak Ada"
    ],
  },
  {
    col: "T",
    label: "STEMPEL",
    options: ["Sesuai", "Tidak Sesuai", "Tidak Ada", "Tidak Sesuai Tempatnya"],
  },
  {
    col: "U",
    label: "CEKLIS BAPP HAL 2",
    options: [
      "Lengkap",
      "Tidak Lengkap",
      "Tidak Sesuai",
      "BAPP Tidak Jelas",
      "Diedit",
      "Tanggal Tidak Ada"
    ],
  },
  { col: "V", label: "PESERTA PELATIHAN", options: ["Ada", "Tidak Ada"] },
  { col: "W", label: "KESIMPULAN LENGKAP", options: ["Ya", "Tidak"] },
];

interface RadioOptionProps {
  field: EvaluationField;
  option: string;
  checked: boolean;
  onChange: (col: string, value: string) => void;
  disabled: boolean;
}

export const RadioOption = ({
  field,
  option,
  checked,
  onChange,
  disabled,
}: RadioOptionProps) => (
  <button
    type="button"
    onClick={() => onChange(field.col, option)}
    disabled={disabled}
    className={`px-3 py-1 text-xs rounded-full border transition-colors disabled:opacity-50
      ${
        checked
          ? "bg-blue-500 border-blue-500 text-white font-semibold"
          : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500"
      }`}
  >
    {option}
  </button>
);

export default function Sidebar() {
  const {
    pendingCount,
    handleTerima,
    handleTolak,
    handleSkip,
    isSubmitting,
    evaluationForm,
    setEvaluationForm,
    customReason,
    setCustomReason,
  } = useAppContext();

  const handleFormChange = (col: string, value: string) => {
    setEvaluationForm((prev) => ({ ...prev, [col]: value }));
  };

  const isFormDefault =
    Object.entries(defaultEvaluationValues).every(
      ([col, val]) => evaluationForm[col] === val
    ) && customReason.trim() === "";
  const buttonsDisabled =
    isSubmitting || pendingCount === null || pendingCount === 0;
  // Satu tombol dinamis: jika form default maka TERIMA, jika tidak maka TOLAK
  const mainButtonLabel = isFormDefault ? "TERIMA" : "TOLAK";
  const mainButtonColor = isFormDefault
    ? "bg-green-600 hover:bg-green-500"
    : "bg-red-600 hover:bg-red-500";
  const mainButtonAction = isFormDefault ? handleTerima : handleTolak;
  const mainButtonDisabled = buttonsDisabled;

  return (
    <aside className="w-96 bg-gray-800 text-white flex-shrink-0 flex flex-col p-4">
      <h1 className="text-xl font-bold border-b border-gray-700 pb-4 flex-shrink-0">
        FORM EVALUASI
      </h1>
      <div className="flex-grow mt-4 overflow-y-auto pr-2">
        <div className="flex flex-col gap-4">
          {evaluationFields.map((field) => (
            <div key={field.col} className="text-left text-sm">
              <label className="font-semibold text-gray-300 mb-2 block">
                {field.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => (
                  <RadioOption
                    key={opt}
                    field={field}
                    option={opt}
                    checked={evaluationForm[field.col] === opt}
                    onChange={handleFormChange}
                    disabled={buttonsDisabled}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="font-semibold text-gray-300 mb-2 block">
          Alasan Penolakan
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          disabled={buttonsDisabled}
          className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-sm text-white resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="border-t border-gray-700 pt-4 mt-4 flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => handleSkip(true)}
            disabled={buttonsDisabled}
            className="flex-1 p-3 bg-gray-500 rounded-md text-white font-bold hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            SKIP
          </button>
          <button
            onClick={mainButtonAction}
            disabled={mainButtonDisabled}
            className={`flex-1 p-3 rounded-md text-white font-bold disabled:opacity-50 transition-colors ${mainButtonColor}`}
          >
            {mainButtonLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}
