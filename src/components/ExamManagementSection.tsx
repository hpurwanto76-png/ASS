import React, { useState } from 'react';
import { 
  BookOpen, Plus, ExternalLink, Edit3, Trash2, Key, 
  Calendar, Clock, CheckCircle, FileSpreadsheet, X, HelpCircle, Link as LinkIcon 
} from 'lucide-react';
import { ExamSubject } from '../types';

interface ExamManagementSectionProps {
  exams: ExamSubject[];
  onAddExam: (exam: ExamSubject) => void;
  onUpdateExam: (exam: ExamSubject) => void;
  onDeleteExam: (examId: string) => void;
}

export const ExamManagementSection: React.FC<ExamManagementSectionProps> = ({
  exams,
  onAddExam,
  onUpdateExam,
  onDeleteExam,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSubject | null>(null);

  const [formData, setFormData] = useState<Partial<ExamSubject>>({
    code: '',
    name: '',
    gradeLevel: 'Kelas XII',
    major: 'Semua Jurusan',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '09:00',
    durationMinutes: 90,
    googleFormUrl: '',
    googleSpreadsheetUrl: '',
    token: '',
    isActive: true,
    status: 'Sedang Berlangsung',
  });

  const handleOpenAdd = () => {
    setFormData({
      code: `MAPEL-${exams.length + 1}`,
      name: '',
      gradeLevel: 'Kelas XII',
      major: 'Semua Jurusan',
      date: new Date().toISOString().split('T')[0],
      startTime: '07:30',
      endTime: '09:00',
      durationMinutes: 90,
      googleFormUrl: 'https://docs.google.com/forms/d/e/.../viewform',
      googleSpreadsheetUrl: '',
      token: 'UJIAN26',
      isActive: true,
      status: 'Sedang Berlangsung',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exam: ExamSubject) => {
    setEditingExam(exam);
    setFormData({ ...exam });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.googleFormUrl) return;

    if (editingExam) {
      onUpdateExam({
        ...editingExam,
        ...formData,
      } as ExamSubject);
      setEditingExam(null);
    } else {
      onAddExam({
        id: `exam-${Date.now()}`,
        code: formData.code || `MAPEL-${Date.now().toString().slice(-4)}`,
        name: formData.name!,
        gradeLevel: formData.gradeLevel || 'Kelas XII',
        major: formData.major || 'Semua Jurusan',
        date: formData.date || new Date().toISOString().split('T')[0],
        startTime: formData.startTime || '07:30',
        endTime: formData.endTime || '09:00',
        durationMinutes: Number(formData.durationMinutes) || 90,
        googleFormUrl: formData.googleFormUrl!,
        googleSpreadsheetUrl: formData.googleSpreadsheetUrl || '',
        token: formData.token || '',
        isActive: formData.isActive !== false,
        status: (formData.status as any) || 'Sedang Berlangsung',
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            Mata Pelajaran &amp; Pengaturan Link Google Form
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kelola jadwal, durasi, token ujian, serta tautkan URL Google Form soal dan Spreadsheet nilai.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran Ujian</span>
        </button>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
              exam.isActive ? 'border-emerald-300' : 'border-gray-200 opacity-80'
            }`}
          >
            <div className="space-y-3">
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
                  <h4 className="text-base font-bold text-gray-900 mt-1">
                    {exam.name}
                  </h4>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    exam.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {exam.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{exam.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{exam.startTime} - {exam.endTime} ({exam.durationMinutes} mnt)</span>
                </div>
                {exam.token ? (
                  <div className="col-span-2 flex items-center justify-between text-emerald-900">
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-emerald-600" />
                      Token: <strong className="font-mono font-bold tracking-wider">{exam.token}</strong>
                    </span>
                    <span className="text-[11px] text-gray-400">Token Aktif</span>
                  </div>
                ) : (
                  <div className="col-span-2 text-gray-400 italic">Tanpa Token Ujian</div>
                )}
              </div>

              {/* Link Details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-gray-600 truncate max-w-[200px] flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{exam.googleFormUrl}</span>
                  </span>
                  <a
                    href={exam.googleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 shrink-0 ml-2"
                  >
                    Tes Form <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {exam.googleSpreadsheetUrl && (
                  <div className="flex items-center justify-between bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                    <span className="text-gray-600 truncate max-w-[200px] flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{exam.googleSpreadsheetUrl}</span>
                    </span>
                    <a
                      href={exam.googleSpreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 shrink-0 ml-2"
                    >
                      Buka Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(exam)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>

              <div className="relative group/delete inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus mata pelajaran ${exam.name} (${exam.code})? Semua pengaturan jadwal dan token terkait akan dihapus.`)) {
                      onDeleteExam(exam.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                  aria-label={`Hapus mata pelajaran ${exam.name} (${exam.code})`}
                  title={`Hapus mata pelajaran ${exam.name} (${exam.code})`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                {/* Descriptive Hover Tooltip */}
                <div 
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 group-hover/delete:opacity-100 transition-all duration-150 flex flex-col w-64 p-3 bg-gray-900/95 text-white rounded-xl shadow-xl border border-gray-700/80 z-50 text-left backdrop-blur-xs transform -translate-y-0.5"
                >
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Rekaman Ujian</span>
                  </div>
                  <p className="text-[11px] text-gray-200 mt-1 leading-snug">
                    Menghapus mata pelajaran <strong>{exam.name}</strong> ({exam.code}) beserta token dan tautan Google Form dari sistem CBT.
                  </p>
                  <span className="text-[10px] text-amber-300 font-medium mt-1.5 flex items-center gap-1">
                    &bull; Tindakan permanen tidak dapat dibatalkan
                  </span>
                  {/* Arrow */}
                  <div className="absolute top-full right-5 -mt-1 border-4 border-transparent border-t-gray-900/95" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Subject */}
      {(isAddModalOpen || editingExam) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-emerald-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">
                {editingExam ? 'Ubah Data Mata Pelajaran' : 'Tambah Mata Pelajaran Ujian'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingExam(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Kode Mapel
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BIND-XII"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Token Ujian
                  </label>
                  <input
                    type="text"
                    value={formData.token || ''}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BINDO26"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Bahasa Indonesia"
                  className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tingkat Kelas
                  </label>
                  <input
                    type="text"
                    value={formData.gradeLevel || 'Kelas XII'}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    placeholder="Kelas XII"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Jurusan Sasaran
                  </label>
                  <input
                    type="text"
                    value={formData.major || 'Semua Jurusan'}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Semua Jurusan / TKJ"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tanggal Ujian
                  </label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Waktu Mulai - Selesai
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={formData.startTime || '07:30'}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full text-xs p-2 bg-emerald-50/40 border border-emerald-200 rounded-lg"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="time"
                      value={formData.endTime || '09:00'}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full text-xs p-2 bg-emerald-50/40 border border-emerald-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes || 90}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Google Form Link */}
              <div>
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1">
                  Link Soal Ujian (Google Form) *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={formData.googleFormUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Siswa akan diarahkan ke tautan Google Form ini saat menekan tombol "Kerjakan Ujian".
                </p>
              </div>

              {/* Google Spreadsheet Link */}
              <div>
                <label className="block text-xs font-semibold text-emerald-950 uppercase tracking-wider mb-1">
                  Link Rekap Nilai Mapel Ini (Google Spreadsheet) - Opsional
                </label>
                <input
                  type="url"
                  value={formData.googleSpreadsheetUrl || ''}
                  onChange={(e) => setFormData({ ...formData, googleSpreadsheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../pubhtml"
                  className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Spreadsheet hasil respon jawaban siswa dari Google Form untuk mapel ini.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>Aktifkan Mata Pelajaran ini untuk Siswa</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingExam(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs"
                >
                  {editingExam ? 'Simpan Perubahan' : 'Tambah Mata Pelajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
