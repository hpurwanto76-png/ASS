import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, HardDrive, FolderPlus, Upload, RefreshCw, 
  Search, ExternalLink, Trash2, CheckCircle2, AlertCircle, 
  FileSpreadsheet, FileText, Folder, File, Copy, 
  Check, ArrowRight, ShieldCheck, LogOut, Database,
  Sparkles, Lock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  isGoogleConnected,
  auth
} from '../services/googleAuth';
import { 
  DriveFile, 
  listDriveFiles, 
  createDriveFolder, 
  uploadFileToDrive, 
  deleteDriveFile, 
  backupCbtSystemToDrive 
} from '../services/googleDrive';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ExportExamResultsDriveModal } from './ExportExamResultsDriveModal';
import { AppSettings, Student, ExamSubject, StudentExamProgress } from '../types';

interface GoogleDriveSectionProps {
  settings: AppSettings;
  students: Student[];
  exams: ExamSubject[];
  examProgress: StudentExamProgress[];
  onUseSpreadsheetUrl?: (url: string) => void;
}

export const GoogleDriveSection: React.FC<GoogleDriveSectionProps> = ({
  settings,
  students,
  exams,
  examProgress,
  onUseSpreadsheetUrl,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Files state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [filesError, setFilesError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'folders' | 'spreadsheets' | 'forms' | 'documents'>('all');

  // Actions state
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupResult, setBackupResult] = useState<{ folderName: string; folderUrl: string; count: number } | null>(null);

  // New Folder Modal / State
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');

  // Destructive Delete Confirmation Modal
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Export Results to Drive Modal
  const [showExportResultsModal, setShowExportResultsModal] = useState<boolean>(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setCurrentUser(user);
        setIsConnected(true);
      },
      () => {
        setCurrentUser(null);
        setIsConnected(false);
      }
    );

    // Initial check
    if (isGoogleConnected() && auth.currentUser) {
      setCurrentUser(auth.currentUser);
      setIsConnected(true);
    }

    return () => unsubscribe();
  }, []);

  // Fetch Drive files
  const fetchFiles = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsLoadingFiles(true);
    setFilesError('');
    try {
      const data = await listDriveFiles({
        searchQuery,
        mimeTypeFilter: mimeFilter,
        pageSize: 40,
      });
      setFiles(data.files || []);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setFilesError(err.message || 'Gagal memuat daftar berkas dari Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [searchQuery, mimeFilter]);

  useEffect(() => {
    if (isConnected) {
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [isConnected, fetchFiles]);

  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const result = await googleSignIn();
      setCurrentUser(result.user);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Gagal menghubungkan akun Google. Silakan periksa perizinan pada peramban Anda.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setIsConnected(false);
      setFiles([]);
      setBackupResult(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  // Perform full CBT backup
  const handlePerformBackup = async () => {
    if (!isConnected) return;
    setIsBackingUp(true);
    setBackupResult(null);
    try {
      const result = await backupCbtSystemToDrive({
        settings,
        students,
        exams,
        examProgress,
      });
      setBackupResult({
        folderName: result.folder.name,
        folderUrl: result.folder.webViewLink || 'https://drive.google.com',
        count: result.uploadedFiles.length,
      });
      // Refresh list to show newly created backup folder
      fetchFiles();
    } catch (err: any) {
      alert(`Gagal membuat cadangan ke Google Drive: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      await createDriveFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchFiles();
    } catch (err: any) {
      alert(`Gagal membuat folder: ${err.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    setIsUploading(true);
    setUploadSuccessMessage('');
    try {
      await uploadFileToDrive({
        name: file.name,
        content: file,
        mimeType: file.type || 'application/octet-stream',
      });
      setUploadSuccessMessage(`Berkas "${file.name}" berhasil diunggah ke Google Drive!`);
      setTimeout(() => setUploadSuccessMessage(''), 4000);
      fetchFiles();
    } catch (err: any) {
      alert(`Gagal mengunggah berkas: ${err.message}`);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Delete File Handler (with mandatory confirmation)
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setFileToDelete(null);
      fetchFiles();
    } catch (err: any) {
      alert(`Gagal menghapus berkas: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '-';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '-';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) {
      return <Folder className="w-5 h-5 text-amber-500 shrink-0" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet') || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (mimeType.includes('form')) {
      return <FileText className="w-5 h-5 text-purple-600 shrink-0" />;
    }
    if (mimeType.includes('document') || mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
    }
    return <File className="w-5 h-5 text-gray-500 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Google Drive Connection State */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs ring-4 ring-emerald-100 shrink-0">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Integrasi Google Drive CBT
                </h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    Belum Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
                Kelola arsip soal, berkas rekapan nilai Google Spreadsheet, dan cadangkan data siswa serta jadwal ujian CBT langsung ke Google Drive sekolah dengan izin Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isConnected && currentUser ? (
              <div className="flex items-center gap-3 bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="text-left pr-2">
                  <span className="text-xs font-bold text-gray-900 block truncate max-w-[170px]">
                    {currentUser.displayName || 'Akun Google'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate max-w-[170px]">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  title="Putuskan Hubungan Google Drive"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={handleConnectGoogle}
                isLoading={isAuthenticating}
                text="Masuk dengan Google Drive"
              />
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{authError}</p>
          </div>
        )}
      </div>

      {/* CBT Google Drive Quick Actions Bar (Visible when connected) */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Specialized Export Exam Results */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden ring-4 ring-emerald-100/50">
            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Fitur Utama
              </span>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center mb-3 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                Ekspor Hasil Ujian Siswa
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ekspor hasil ujian peserta ke folder khusus Google Drive (CSV, Laporan Statistik TXT, dan JSON lengkap).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100">
              <button
                type="button"
                onClick={() => setShowExportResultsModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Ekspor ke Folder Drive</span>
              </button>
            </div>
          </div>

          {/* Card 2: One-Click CBT Backup */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                Cadangkan Sistem CBT
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Cadangkan data akun siswa, pengaturan jadwal ujian, dan rekap sesi ke Google Drive Anda.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handlePerformBackup}
                disabled={isBackingUp}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-60"
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencadangkan ke Drive...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cadangkan Sistem</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Create Folder */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <FolderPlus className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                Buat Folder Arsip CBT
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Buat direktori baru di Google Drive untuk mengelompokkan bank soal atau dokumen pelaksanaan ujian.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                <span>Buat Folder Baru</span>
              </button>
            </div>
          </div>

          {/* Card 4: Upload Exam File */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                Unggah Berkas ke Drive
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Unggah kisi-kisi, berkas soal, atau rekap nilai Excel dari komputer langsung ke Google Drive sekolah.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>{isUploading ? 'Mengunggah...' : 'Pilih Berkas Komputer'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Backup Success Banner */}
      {backupResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">
                Pencadangan Berhasil Disimpan ke Google Drive!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Folder <strong>"{backupResult.folderName}"</strong> telah dibuat dengan {backupResult.count} berkas (JSON data lengkap + CSV Siswa, Mapel, dan Progres).
              </p>
            </div>
          </div>
          <a
            href={backupResult.folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Buka Folder di Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {uploadSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccessMessage}</span>
        </div>
      )}

      {/* Google Drive Explorer Section */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-700" />
              <span>Jelajahi Berkas di Google Drive</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Daftar berkas spreadsheet, formulir ujian, dan folder yang tersedia di akun Google Drive Anda
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <button
                type="button"
                onClick={fetchFiles}
                disabled={isLoadingFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Mime Filters */}
        {isConnected && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berkas di Google Drive berdasarkan nama..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 shrink-0">
              <button
                type="button"
                onClick={() => setMimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mimeFilter === 'all' ? 'bg-white text-emerald-950 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                Semua ({files.length})
              </button>
              <button
                type="button"
                onClick={() => setMimeFilter('spreadsheets')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  mimeFilter === 'spreadsheets' ? 'bg-white text-emerald-950 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Spreadsheets</span>
              </button>
              <button
                type="button"
                onClick={() => setMimeFilter('forms')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  mimeFilter === 'forms' ? 'bg-white text-emerald-950 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Google Forms</span>
              </button>
              <button
                type="button"
                onClick={() => setMimeFilter('folders')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  mimeFilter === 'folders' ? 'bg-white text-emerald-950 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* Content list or not connected prompt */}
        {!isConnected ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40">
            <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs border border-emerald-100">
              <Cloud className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Hubungkan Google Drive untuk Melihat Berkas
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
              Masuk dengan akun Google Anda untuk mengakses Google Spreadsheet rekap nilai, formulir Google Form, dan mengelola cadangan sistem CBT.
            </p>
            <GoogleSignInButton
              onClick={handleConnectGoogle}
              isLoading={isAuthenticating}
              text="Masuk dengan Google"
            />
          </div>
        ) : isLoadingFiles ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">Memuat berkas dari Google Drive...</p>
          </div>
        ) : filesError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Kesalahan Mengakses Drive</p>
              <p className="mt-0.5">{filesError}</p>
              <button
                onClick={fetchFiles}
                className="mt-2 text-xs font-bold text-rose-700 underline"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Folder className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Tidak ada berkas ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? `Tidak ada berkas yang cocok dengan pencarian "${searchQuery}"` : 'Google Drive Anda belum memiliki berkas dengan filter ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Berkas</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Ukuran</th>
                  <th className="py-3 px-3">Terakhir Diubah</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((file) => {
                  const isSpreadsheet = file.mimeType.includes('spreadsheet');
                  const isForm = file.mimeType.includes('form');

                  return (
                    <tr key={file.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 block truncate max-w-xs sm:max-w-md" title={file.name}>
                              {file.name}
                            </span>
                            {file.owners && file.owners[0] && (
                              <span className="text-[10px] text-gray-400 block truncate">
                                Pemilik: {file.owners[0].displayName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                          {isSpreadsheet ? 'Google Sheet' : isForm ? 'Google Form' : file.mimeType.includes('folder') ? 'Folder' : 'File'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-gray-500">
                        {formatDate(file.modifiedTime)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Use as CBT Spreadsheet */}
                          {isSpreadsheet && onUseSpreadsheetUrl && file.webViewLink && (
                            <button
                              type="button"
                              onClick={() => {
                                onUseSpreadsheetUrl(file.webViewLink!);
                                alert(`Tautan spreadsheet "${file.name}" berhasil ditetapkan sebagai Master Rekap Nilai!`);
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                              title="Gunakan sebagai Master Rekap Nilai CBT"
                            >
                              Pakai di CBT
                            </button>
                          )}

                          {/* Open in Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Buka di Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Copy Link */}
                          {file.webViewLink && (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(file.webViewLink!, file.id)}
                              className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Salin tautan berkas"
                            >
                              {copiedId === file.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete File (with mandatory confirmation) */}
                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={`Hapus ${file.name} dari Google Drive`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Buat Folder Baru di Google Drive</h3>
                <p className="text-xs text-gray-500">Folder akan langsung dibuat di drive Anda</p>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Folder
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Soal CBT ASAJ 2026"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY User Confirmation Dialog for Destructive Delete */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-200">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Konfirmasi Hapus dari Google Drive
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tindakan ini akan menghapus berkas langsung dari akun Google Drive Anda.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl mb-5 space-y-1">
              <div className="flex items-center gap-2">
                {getFileIcon(fileToDelete.mimeType)}
                <span className="text-xs font-bold text-gray-900 truncate">
                  {fileToDelete.name}
                </span>
              </div>
              <p className="text-[11px] text-rose-800">
                Apakah Anda yakin ingin menghapus <strong>1 berkas</strong> ini secara permanen dari Google Drive? Tindakan ini tidak dapat dibatalkan melalui sistem CBT.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Berkas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Exam Results to Drive Modal */}
      <ExportExamResultsDriveModal
        isOpen={showExportResultsModal}
        onClose={() => {
          setShowExportResultsModal(false);
          // Refresh drive files if user exported
          fetchFiles();
        }}
        settings={settings}
        students={students}
        exams={exams}
        examProgress={examProgress}
      />
    </div>
  );
};
