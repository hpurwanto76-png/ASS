import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, FileSpreadsheet, BookOpen, 
  Settings, CheckCircle2, Clock, School, ShieldCheck, ArrowUpRight,
  HardDrive
} from 'lucide-react';
import { AppSettings, AdminUser, Student, ExamSubject, StudentExamProgress } from '../types';
import { ExcelImportSection } from './ExcelImportSection';
import { StudentManagementSection } from './StudentManagementSection';
import { ExamManagementSection } from './ExamManagementSection';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { SettingsSection } from './SettingsSection';
import { GoogleDriveSection } from './GoogleDriveSection';

interface AdminDashboardProps {
  settings: AppSettings;
  adminUser: AdminUser;
  students: Student[];
  exams: ExamSubject[];
  examProgress: StudentExamProgress[];
  onSaveSettings: (settings: AppSettings) => void;
  onUpdateAdmin: (admin: AdminUser) => void;
  onImportStudents: (newStudents: Student[], mode: 'sync' | 'append' | 'replace') => void;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddExam: (exam: ExamSubject) => void;
  onUpdateExam: (exam: ExamSubject) => void;
  onDeleteExam: (examId: string) => void;
  onResetAllData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  adminUser,
  students,
  exams,
  examProgress,
  onSaveSettings,
  onUpdateAdmin,
  onImportStudents,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
  onResetAllData,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'excel' | 'students' | 'exams' | 'spreadsheet' | 'drive' | 'settings'
  >('overview');

  const activeExamsCount = exams.filter((x) => x.isActive).length;
  const completedSubmissions = examProgress.filter((p) => p.status === 'Sudah Selesai').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Title & Quick Status Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs ring-4 ring-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Panel Administrator CBT
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Admin Mode
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
              {settings.schoolName} &bull; {settings.examName} ({settings.academicYear})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('drive')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
            <span>Google Drive CBT</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Impor Siswa Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-gray-600" />
            <span>Pengaturan CBT</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto no-scrollbar space-x-1 sm:space-x-2 bg-emerald-100/60 p-1.5 rounded-2xl border border-emerald-200">
        <button
          id="admin-tab-overview"
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Ringkasan</span>
        </button>

        <button
          id="admin-tab-drive"
          type="button"
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'drive'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <HardDrive className="w-4 h-4 text-emerald-600" />
          <span>Google Drive</span>
        </button>

        <button
          id="admin-tab-excel"
          type="button"
          onClick={() => setActiveTab('excel')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'excel'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Input Siswa Excel</span>
        </button>

        <button
          id="admin-tab-students"
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'students'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Siswa ({students.length})</span>
        </button>

        <button
          id="admin-tab-exams"
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'exams'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mapel &amp; Google Form ({exams.length})</span>
        </button>

        <button
          id="admin-tab-spreadsheet"
          type="button"
          onClick={() => setActiveTab('spreadsheet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'spreadsheet'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Rekap Nilai Google Sheet</span>
        </button>

        <button
          id="admin-tab-settings"
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Sistem</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Peserta Ujian
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2 font-mono">
                {students.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Siswa terdaftar di database
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran Aktif
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2 font-mono">
                {activeExamsCount} / {exams.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tautan Google Form siap dikerjakan
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pengerjaan Selesai
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2 font-mono">
                {completedSubmissions}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Respons sesi terekam tuntas
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tahun Pelajaran
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <School className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-950 mt-2 font-mono">
                {settings.academicYear}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Semester {settings.semester}
              </p>
            </div>
          </div>

          {/* Quick Action Bento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                Alur Integrasi Google Form &amp; Spreadsheet
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Aplikasi ini menjembatani ujian CBT sekolah dengan form soal ujian:
              </p>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                  <span><strong>Input Siswa via Excel:</strong> Unggah daftar siswa sekaligus atau gunakan template.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                  <span><strong>Tautkan Google Form:</strong> Masukkan link soal Google Form per mata pelajaran.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                  <span><strong>Rekap Nilai Google Sheet:</strong> Nilai hasil pengerjaan langsung tampil otomatis di aplikasi.</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
              <h4 className="font-bold text-gray-900 text-base">
                Status Pengaturan Sekolah Saat Ini
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Nama Sekolah:</span>
                  <span className="font-bold text-gray-900">{settings.schoolName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Nama Ujian:</span>
                  <span className="font-bold text-emerald-950">{settings.examName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Tahun Pelajaran:</span>
                  <span className="font-bold text-gray-900">{settings.academicYear} ({settings.semester})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Akun Login Admin:</span>
                  <span className="font-mono font-bold text-gray-900">{adminUser.username}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-xs transition-colors"
              >
                <span>Ubah Pengaturan Sekolah &amp; User Login</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Excel Import */}
      {activeTab === 'excel' && (
        <ExcelImportSection
          onImportComplete={onImportStudents}
          currentStudentCount={students.length}
          existingStudents={students}
        />
      )}

      {/* Tab 3: Students Management */}
      {activeTab === 'students' && (
        <StudentManagementSection
          students={students}
          onAddStudent={onAddStudent}
          onUpdateStudent={onUpdateStudent}
          onDeleteStudent={onDeleteStudent}
        />
      )}

      {/* Tab 4: Exams & Google Form */}
      {activeTab === 'exams' && (
        <ExamManagementSection
          exams={exams}
          onAddExam={onAddExam}
          onUpdateExam={onUpdateExam}
          onDeleteExam={onDeleteExam}
        />
      )}

      {/* Tab 5: Spreadsheet Results */}
      {activeTab === 'spreadsheet' && (
        <SpreadsheetViewer
          masterUrl={settings.masterSpreadsheetUrl}
          exams={exams}
          userRole="admin"
          settings={settings}
          students={students}
          examProgress={examProgress}
        />
      )}

      {/* Tab 6: Google Drive Integration */}
      {activeTab === 'drive' && (
        <GoogleDriveSection
          settings={settings}
          students={students}
          exams={exams}
          examProgress={examProgress}
          onUseSpreadsheetUrl={(url) => {
            onSaveSettings({
              ...settings,
              masterSpreadsheetUrl: url,
            });
          }}
        />
      )}

      {/* Tab 7: Settings */}
      {activeTab === 'settings' && (
        <SettingsSection
          settings={settings}
          adminUser={adminUser}
          onSaveSettings={onSaveSettings}
          onUpdateAdmin={onUpdateAdmin}
          onResetAllData={onResetAllData}
        />
      )}
    </div>
  );
};
