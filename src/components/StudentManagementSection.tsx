import React, { useState } from 'react';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, 
  Download, Key, CheckCircle, X, Printer, Shield 
} from 'lucide-react';
import { Student } from '../types';
import { exportStudentsToExcel } from '../utils/excelHelper';

interface StudentManagementSectionProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentManagementSection: React.FC<StudentManagementSectionProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterMajor, setFilterMajor] = useState('ALL');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [printingCardStudent, setPrintingCardStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    nisn: '',
    name: '',
    classGroup: 'XII TKJ 1',
    major: 'Teknik Komputer & Jaringan',
    password: 'siswa123',
    session: 'Sesi 1',
    room: 'Lab Komputer 1',
    status: 'Aktif',
  });

  // Extract unique classes and majors for filters
  const uniqueClasses = Array.from(new Set(students.map((s) => s.classGroup))).sort();
  const uniqueMajors = Array.from(new Set(students.map((s) => s.major))).sort();

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.classGroup.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = filterClass === 'ALL' || s.classGroup === filterClass;
    const matchesMajor = filterMajor === 'ALL' || s.major === filterMajor;

    return matchesSearch && matchesClass && matchesMajor;
  });

  const handleOpenAdd = () => {
    setFormData({
      nisn: '',
      name: '',
      classGroup: uniqueClasses[0] || 'XII TKJ 1',
      major: uniqueMajors[0] || 'Teknik Komputer & Jaringan',
      password: 'siswa123',
      session: 'Sesi 1',
      room: 'Lab Komputer 1',
      status: 'Aktif',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.name) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
      } as Student);
      setEditingStudent(null);
    } else {
      onAddStudent({
        id: `std-man-${Date.now()}`,
        nisn: formData.nisn!,
        name: formData.name!,
        classGroup: formData.classGroup || 'XII TKJ 1',
        major: formData.major || 'Teknik Komputer & Jaringan',
        password: formData.password || 'siswa123',
        session: formData.session || 'Sesi 1',
        room: formData.room || 'Lab Komputer 1',
        status: (formData.status as any) || 'Aktif',
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Daftar &amp; Data Siswa Peserta Ujian
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Total {students.length} peserta terdaftar di dalam sistem CBT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportStudentsToExcel(students, 'Daftar_Siswa_CBT_SMK_KAWULA_INDONESIA.xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor ke Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Manual</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari Nama, NISN, atau Kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
          >
            <option value="ALL">Semua Kelas ({uniqueClasses.length})</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
          >
            <option value="ALL">Semua Jurusan ({uniqueMajors.length})</option>
            {uniqueMajors.map((mjr) => (
              <option key={mjr} value={mjr}>
                {mjr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs sm:text-sm">
            <thead className="bg-emerald-50/80 font-semibold text-emerald-950">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NISN / Akun</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas &amp; Jurusan</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Sesi &amp; Ruang</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{index + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {s.nisn}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {s.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-emerald-900 block">{s.classGroup}</span>
                      <span className="text-[11px] text-gray-500">{s.major}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">
                      {s.password}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      <div>{s.session || 'Sesi 1'}</div>
                      <div className="text-[11px] text-gray-400">{s.room || 'Lab Komputer'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintingCardStudent(s)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Cetak Kartu Ujian"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Data Siswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <div className="relative group/delete inline-flex">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus siswa ${s.name} (${s.nisn})? Data peserta akan dihapus dari sistem CBT.`)) {
                                onDeleteStudent(s.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                            aria-label={`Hapus data siswa ${s.name} (${s.nisn})`}
                            title={`Hapus data siswa ${s.name} (${s.nisn})`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Descriptive Hover Tooltip */}
                          <div 
                            role="tooltip"
                            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover/delete:opacity-100 transition-all duration-150 flex flex-col w-64 p-3 bg-gray-900/95 text-white rounded-xl shadow-xl border border-gray-700/80 z-50 text-left backdrop-blur-xs"
                          >
                            <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Rekaman Siswa</span>
                            </div>
                            <p className="text-[11px] text-gray-200 mt-1 leading-snug">
                              Menghapus data peserta <strong>{s.name}</strong> (NISN: {s.nisn} &bull; {s.classGroup}) secara permanen dari sistem CBT.
                            </p>
                            <span className="text-[10px] text-amber-300 font-medium mt-1.5 flex items-center gap-1">
                              &bull; Siswa tidak akan dapat login ke ujian
                            </span>
                            {/* Arrow */}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900/95" />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs sm:text-sm">
                    Tidak ada siswa yang sesuai dengan filter atau kata kunci.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Peserta Ujian'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
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
                    NISN (User Login)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Contoh: 0071234501"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Password Ujian
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Contoh: siswa123"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap siswa..."
                  className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classGroup || ''}
                    onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                    placeholder="Contoh: XII TKJ 1"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Jurusan / Kompetensi
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.major || ''}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Contoh: Teknik Komputer"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Sesi Ujian
                  </label>
                  <input
                    type="text"
                    value={formData.session || 'Sesi 1'}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    placeholder="Contoh: Sesi 1"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Ruang Ujian
                  </label>
                  <input
                    type="text"
                    value={formData.room || 'Lab Komputer 1'}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Contoh: Lab Komputer 1"
                    className="w-full text-xs sm:text-sm p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kartu Ujian Siswa Modal */}
      {printingCardStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Kartu Peserta Ujian CBT
              </span>
              <button
                type="button"
                onClick={() => setPrintingCardStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Card Area */}
            <div className="border-2 border-emerald-600 rounded-xl p-4 bg-emerald-50/30 space-y-3 font-sans">
              <div className="text-center border-b border-emerald-200 pb-2">
                <h5 className="font-bold text-gray-900 text-sm">SMK KAWULA INDONESIA</h5>
                <p className="text-[11px] font-semibold text-emerald-800">KARTU LOGIN PESERTA UJIAN CBT</p>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama Siswa:</span>
                  <span className="font-bold text-gray-900">{printingCardStudent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kelas / Jurusan:</span>
                  <span className="font-medium text-gray-800">{printingCardStudent.classGroup} - {printingCardStudent.major}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sesi / Ruang:</span>
                  <span className="font-medium text-gray-800">{printingCardStudent.session || 'Sesi 1'} / {printingCardStudent.room || 'Lab'}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-300 text-center space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Kredensial Login Siswa</div>
                <div className="text-xs">Username / NISN: <strong className="font-mono text-emerald-900 text-sm">{printingCardStudent.nisn}</strong></div>
                <div className="text-xs">Password: <strong className="font-mono text-emerald-900 text-sm">{printingCardStudent.password}</strong></div>
              </div>

              <p className="text-[10px] text-gray-400 text-center italic">
                *Simpan kartu ini dengan baik dan jangan beritahukan password kepada orang lain.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Kartu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
