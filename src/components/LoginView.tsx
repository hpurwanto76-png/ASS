import React, { useState } from 'react';
import { School, User, Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, AdminUser, Student } from '../types';

interface LoginViewProps {
  settings: AppSettings;
  students: Student[];
  adminUser: AdminUser;
  onLoginSuccess: (role: 'admin' | 'student', user: AdminUser | Student) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  students,
  adminUser,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  
  // Student Login State
  const [nisn, setNisn] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Admin Login State
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const triggerShake = () => {
    setShakeKey((prev) => prev + 1);
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nisn.trim() || !studentPassword.trim()) {
      setErrorMessage('Harap masukkan NISN dan Password');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const trimmedNisn = nisn.trim().toLowerCase();
      const trimmedPassword = studentPassword.trim();

      // Flexible matching for NISN (handles leading zero differences from Excel or manual entry)
      const matched = students.find((s) => {
        const sNisn = String(s.nisn).trim().toLowerCase();
        const nisnMatch = 
          sNisn === trimmedNisn ||
          sNisn.replace(/^0+/, '') === trimmedNisn.replace(/^0+/, '') ||
          sNisn.padStart(10, '0') === trimmedNisn.padStart(10, '0');

        if (!nisnMatch) return false;
        return String(s.password).trim() === trimmedPassword;
      });

      if (matched) {
        if (matched.status === 'Nonaktif') {
          setErrorMessage('Akun siswa ini sedang dinonaktifkan oleh administrator.');
          triggerShake();
          setIsLoading(false);
          return;
        }
        onLoginSuccess('student', matched);
      } else {
        // Check if NISN exists to provide specific feedback
        const nisnExists = students.some((s) => {
          const sNisn = String(s.nisn).trim().toLowerCase();
          return (
            sNisn === trimmedNisn ||
            sNisn.replace(/^0+/, '') === trimmedNisn.replace(/^0+/, '') ||
            sNisn.padStart(10, '0') === trimmedNisn.padStart(10, '0')
          );
        });

        if (nisnExists) {
          setErrorMessage('Password salah. Pastikan memasukkan password yang sesuai dengan data form Excel.');
        } else {
          setErrorMessage(`NISN "${nisn.trim()}" tidak ditemukan. Pastikan data siswa telah diimpor melalui form Excel di panel Admin.`);
        }
        triggerShake();
      }
      setIsLoading(false);
    }, 300);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !adminPassword.trim()) {
      setErrorMessage('Harap masukkan Username dan Password');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const trimmedUser = username.trim();
      if (
        trimmedUser === adminUser.username &&
        adminPassword === adminUser.password
      ) {
        onLoginSuccess('admin', adminUser);
      } else {
        setErrorMessage('Username atau Password Administrator salah.');
        triggerShake();
      }
      setIsLoading(false);
    }, 350);
  };

  const handleQuickStudent = (sampleStudent: Student) => {
    setNisn(sampleStudent.nisn);
    setStudentPassword(sampleStudent.password);
    setErrorMessage('');
  };

  const handleQuickAdmin = () => {
    setUsername(adminUser.username);
    setAdminPassword(adminUser.password);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto my-auto">
        {/* School Header Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100 mb-3.5">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {settings.schoolName}
          </h1>
          <p className="text-sm font-semibold text-emerald-800 mt-1 uppercase tracking-wider">
            {settings.examName}
          </p>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-medium">
            <span>Tahun Pelajaran {settings.academicYear}</span>
            <span>&bull;</span>
            <span>Semester {settings.semester}</span>
          </div>
        </div>

        {/* Main Card with Smooth Shake Animation on error */}
        <motion.div
          key={`login-card-${shakeKey}`}
          animate={
            shakeKey > 0
              ? {
                  x: [0, -12, 12, -9, 9, -5, 5, -2, 2, 0],
                  transition: {
                    duration: 0.5,
                    ease: 'easeInOut',
                  },
                }
              : { x: 0 }
          }
          className={`bg-white rounded-2xl shadow-sm border transition-colors duration-200 overflow-hidden ${
            errorMessage ? 'border-rose-300 ring-4 ring-rose-100/70' : 'border-emerald-200'
          }`}
        >
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 p-1.5 bg-emerald-100/60 m-3 rounded-xl border border-emerald-200/70">
            <button
              id="tab-login-student"
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Login Siswa</span>
            </button>
            <button
              id="tab-login-admin"
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Admin</span>
            </button>
          </div>

          <div className="p-6 pt-3">
            {/* Error Notification */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs sm:text-sm text-rose-800 shadow-2xs"
                >
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Student Login Form */}
            {activeTab === 'student' && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label htmlFor="student-nisn" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    NISN (Nomor Induk Siswa Nasional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="student-nisn"
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="Masukkan 10 digit NISN..."
                      className="block w-full pl-10 pr-3 py-2.5 text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="student-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Password Ujian
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="student-password"
                      type={showStudentPassword ? 'text' : 'password'}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Masukkan password ujian..."
                      className="block w-full pl-10 pr-10 py-2.5 text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-900 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-submit-student-login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Memproses...' : 'Masuk Portal Siswa'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo Selector for Students */}
                <div className="mt-4 pt-4 border-t border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">
                      Pilih Akun Siswa (Tes Cepat):
                    </p>
                    <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                      Sinkron Excel ({students.length} Akun)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {students.slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickStudent(s)}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg transition-colors font-medium text-left flex items-center gap-1"
                        title={`NISN: ${s.nisn} | Password: ${s.password}`}
                      >
                        <span className="font-bold">{s.name.split(' ')[0]}</span>
                        <span className="text-gray-500 font-mono text-[11px]">({s.nisn})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label htmlFor="admin-username" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Username Administrator
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input
                      id="admin-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username admin..."
                      className="block w-full pl-10 pr-3 py-2.5 text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Password Administrator
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="admin-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Password admin..."
                      className="block w-full pl-10 pr-10 py-2.5 text-sm bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-900 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-submit-admin-login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Memvalidasi...' : 'Masuk Panel Admin'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo for Admin */}
                <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Default: admin / admin123</span>
                  <button
                    type="button"
                    onClick={handleQuickAdmin}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2"
                  >
                    Gunakan Akun Default
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Announcement Box */}
        {settings.announcement && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-100/80 border border-emerald-200/90 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Pengumuman: </span>
              {settings.announcement}
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-emerald-800/80 mt-6">
        &copy; {new Date().getFullYear()} {settings.schoolName}. Aplikasi CBT terintegrasi Google Form &amp; Google Spreadsheet.
      </div>
    </div>
  );
};
