import React, { useState } from 'react';
import { 
  Settings, School, KeyRound, ShieldCheck, CheckCircle2, 
  Save, RotateCcw, AlertCircle, FileSpreadsheet, ExternalLink, Eye, EyeOff 
} from 'lucide-react';
import { AppSettings, AdminUser } from '../types';

interface SettingsSectionProps {
  settings: AppSettings;
  adminUser: AdminUser;
  onSaveSettings: (newSettings: AppSettings) => void;
  onUpdateAdmin: (newAdmin: AdminUser) => void;
  onResetAllData: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  adminUser,
  onSaveSettings,
  onUpdateAdmin,
  onResetAllData,
}) => {
  // Settings Form State
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolSubtitle, setSchoolSubtitle] = useState(settings.schoolSubtitle);
  const [examName, setExamName] = useState(settings.examName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(settings.semester);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [masterSpreadsheetUrl, setMasterSpreadsheetUrl] = useState(settings.masterSpreadsheetUrl);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [enableToken, setEnableToken] = useState(settings.enableToken);

  // Admin Account Form State
  const [adminUsername, setAdminUsername] = useState(adminUser.username);
  const [adminName, setAdminName] = useState(adminUser.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Status Alerts
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      schoolName,
      schoolSubtitle,
      examName,
      academicYear,
      semester,
      schoolAddress,
      masterSpreadsheetUrl,
      announcement,
      enableToken,
    };
    onSaveSettings(updated);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3500);
  };

  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminUsername.trim()) {
      setAdminError('Username administrator tidak boleh kosong');
      return;
    }

    // If changing password
    if (newPassword || confirmPassword || currentPassword) {
      if (currentPassword !== adminUser.password) {
        setAdminError('Password saat ini salah!');
        return;
      }
      if (newPassword.length < 4) {
        setAdminError('Password baru minimal 4 karakter');
        return;
      }
      if (newPassword !== confirmPassword) {
        setAdminError('Konfirmasi password baru tidak cocok');
        return;
      }
    }

    const updatedAdmin: AdminUser = {
      ...adminUser,
      username: adminUsername.trim(),
      name: adminName.trim() || 'Administrator CBT',
      password: newPassword ? newPassword : adminUser.password,
    };

    onUpdateAdmin(updatedAdmin);
    setAdminSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setAdminSuccess(false), 3500);
  };

  return (
    <div className="space-y-8">
      {/* 1. Pengaturan Identitas Sekolah & Ujian */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 flex items-center justify-center">
              <School className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Pengaturan Sekolah &amp; Ujian
              </h3>
              <p className="text-xs text-emerald-200">
                Ubah Nama Sekolah, Nama Ujian, Tahun Pelajaran, dan Semester
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveGeneralSettings} className="p-5 sm:p-6 space-y-5">
          {settingsSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Pengaturan sekolah dan ujian berhasil diperbarui!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-school-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Sekolah *
              </label>
              <input
                id="settings-school-name"
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Contoh: SMK KAWULA INDONESIA"
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="settings-school-subtitle" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Akreditasi / Keterangan Sekolah
              </label>
              <input
                id="settings-school-subtitle"
                type="text"
                value={schoolSubtitle}
                onChange={(e) => setSchoolSubtitle(e.target.value)}
                placeholder="Contoh: Terakreditasi A - Jakarta"
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings-exam-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Ujian / Asesmen *
            </label>
            <input
              id="settings-exam-name"
              type="text"
              required
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Contoh: ASESMEN SUMATIF AKHIR JENJANG (ASAJ) CBT"
              className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-950 uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-academic-year" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Tahun Pelajaran *
              </label>
              <input
                id="settings-academic-year"
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="Contoh: 2025/2026"
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label htmlFor="settings-semester" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Semester *
              </label>
              <select
                id="settings-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="settings-school-address" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Alamat Sekolah
            </label>
            <input
              id="settings-school-address"
              type="text"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              placeholder="Contoh: Jl. Raya Pendidikan No. 45, Jakarta"
              className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>

          {/* Master Google Spreadsheet */}
          <div>
            <label htmlFor="settings-master-spreadsheet" className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>URL Google Spreadsheet Rekap Nilai Induk</span>
              <a
                href={masterSpreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-700 hover:underline inline-flex items-center gap-1 font-normal lowercase"
              >
                buka link <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              id="settings-master-spreadsheet"
              type="url"
              value={masterSpreadsheetUrl}
              onChange={(e) => setMasterSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../pubhtml"
              className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900 font-mono"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Digunakan untuk menampilkan rekapitulasi nilai semua siswa pada menu Rekap Nilai Google Spreadsheet.
            </p>
          </div>

          {/* Announcement */}
          <div>
            <label htmlFor="settings-announcement" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Pengumuman / Tata Tertib Ujian (Ditampilkan ke Siswa)
            </label>
            <textarea
              id="settings-announcement"
              rows={3}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Pesan atau petunjuk yang muncul di dashboard peserta ujian..."
              className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="btn-save-general-settings"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Sekolah</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Pengaturan User Login Admin */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
        <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Pengaturan User Login Administrator
              </h3>
              <p className="text-xs text-emerald-100">
                Ubah Username dan Password Akun Admin CBT
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveAdminCredentials} className="p-5 sm:p-6 space-y-5">
          {adminSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Kredensial User Login Admin berhasil diperbarui!</span>
            </div>
          )}

          {adminError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{adminError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-edit-username" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Username Admin Baru *
              </label>
              <input
                id="admin-edit-username"
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Username admin..."
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="admin-edit-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Nama Tampilan Administrator
              </label>
              <input
                id="admin-edit-name"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Nama administrator..."
                className="w-full text-xs sm:text-sm p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-4">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Ubah Password Administrator (Opsional)
            </h4>
            <p className="text-xs text-gray-500">
              Kosongkan bagian ini jika Anda tidak ingin mengganti password admin saat ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="admin-current-pass" className="block text-xs font-semibold text-gray-600 mb-1">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    id="admin-current-pass"
                    type={showAdminPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Password saat ini..."
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-new-pass" className="block text-xs font-semibold text-gray-600 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    id="admin-new-pass"
                    type={showAdminPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru..."
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-confirm-pass" className="block text-xs font-semibold text-gray-600 mb-1">
                  Ulangi Password Baru
                </label>
                <div className="relative">
                  <input
                    id="admin-confirm-pass"
                    type={showAdminPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password..."
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1"
              >
                {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAdminPass ? 'Sembunyikan Password' : 'Lihat Teks Password'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="btn-save-admin-credentials"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Simpan Akun Administrator</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Reset Data */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-900 text-base text-rose-900">
            Reset Data Sistem ke Pengaturan Awal
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Mengembalikan seluruh data sekolah, akun admin, siswa, dan mata pelajaran ke kondisi awal SMK KAWULA INDONESIA.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs sm:text-sm transition-colors shrink-0"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Reset ke Pengaturan Awal</span>
        </button>
      </div>

      {/* Confirm Reset Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">
                Konfirmasi Reset Semua Data
              </h4>
              <p className="text-xs text-gray-600 mt-2">
                Tindakan ini akan mengembalikan data sekolah, siswa, ujian, dan akun admin default (admin / admin123). Anda yakin ingin melanjutkan?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setShowResetConfirm(false);
                }}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
