import React, { useState, useEffect } from 'react';
import { 
  X, HardDrive, FolderPlus, FileSpreadsheet, CheckCircle2, AlertCircle, 
  Loader2, ExternalLink, Filter, Users, BookOpen, ArrowRight, 
  ShieldCheck, Copy, Check, FileText, FileCode2
} from 'lucide-react';
import { AppSettings, Student, ExamSubject, StudentExamProgress } from '../types';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  isGoogleConnected, 
  auth 
} from '../services/googleAuth';
import { 
  exportStudentExamResultsToDriveFolder, 
  listDriveFolders, 
  DriveFile, 
  ExportExamResultsResult 
} from '../services/googleDrive';
import { GoogleSignInButton } from './GoogleSignInButton';

interface ExportExamResultsDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  students: Student[];
  exams: ExamSubject[];
  examProgress: StudentExamProgress[];
  defaultExamId?: string;
}

export const ExportExamResultsDriveModal: React.FC<ExportExamResultsDriveModalProps> = ({
  isOpen,
  onClose,
  settings,
  students,
  exams,
  examProgress,
  defaultExamId = 'all',
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Folder configuration
  const [folderMode, setFolderMode] = useState<'new' | 'existing'>('new');
  const [folderName, setFolderName] = useState('');
  const [existingFolders, setExistingFolders] = useState<DriveFile[]>([]);
  const [selectedExistingFolderId, setSelectedExistingFolderId] = useState('');
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState<string>(defaultExamId);
  const [selectedClassGroup, setSelectedClassGroup] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Export process state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportResult, setExportResult] = useState<ExportExamResultsResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract distinct class groups from students
  const classGroups = Array.from(new Set(students.map((s) => s.classGroup))).sort();

  // Listen to Google Auth status
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        setIsAuthLoading(false);
        setAuthError('');
        loadExistingFolders();
      },
      () => {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    );

    if (isGoogleConnected() && auth.currentUser) {
      setCurrentUser(auth.currentUser);
      setIsAuthLoading(false);
      loadExistingFolders();
    } else {
      setIsAuthLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Update default folder name when settings or filters change
  useEffect(() => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const examObj = exams.find((e) => e.id === selectedExamId);
    const examTag = examObj ? examObj.name : 'Semua Mapel';
    const classTag = selectedClassGroup !== 'all' ? ` - ${selectedClassGroup}` : '';

    setFolderName(`[HASIL UJIAN CBT] ${settings.schoolName} - ${examTag}${classTag} (${dateFormatted})`);
  }, [selectedExamId, selectedClassGroup, settings.schoolName]);

  const loadExistingFolders = async () => {
    try {
      setIsLoadingFolders(true);
      const folders = await listDriveFolders();
      setExistingFolders(folders);
      if (folders.length > 0 && !selectedExistingFolderId) {
        setSelectedExistingFolderId(folders[0].id);
      }
    } catch {
      // Non-blocking error
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError('');
      const res = await googleSignIn();
      setCurrentUser(res.user);
      loadExistingFolders();
    } catch (err: any) {
      setAuthError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setExportResult(null);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal keluar.');
    }
  };

  // Calculate live preview metrics based on current filter selections
  const inScopeStudents = (!selectedClassGroup || selectedClassGroup === 'all')
    ? students
    : students.filter((s) => s.classGroup === selectedClassGroup);

  const inScopeExams = (!selectedExamId || selectedExamId === 'all')
    ? exams
    : exams.filter((e) => e.id === selectedExamId);

  let previewTotalEntries = 0;
  let previewCompletedEntries = 0;

  for (const s of inScopeStudents) {
    for (const e of inScopeExams) {
      const match = examProgress.find((p) => p.studentId === s.id && p.examId === e.id);
      const isDone = match && match.status === 'Sudah Selesai';
      if (statusFilter === 'completed' && !isDone) continue;
      if (statusFilter === 'pending' && isDone) continue;

      previewTotalEntries++;
      if (isDone) previewCompletedEntries++;
    }
  }

  const previewPendingEntries = previewTotalEntries - previewCompletedEntries;
  const previewPercentage = previewTotalEntries > 0 
    ? Math.round((previewCompletedEntries / previewTotalEntries) * 100) 
    : 0;

  const handleStartExport = async () => {
    if (!currentUser) {
      setExportError('Silakan login dengan akun Google terlebih dahulu');
      return;
    }

    try {
      setIsExporting(true);
      setExportError('');

      const result = await exportStudentExamResultsToDriveFolder({
        settings,
        students,
        exams,
        examProgress,
        targetFolderName: folderMode === 'new' ? folderName.trim() : undefined,
        targetFolderId: folderMode === 'existing' ? selectedExistingFolderId : undefined,
        filterExamId: selectedExamId,
        filterClassGroup: selectedClassGroup,
        statusFilter,
      });

      setExportResult(result);
    } catch (err: any) {
      setExportError(err.message || 'Terjadi kesalahan saat mengekspor ke Google Drive');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyFolderLink = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="export-drive-modal-content"
        className="bg-white rounded-3xl border border-emerald-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <HardDrive className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Ekspor Hasil Ujian ke Google Drive
              </h3>
              <p className="text-xs text-emerald-200">
                Simpan rekapan hasil pengerjaan CBT siswa langsung ke folder khusus Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* 1. Google Account Connection State */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200">
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Memeriksa status otorisasi Google...</span>
              </div>
            ) : currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-emerald-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm">
                      {currentUser.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-gray-900">
                        {currentUser.displayName || 'Akun Google'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terhubung
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-red-600 underline font-medium self-start sm:self-center"
                >
                  Ganti Akun
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <p className="font-bold">Otorisasi Google Drive Diperlukan</p>
                    <p className="text-emerald-800/90 mt-0.5">
                      Masuk dengan Akun Google sekolah Anda untuk membuat folder dan mengekspor file hasil ujian ke Drive.
                    </p>
                  </div>
                </div>
                <div className="pt-1">
                  <GoogleSignInButton onClick={handleSignIn} disabled={isAuthLoading} />
                </div>
              </div>
            )}

            {authError && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* If already exported, show the Success View */}
          {exportResult ? (
            <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    Hasil Ujian Berhasil Diekspor ke Google Drive!
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Folder khusus dan 3 file rekapan telah tersimpan dengan aman di Google Drive Anda.
                  </p>
                </div>
              </div>

              {/* Folder Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-emerald-700" />
                    <span className="font-bold text-xs sm:text-sm text-emerald-950">
                      {exportResult.folder.name}
                    </span>
                  </div>
                  {exportResult.folder.webViewLink && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyFolderLink(exportResult.folder.webViewLink)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Disalin' : 'Salin Link'}</span>
                      </button>
                      <a
                        href={exportResult.folder.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Folder di Google Drive</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Metric Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Total Rekaman:</span>
                    <span className="font-bold text-gray-900 font-mono">
                      {exportResult.summary.filteredRowsCount} Entri
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Siswa Tuntas:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {exportResult.summary.completedCount} Siswa
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Belum Tuntas:</span>
                    <span className="font-bold text-amber-700 font-mono">
                      {exportResult.summary.pendingCount} Siswa
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Persentase Tuntas:</span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {exportResult.summary.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  File yang Telah Dibuat di Folder:
                </span>
                <div className="space-y-1.5">
                  {exportResult.uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {file.mimeType.includes('csv') ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : file.mimeType.includes('json') ? (
                          <FileCode2 className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="font-medium text-gray-800 truncate font-mono">
                          {file.name}
                        </span>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold shrink-0"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setExportResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Ekspor Lagi dengan Opsi Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 2. Target Folder Setting */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  1. Tujuan Folder di Google Drive
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFolderMode('new')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      folderMode === 'new'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <FolderPlus className={`w-4 h-4 mt-0.5 ${folderMode === 'new' ? 'text-emerald-700' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-bold text-xs">Buat Folder Baru</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Folder baru khusus hasil ujian
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFolderMode('existing');
                      if (currentUser && existingFolders.length === 0) {
                        loadExistingFolders();
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      folderMode === 'existing'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <HardDrive className={`w-4 h-4 mt-0.5 ${folderMode === 'existing' ? 'text-emerald-700' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-bold text-xs">Pilih Folder yang Ada</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Simpan ke folder Drive yang sudah ada
                      </div>
                    </div>
                  </button>
                </div>

                {folderMode === 'new' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nama Folder Baru:
                    </label>
                    <input
                      type="text"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="Contoh: [HASIL UJIAN CBT] SMK KAWULA INDONESIA"
                      className="w-full text-xs font-mono bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pilih Folder Tujuan:
                    </label>
                    {isLoadingFolders ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                        <span>Memuat folder Google Drive...</span>
                      </div>
                    ) : existingFolders.length > 0 ? (
                      <select
                        value={selectedExistingFolderId}
                        onChange={(e) => setSelectedExistingFolderId(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {existingFolders.map((f) => (
                          <option key={f.id} value={f.id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-gray-500 italic py-1">
                        Tidak ada folder terdeteksi di root Drive. Silakan gunakan opsi "Buat Folder Baru".
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Scope & Filtering */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. Filter Data Hasil Ujian</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Exam selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-emerald-600" />
                      Mata Pelajaran:
                    </label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Mata Pelajaran ({exams.length})</option>
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} ({ex.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-600" />
                      Kelas Siswa:
                    </label>
                    <select
                      value={selectedClassGroup}
                      onChange={(e) => setSelectedClassGroup(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Kelas ({classGroups.length})</option>
                      {classGroups.map((cg) => (
                        <option key={cg} value={cg}>
                          {cg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Status Pengerjaan:
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full text-xs bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Status Siswa</option>
                      <option value="completed">Hanya Sudah Selesai</option>
                      <option value="pending">Hanya Belum Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Preview Stat Badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-950 block">
                      Ringkasan Data yang Akan Diekspor:
                    </span>
                    <p className="text-emerald-800">
                      <strong>{previewTotalEntries}</strong> data siswa &bull;{' '}
                      <span className="text-emerald-700 font-semibold">{previewCompletedEntries} Selesai ({previewPercentage}%)</span> &bull;{' '}
                      <span className="text-amber-700 font-semibold">{previewPendingEntries} Belum Selesai</span>
                    </p>
                  </div>
                  <div className="text-[11px] text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 font-medium shrink-0">
                    3 File: CSV, TXT, JSON
                  </div>
                </div>
              </div>

              {exportError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleStartExport}
                  disabled={isExporting || !currentUser || previewTotalEntries === 0}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all ${
                    isExporting || !currentUser || previewTotalEntries === 0
                      ? 'bg-emerald-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengunggah ke Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4" />
                      <span>Ekspor Hasil ke Google Drive</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
