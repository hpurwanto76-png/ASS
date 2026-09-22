import React, { useState, useRef } from 'react';
import { 
  Upload, FileSpreadsheet, Download, CheckCircle2, 
  AlertCircle, AlertTriangle, Trash2, ArrowRight, UserPlus, Database,
  Eye, EyeOff, RefreshCw, KeyRound, ShieldCheck
} from 'lucide-react';
import { Student } from '../types';
import { parseExcelFile, downloadExcelTemplate, exportStudentsToExcel } from '../utils/excelHelper';

interface ExcelImportSectionProps {
  onImportComplete: (newStudents: Student[], mode: 'sync' | 'append' | 'replace') => void;
  currentStudentCount: number;
  existingStudents?: Student[];
}

export const ExcelImportSection: React.FC<ExcelImportSectionProps> = ({
  onImportComplete,
  currentStudentCount,
  existingStudents = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'sync' | 'append' | 'replace'>('sync');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing NISN lookup map
  const existingNisnSet = new Set(existingStudents.map((s) => s.nisn.trim().toLowerCase()));

  // Calculate sync stats
  const existingMatchesCount = parsedStudents.filter((s) => 
    existingNisnSet.has(s.nisn.trim().toLowerCase())
  ).length;
  const newAccountsCount = parsedStudents.length - existingMatchesCount;

  const handleFiles = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setSaveSuccess(false);

    try {
      const result = await parseExcelFile(file);
      setParsedStudents(result.students);
      setParseErrors(result.errors);
    } catch (err: any) {
      setParseErrors([err.message || 'Gagal memproses file Excel']);
      setParsedStudents([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleCommitImport = () => {
    if (parsedStudents.length === 0) return;
    onImportComplete(parsedStudents, importMode);
    setSaveSuccess(true);
    setParsedStudents([]);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4500);
  };

  const handleClearPreview = () => {
    setParsedStudents([]);
    setParseErrors([]);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            Sinkronisasi &amp; Impor Data Siswa via Excel
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Unggah form Excel untuk menyinkronkan data profil, <strong>NISN (Username Login)</strong>, dan <strong>Password</strong> siswa secara otomatis ke sistem CBT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {existingStudents.length > 0 && (
            <button
              type="button"
              onClick={() => exportStudentsToExcel(existingStudents, 'Data_Siswa_CBT_Terkini.xlsx')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold text-xs sm:text-sm transition-colors shadow-2xs"
              title="Unduh data siswa saat ini beserta password dalam format Excel"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span>Ekspor Data Saat Ini</span>
            </button>
          )}

          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Unduh Format Template Excel</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-start gap-3 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p>Sinkronisasi data siswa dan password berhasil disimpan ke sistem CBT!</p>
            <p className="text-xs font-normal text-emerald-800 mt-0.5">
              Siswa sekarang dapat login menggunakan NISN dan Password yang telah disinkronkan dari file Excel.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-100/60 scale-[1.01]'
            : 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-bold text-gray-800">
              {fileName ? fileName : 'Tarik & Letakkan file Excel di sini atau Klik untuk Memilih File'}
            </p>
            <p className="text-xs text-gray-500">
              Mendukung format .xlsx, .xls, atau .csv (Maksimal 10 MB)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-xs text-emerald-800 font-medium">
            Format Kolom: NISN (Login), NAMA, KELAS, JURUSAN, PASSWORD, SESI, RUANG
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isProcessing && (
        <div className="p-4 text-center text-sm font-semibold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 animate-pulse">
          Sedang membaca dan menganalisis file Excel...
        </div>
      )}

      {/* Parse Errors if any */}
      {parseErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Catatan / Peringatan Pengolahan File:
          </div>
          <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto font-medium">
            {parseErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Section */}
      {parsedStudents.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h4 className="font-bold text-gray-900 text-base flex flex-wrap items-center gap-2">
                <span>Pratinjau Sinkronisasi Data Excel:</span>
                <span className="text-xs bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                  Total: {parsedStudents.length} Siswa
                </span>
                {existingMatchesCount > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full font-bold">
                    {existingMatchesCount} Update Login/Password
                  </span>
                )}
                {newAccountsCount > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full font-bold">
                    {newAccountsCount} Akun Baru
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Periksa kesesuaian NISN dan Password sebelum menyimpan ke dalam sistem CBT.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-gray-600 hover:text-emerald-800 flex items-center gap-1 font-medium bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                title={showPasswords ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Sembunyikan Password' : 'Lihat Password'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearPreview}
                className="text-xs text-gray-500 hover:text-rose-600 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Batalkan
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                Metode Sinkronisasi Data:
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-semibold">
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                importMode === 'sync'
                  ? 'bg-white border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                  : 'bg-white/60 border-emerald-200 text-gray-700 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  value="sync"
                  checked={importMode === 'sync'}
                  onChange={() => setImportMode('sync')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold block text-emerald-900">1. Sinkronkan Data &amp; Password</span>
                  <span className="text-[11px] text-gray-500 font-normal leading-tight block mt-0.5">
                    Perbarui password dan data siswa terdaftar berdasarkan NISN, serta tambahkan siswa baru.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                importMode === 'append'
                  ? 'bg-white border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                  : 'bg-white/60 border-emerald-200 text-gray-700 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold block text-gray-800">2. Hanya Tambah Siswa Baru</span>
                  <span className="text-[11px] text-gray-500 font-normal leading-tight block mt-0.5">
                    Hanya menambahkan siswa yang belum terdaftar. Siswa lama tidak diubah.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                importMode === 'replace'
                  ? 'bg-white border-rose-500 text-rose-950 shadow-xs ring-1 ring-rose-400'
                  : 'bg-white/60 border-rose-200 text-gray-700 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold block text-rose-800">3. Ganti Seluruh Data Siswa</span>
                  <span className="text-[11px] text-gray-500 font-normal leading-tight block mt-0.5">
                    Hapus seluruh data siswa sebelumnya dan ganti total dengan data dari file Excel ini.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-80 border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 sticky top-0 font-semibold text-gray-700">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Status Sinkron</th>
                  <th className="py-2.5 px-3">NISN (Username Login)</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Password Ujian</th>
                  <th className="py-2.5 px-3">Sesi / Ruang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {parsedStudents.slice(0, 60).map((s, index) => {
                  const isExisting = existingNisnSet.has(s.nisn.trim().toLowerCase());
                  return (
                    <tr key={s.id || index} className="hover:bg-emerald-50/50">
                      <td className="py-2 px-3 text-gray-500 font-mono">{index + 1}</td>
                      <td className="py-2 px-3">
                        {isExisting ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <RefreshCw className="w-2.5 h-2.5" />
                            Update Password
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UserPlus className="w-2.5 h-2.5" />
                            Akun Baru
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-gray-900">{s.nisn}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{s.name}</td>
                      <td className="py-2 px-3 text-gray-700">{s.classGroup}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-emerald-900 bg-emerald-50/60">
                        {showPasswords ? s.password : '••••••••'}
                      </td>
                      <td className="py-2 px-3 text-gray-600">{s.session || 'Sesi 1'} ({s.room || 'Lab'})</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {parsedStudents.length > 60 && (
            <p className="text-xs text-gray-500 text-center italic">
              Menampilkan 60 dari {parsedStudents.length} baris data pratinjau.
            </p>
          )}

          {/* Confirm Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
            <div className="text-xs text-gray-600 font-medium">
              Metode terpilih:{' '}
              <strong className="text-emerald-900">
                {importMode === 'sync'
                  ? 'Sinkronkan Data & Password'
                  : importMode === 'append'
                  ? 'Hanya Tambah Baru'
                  : 'Ganti Seluruh Data'}
              </strong>
            </div>

            <button
              id="btn-confirm-import-excel"
              type="button"
              onClick={handleCommitImport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <Database className="w-4 h-4" />
              <span>
                {importMode === 'sync'
                  ? `Sinkronkan ${parsedStudents.length} Siswa & Password`
                  : `Simpan ${parsedStudents.length} Siswa ke Database CBT`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
