import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Clock, ShieldAlert, CheckCircle, 
  AlertTriangle, KeyRound, Maximize2, Minimize2, FileText, Check 
} from 'lucide-react';
import { ExamSubject, Student } from '../types';
import { 
  startExamTimer, 
  clearExamTimer, 
  calculateExamTimeRemaining 
} from '../utils/examTimer';

interface CbtExamModalProps {
  exam: ExamSubject;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onFinishExam: (examId: string) => void;
  isCompleted?: boolean;
}

export const CbtExamModal: React.FC<CbtExamModalProps> = ({
  exam,
  student,
  isOpen,
  onClose,
  onFinishExam,
  isCompleted = false,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isTokenVerified, setIsTokenVerified] = useState(!exam.token);
  const [tokenError, setTokenError] = useState('');
  const [hasOpenedForm, setHasOpenedForm] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [viewMode, setViewMode] = useState<'info' | 'iframe'>('info');
  
  // Timer state (countdown in seconds based on durationMinutes)
  const [timeLeft, setTimeLeft] = useState(() => {
    return calculateExamTimeRemaining(student.id, exam).remainingSeconds;
  });

  useEffect(() => {
    if (!isOpen) return;
    
    // If no token required or already completed
    if (!exam.token || isCompleted) {
      setIsTokenVerified(true);
      if (!isCompleted) {
        startExamTimer(student.id, exam.id);
      }
    } else {
      setIsTokenVerified(false);
      setTokenInput('');
      setTokenError('');
    }

    setHasOpenedForm(false);
    setShowConfirmFinish(false);
    const initialTime = calculateExamTimeRemaining(student.id, exam).remainingSeconds;
    setTimeLeft(initialTime);
  }, [isOpen, exam, isCompleted, student.id]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !isTokenVerified || isCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      const remaining = calculateExamTimeRemaining(student.id, exam).remainingSeconds;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isTokenVerified, isCompleted, timeLeft, student.id, exam]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam.token) {
      setIsTokenVerified(true);
      return;
    }

    if (tokenInput.trim().toUpperCase() === exam.token.trim().toUpperCase()) {
      setIsTokenVerified(true);
      setTokenError('');
      startExamTimer(student.id, exam.id);
    } else {
      setTokenError('Token ujian yang dimasukkan salah. Silakan tanyakan ke Pengawas Ruang.');
    }
  };

  const handleOpenGoogleForm = () => {
    setHasOpenedForm(true);
    startExamTimer(student.id, exam.id);
    window.open(exam.googleFormUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCompleteSubmission = () => {
    clearExamTimer(student.id, exam.id);
    onFinishExam(exam.id);
    setShowConfirmFinish(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  {exam.name}
                </h3>
                <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded-full font-mono">
                  {exam.code}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {student.name} &bull; NISN: {student.nisn} &bull; {student.classGroup}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isTokenVerified && (
              <div className="flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-600 font-mono text-sm">
                <Clock className="w-4 h-4 text-emerald-300" />
                <span className="font-bold">{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#f9fdfa]">
          {/* If already completed */}
          {isCompleted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">Ujian Telah Selesai</h4>
                <p className="text-sm text-gray-600 max-w-md mx-auto mt-1">
                  Anda sudah menyelesaikan pengerjaan mata pelajaran <strong>{exam.name}</strong>. Data jawaban Anda telah terekam di sistem.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          ) : !isTokenVerified ? (
            /* Token Verification Form */
            <div className="max-w-md mx-auto py-6">
              <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Masukkan Token Ujian</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Silakan minta Token Ujian kepada Pengawas Ruang ujian Anda sebelum memulai pengerjaan.
                  </p>
                </div>

                <form onSubmit={handleVerifyToken} className="space-y-4">
                  <div>
                    <label htmlFor="input-token-exam" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                      Token Ujian
                    </label>
                    <input
                      id="input-token-exam"
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                      placeholder="CONTOH: BINDO26"
                      className="block w-full text-center tracking-widest font-mono font-bold text-lg py-3 px-4 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase text-emerald-950"
                      autoFocus
                    />
                    {tokenError && (
                      <p className="text-xs text-rose-600 mt-2 text-center font-medium">
                        {tokenError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span>Durasi Pengerjaan:</span>
                    <span className="font-semibold text-gray-800">{exam.durationMinutes} Menit</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm"
                  >
                    Konfirmasi Token &amp; Mulai Ujian
                  </button>
                </form>

                {exam.token && (
                  <p className="text-[11px] text-gray-400 text-center mt-3">
                    *Token uji coba untuk mapel ini: <span className="font-mono text-emerald-700 font-bold">{exam.token}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Active Exam Room */
            <div className="space-y-6">
              {/* Petunjuk & Langkah Pengerjaan */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2.5">
                  <ShieldAlert className="w-5 h-5 text-emerald-700" />
                  Petunjuk Pengerjaan Ujian CBT (Google Form)
                </div>
                <ol className="text-xs sm:text-sm text-emerald-900/90 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                  <li>
                    Klik tombol hijau <strong>"Buka Soal Ujian (Google Form)"</strong> di bawah. Soal ujian akan terbuka di tab baru atau layar penuh.
                  </li>
                  <li>
                    Pastikan Anda mengisi identitas (Nama, Kelas, No. Peserta/NISN) di Google Form sesuai dengan data Anda.
                  </li>
                  <li>
                    Jawab seluruh butir soal dengan teliti dan jujur sebelum waktu ujian berakhir.
                  </li>
                  <li>
                    Setelah semua soal selesai, pastikan Anda menekan tombol <strong>"KIRIM / SUBMIT"</strong> pada Google Form sampai muncul konfirmasi terima.
                  </li>
                  <li>
                    Kembali ke halaman portal CBT ini lalu klik tombol <strong>"Konfirmasi Selesai Ujian"</strong> di bagian bawah untuk menandai status ujian Anda telah tuntas.
                  </li>
                </ol>
              </div>

              {/* Main Action Bar */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Sisa Waktu: {formatTimer(timeLeft)}
                </div>

                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    Lembar Soal Ujian: {exam.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                    Klik tombol di bawah untuk membuka formulir soal Google Form yang telah disiapkan oleh panitia ujian.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    id="btn-open-google-form"
                    onClick={handleOpenGoogleForm}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg ring-2 ring-emerald-300"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Buka Soal Ujian (Google Form)
                  </button>

                  <button
                    onClick={() => setViewMode(viewMode === 'iframe' ? 'info' : 'iframe')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    {viewMode === 'iframe' ? (
                      <>
                        <Minimize2 className="w-4 h-4 text-emerald-700" />
                        Tutup Tampilan Tersemat
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4 text-emerald-700" />
                        Tampilkan Soal di Halaman Ini
                      </>
                    )}
                  </button>
                </div>

                {hasOpenedForm && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Form telah dibuka di tab baru. Setelah Anda mengirimkan jawaban di Google Form, klik tombol konfirmasi selesai di bawah.</span>
                  </div>
                )}
              </div>

              {/* Embedded Frame View (Optional) */}
              {viewMode === 'iframe' && (
                <div className="bg-white rounded-2xl border border-emerald-300 overflow-hidden shadow-xs">
                  <div className="bg-emerald-100/70 px-4 py-2 text-xs font-semibold text-emerald-900 flex items-center justify-between border-b border-emerald-200">
                    <span>Pratinjau Lembar Soal Google Form</span>
                    <a
                      href={exam.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      Buka di Tab Baru <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="w-full h-[550px] relative bg-gray-50">
                    <iframe
                      src={exam.googleFormUrl}
                      title={`Soal ${exam.name}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Submission Confirmation Card */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-gray-900 text-sm">
                    Sudah selesai mengerjakan dan mengirim Google Form?
                  </h5>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Klik tombol konfirmasi untuk menyelesaikan sesi ujian Anda.
                  </p>
                </div>

                <button
                  id="btn-confirm-finish-exam"
                  onClick={() => setShowConfirmFinish(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Konfirmasi Selesai Ujian
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-emerald-50 px-5 py-3 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-medium">
          <span>Pengawas: Ruang {student.room || 'Lab Komputer'} ({student.session || 'Sesi 1'})</span>
          <button
            onClick={onClose}
            className="text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">
                Konfirmasi Penyelesaian Ujian
              </h4>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Apakah Anda yakin sudah menekan tombol <strong>"Kirim / Submit"</strong> di Google Form mata pelajaran <strong>{exam.name}</strong>?
                <br />
                Setelah dikonfirmasi, Anda tidak dapat mengubah jawaban Anda lagi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmFinish(false)}
                className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Belum, Cek Lagi
              </button>
              <button
                type="button"
                onClick={handleCompleteSubmission}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Ya, Sudah Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
