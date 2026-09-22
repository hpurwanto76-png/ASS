import React, { useState } from 'react';
import { 
  User, BookOpen, Clock, Calendar, CheckCircle, CheckCircle2,
  ExternalLink, Key, Award, AlertCircle, FileSpreadsheet, PlayCircle, History,
  Search, X, Filter, RotateCcw
} from 'lucide-react';
import { Student, ExamSubject, AppSettings, StudentExamProgress } from '../types';
import { CbtExamModal } from './CbtExamModal';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { ActiveExamCountdownBanner, ActiveExamCardTimer } from './ActiveExamCountdown';

interface StudentDashboardProps {
  student: Student;
  exams: ExamSubject[];
  settings: AppSettings;
  examProgress: StudentExamProgress[];
  onFinishExam: (examId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  exams,
  settings,
  examProgress,
  onFinishExam,
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'history' | 'grades'>('exams');
  const [selectedExamForModal, setSelectedExamForModal] = useState<ExamSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  const isExamCompleted = (examId: string) => {
    return examProgress.some(
      (p) => p.studentId === student.id && p.examId === examId && p.status === 'Sudah Selesai'
    );
  };

  const getProgressInfo = (examId: string) => {
    return examProgress.find((p) => p.studentId === student.id && p.examId === examId);
  };

  const completedExamsProgress = examProgress.filter(
    (p) => p.studentId === student.id && p.status === 'Sudah Selesai'
  );

  const activeUncompletedExams = exams.filter(
    (exam) => (exam.isActive || exam.status === 'Sedang Berlangsung') && !isExamCompleted(exam.id)
  );

  const totalActiveCount = activeUncompletedExams.length;
  const totalCompletedCount = exams.filter((e) => isExamCompleted(e.id)).length;
  const totalPendingCount = exams.length - totalCompletedCount;

  // Filtered exams by search term and status filter
  const filteredExams = exams.filter((exam) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      exam.name.toLowerCase().includes(query) ||
      exam.code.toLowerCase().includes(query) ||
      exam.major.toLowerCase().includes(query) ||
      (exam.gradeLevel && exam.gradeLevel.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    const completed = isExamCompleted(exam.id);
    const isActive = (exam.isActive || exam.status === 'Sedang Berlangsung') && !completed;

    if (statusFilter === 'active') return isActive;
    if (statusFilter === 'pending') return !completed;
    if (statusFilter === 'completed') return completed;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Identity Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs ring-4 ring-emerald-100">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {student.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {student.classGroup}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                {student.major}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-emerald-800 font-mono">
                <span>NISN: <strong>{student.nisn}</strong></span>
                <span>&bull;</span>
                <span>Sesi: <strong>{student.session || 'Sesi 1'}</strong></span>
                <span>&bull;</span>
                <span>Ruang: <strong>{student.room || 'Lab Komputer'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-right">
              <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 block">
                Status Peserta
              </span>
              <span className="text-sm font-bold text-emerald-950 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {student.status || 'Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* School Announcement Notice */}
        {settings.announcement && (
          <div className="mt-4 pt-4 border-t border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900 bg-emerald-50/50 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Info Panitia: </strong>{settings.announcement}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-emerald-200 overflow-x-auto no-scrollbar">
        <button
          id="tab-student-exams"
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'exams'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-emerald-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Daftar Mata Pelajaran Ujian</span>
        </button>

        <button
          id="tab-student-history"
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-emerald-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Ujian (Exam History)</span>
          {completedExamsProgress.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
              {completedExamsProgress.length}
            </span>
          )}
        </button>

        <button
          id="tab-student-grades"
          type="button"
          onClick={() => setActiveTab('grades')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'grades'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-emerald-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Rekap Nilai Siswa (Google Spreadsheet)</span>
        </button>
      </div>

      {/* Tab 1: Exam List */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {/* Visual Countdown Timer for Active Exam(s) */}
          {activeUncompletedExams.length > 0 && (
            <ActiveExamCountdownBanner
              activeExams={activeUncompletedExams}
              student={student}
              onOpenExam={(exam) => setSelectedExamForModal(exam)}
            />
          )}

          {/* Search and Status Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="student-exam-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mata pelajaran ujian (nama, kode, atau jurusan)..."
                  className="w-full pl-10 pr-9 py-2.5 bg-gray-50/70 border border-emerald-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Reset Filter Button if active */}
              {(searchQuery.trim() !== '' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Quick Status Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                Filter:
              </span>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span>Semua</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === 'all' ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {exams.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === 'active'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sedang Aktif</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === 'active' ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {totalActiveCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span>Belum Selesai</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === 'pending' ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {totalPendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span>Sudah Selesai</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === 'completed' ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {totalCompletedCount}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Mata Pelajaran yang Diujikan
            </h3>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              {searchQuery.trim() || statusFilter !== 'all'
                ? `Menampilkan: ${filteredExams.length} dari ${exams.length} Mapel`
                : `Total: ${exams.length} Mapel`}
            </span>
          </div>

          {filteredExams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-emerald-300 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">
                Tidak Ada Ujian yang Cocok
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
                {searchQuery.trim() ? (
                  <>
                    Tidak ditemukan mata pelajaran dengan kata kunci{' '}
                    <strong className="text-emerald-900">"{searchQuery}"</strong>. Periksa ejaan nama mata pelajaran atau coba kata kunci lain.
                  </>
                ) : (
                  'Tidak ada mata pelajaran yang sesuai dengan kriteria filter status yang dipilih.'
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pencarian & Tampilkan Semua</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.map((exam) => {
              const completed = isExamCompleted(exam.id);
              const progress = getProgressInfo(exam.id);
              const isActiveExam = (exam.isActive || exam.status === 'Sedang Berlangsung') && !completed;

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                    completed
                      ? 'border-gray-200 bg-gray-50/40 opacity-90'
                      : exam.isActive
                      ? 'border-emerald-300 ring-1 ring-emerald-200 hover:shadow-md'
                      : 'border-emerald-100'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Mapel */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                            {exam.code}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            {exam.gradeLevel} &bull; {exam.major}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mt-1">
                          {exam.name}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      {completed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Selesai
                        </span>
                      ) : exam.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                          Sedang Aktif
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          {exam.status}
                        </span>
                      )}
                    </div>

                    {/* Schedule & Duration Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{exam.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{exam.startTime} - {exam.endTime} ({exam.durationMinutes} mnt)</span>
                      </div>
                      {exam.token && (
                        <div className="col-span-2 flex items-center gap-1.5 text-emerald-800 font-medium">
                          <Key className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Wajib Token Ujian dari Pengawas</span>
                        </div>
                      )}
                    </div>

                    {/* Visual Card Countdown Timer for Active Exam */}
                    {isActiveExam && (
                      <ActiveExamCardTimer exam={exam} student={student} />
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    {completed ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-gray-500">
                          Diselesaikan: {progress?.completedAt || 'Tercatat'}
                        </span>
                        <button
                          onClick={() => setSelectedExamForModal(exam)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                        >
                          Lihat Detail Ujian
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedExamForModal(exam)}
                        disabled={!exam.isActive && exam.status !== 'Sedang Berlangsung'}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-xs ${
                          exam.isActive || exam.status === 'Sedang Berlangsung'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Mulai Kerjakan Ujian</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* Tab 2: Exam History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Riwayat Pengerjaan Ujian (Exam History)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {completedExamsProgress.length} Selesai
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Daftar seluruh ujian mata pelajaran yang telah diselesaikan oleh <strong>{student.name}</strong> ({student.nisn})
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('grades')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Lihat Rekap Nilai</span>
              </button>
            </div>
          </div>

          {completedExamsProgress.length === 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <History className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                Belum Ada Riwayat Ujian
              </h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                Anda belum menyelesaikan ujian mata pelajaran apapun. Setelah Anda mengonfirmasi penyelesaian pengerjaan soal di ruang ujian CBT, riwayat dan tanggal penyelesaian akan tercatat otomatis di sini.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('exams')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Buka Daftar Ujian Tersedia</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {completedExamsProgress.map((progress, idx) => {
                const examDetail = exams.find((e) => e.id === progress.examId);
                return (
                  <div
                    key={progress.examId || idx}
                    className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-gray-900">
                            {progress.examName || examDetail?.name || 'Ujian Mata Pelajaran'}
                          </h4>
                          {examDetail?.code && (
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {examDetail.code}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {progress.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            Tanggal &amp; Waktu Selesai: <strong className="text-gray-800">{progress.completedAt || 'Tercatat'}</strong>
                          </span>
                          {examDetail && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                Durasi: {examDetail.durationMinutes} Menit
                              </span>
                              <span>&bull;</span>
                              <span>{examDetail.gradeLevel} &bull; {examDetail.major}</span>
                            </>
                          )}
                          <span>&bull;</span>
                          <span>{student.session || 'Sesi 1'} ({student.room || 'Lab'})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {examDetail && (
                        <button
                          type="button"
                          onClick={() => setSelectedExamForModal(examDetail)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                        >
                          Rincian Selesai
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Semua lembar pengerjaan yang telah diselesaikan di atas telah tervalidasi pada sistem CBT sekolah dan tersinkronisasi dengan formulir serta lembar penilaian pengawas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Spreadsheet Viewer */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <SpreadsheetViewer
            masterUrl={settings.masterSpreadsheetUrl}
            exams={exams}
            userRole="student"
          />
        </div>
      )}

      {/* Modal Pengerjaan CBT */}
      {selectedExamForModal && (
        <CbtExamModal
          exam={selectedExamForModal}
          student={student}
          isOpen={!!selectedExamForModal}
          onClose={() => setSelectedExamForModal(null)}
          onFinishExam={(examId) => {
            onFinishExam(examId);
            setSelectedExamForModal(null);
          }}
          isCompleted={isExamCompleted(selectedExamForModal.id)}
        />
      )}
    </div>
  );
};
