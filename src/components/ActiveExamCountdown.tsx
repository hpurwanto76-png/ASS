import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, PlayCircle, BookOpen, CheckCircle2, 
  Calendar, ShieldAlert, Sparkles, ChevronRight 
} from 'lucide-react';
import { ExamSubject, Student } from '../types';
import { 
  calculateExamTimeRemaining, 
  formatTimeComponents, 
  ExamTimeRemaining 
} from '../utils/examTimer';

interface ActiveExamCountdownBannerProps {
  activeExams: ExamSubject[];
  student: Student;
  onOpenExam: (exam: ExamSubject) => void;
}

export const ActiveExamCountdownBanner: React.FC<ActiveExamCountdownBannerProps> = ({
  activeExams,
  student,
  onOpenExam,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    activeExams[0]?.id || ''
  );
  const [tick, setTick] = useState(0);

  // Re-sync selected exam if activeExams list changes
  useEffect(() => {
    if (activeExams.length > 0 && !activeExams.some((e) => e.id === selectedExamId)) {
      setSelectedExamId(activeExams[0].id);
    }
  }, [activeExams, selectedExamId]);

  // Update every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (activeExams.length === 0) return null;

  const currentExam = activeExams.find((e) => e.id === selectedExamId) || activeExams[0];
  if (!currentExam) return null;

  const timeData: ExamTimeRemaining = calculateExamTimeRemaining(student.id, currentExam);
  const timeComp = formatTimeComponents(timeData.remainingSeconds);

  // Determine styling based on urgency
  const isCritical = timeData.urgency === 'critical';
  const isWarning = timeData.urgency === 'warning';

  let containerBg = 'bg-white border-emerald-300 ring-2 ring-emerald-100/80';
  let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let progressBarColor = 'bg-emerald-600';
  let clockBg = 'bg-emerald-800 text-white';
  let clockLabelColor = 'text-emerald-200';

  if (timeData.isExpired) {
    containerBg = 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-100';
    badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
    progressBarColor = 'bg-rose-600';
    clockBg = 'bg-rose-800 text-white';
    clockLabelColor = 'text-rose-200';
  } else if (isCritical) {
    containerBg = 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200';
    badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
    progressBarColor = 'bg-rose-600';
    clockBg = 'bg-rose-700 text-white animate-pulse';
    clockLabelColor = 'text-rose-200';
  } else if (isWarning) {
    containerBg = 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-100';
    badgeBg = 'bg-amber-100 text-amber-900 border-amber-200';
    progressBarColor = 'bg-amber-500';
    clockBg = 'bg-amber-700 text-white';
    clockLabelColor = 'text-amber-200';
  }

  return (
    <div className={`rounded-2xl p-5 sm:p-6 border shadow-sm transition-all ${containerBg}`}>
      {/* Top Bar: Selector if multiple active exams */}
      {activeExams.length > 1 && (
        <div className="mb-4 pb-3 border-b border-emerald-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Pilih Mapel Aktif:</span>
          {activeExams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedExamId(exam.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                exam.id === currentExam.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {exam.name} ({exam.code})
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Column: Exam Identity & Urgency Badge */}
        <div className="space-y-2.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
              <span className={`w-2 h-2 rounded-full ${timeData.isExpired ? 'bg-rose-600' : isCritical ? 'bg-rose-600 animate-ping' : 'bg-emerald-600 animate-ping'}`}></span>
              {timeData.isExpired
                ? 'Waktu Ujian Habis'
                : isCritical
                ? 'Peringatan: Waktu Kritis!'
                : isWarning
                ? 'Waktu Sedang Berjalan (Kurang Dari 15 Menit)'
                : 'Ujian Sedang Berlangsung'}
            </span>

            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md">
              {currentExam.code}
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              {currentExam.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{currentExam.gradeLevel} &bull; {currentExam.major}</span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Durasi: {currentExam.durationMinutes} Menit ({currentExam.startTime} - {currentExam.endTime} WIB)
              </span>
            </p>
          </div>

          {/* Critical notification message if <= 5 min */}
          {isCritical && !timeData.isExpired && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-100/80 border border-rose-300 text-xs text-rose-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Perhatian:</strong> Sisa waktu kurang dari 5 menit! Segera periksa jawaban dan klik tombol <strong>KIRIM/SUBMIT</strong> di Google Form.
              </span>
            </div>
          )}

          {timeData.isExpired && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-100/80 border border-rose-300 text-xs text-rose-900 font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Waktu pengerjaan telah berakhir. Silakan pastikan Google Form telah disubmit dan klik konfirmasi selesai.
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Visual Flip Countdown Clocks */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          {/* Digital Timer Cards */}
          <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
            {/* Hours */}
            <div className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] h-[72px] sm:h-[80px] rounded-xl shadow-xs border border-white/20 ${clockBg}`}>
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none">
                {timeComp.hours}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${clockLabelColor}`}>
                Jam
              </span>
            </div>

            <span className="text-2xl font-black text-gray-400 font-mono pb-4">:</span>

            {/* Minutes */}
            <div className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] h-[72px] sm:h-[80px] rounded-xl shadow-xs border border-white/20 ${clockBg}`}>
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none">
                {timeComp.minutes}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${clockLabelColor}`}>
                Menit
              </span>
            </div>

            <span className="text-2xl font-black text-gray-400 font-mono pb-4">:</span>

            {/* Seconds */}
            <div className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] h-[72px] sm:h-[80px] rounded-xl shadow-xs border border-white/20 ${clockBg}`}>
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none">
                {timeComp.seconds}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${clockLabelColor}`}>
                Detik
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onOpenExam(currentExam)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all whitespace-nowrap active:scale-[0.99]"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Buka / Kerjakan Soal</span>
            <ChevronRight className="w-4 h-4 text-emerald-200" />
          </button>
        </div>
      </div>

      {/* Visual Horizontal Progress Bar */}
      <div className="mt-5 pt-4 border-t border-emerald-100">
        <div className="flex items-center justify-between text-xs text-gray-600 font-medium mb-1.5">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            Sisa Waktu: <strong>{timeComp.formatted}</strong> dari total {currentExam.durationMinutes} menit
          </span>
          <span className="font-mono font-bold text-gray-700">
            {Math.round(timeData.percentRemaining)}% Tersisa
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/70 shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressBarColor}`}
            style={{ width: `${timeData.percentRemaining}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface ActiveExamCardTimerProps {
  exam: ExamSubject;
  student: Student;
}

export const ActiveExamCardTimer: React.FC<ActiveExamCardTimerProps> = ({ exam, student }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeData = calculateExamTimeRemaining(student.id, exam);
  const timeComp = formatTimeComponents(timeData.remainingSeconds);

  const isCritical = timeData.urgency === 'critical';
  const isWarning = timeData.urgency === 'warning';

  let timerColor = 'text-emerald-900 bg-emerald-100/80 border-emerald-300';
  let barColor = 'bg-emerald-600';

  if (timeData.isExpired) {
    timerColor = 'text-rose-900 bg-rose-100 border-rose-300';
    barColor = 'bg-rose-600';
  } else if (isCritical) {
    timerColor = 'text-rose-900 bg-rose-100 border-rose-300 animate-pulse';
    barColor = 'bg-rose-600';
  } else if (isWarning) {
    timerColor = 'text-amber-900 bg-amber-100 border-amber-300';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-200/90 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          Hitung Mundur Sisa Waktu
        </span>
        <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${timerColor}`}>
          {timeData.isExpired ? 'Waktu Habis' : timeComp.formatted}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${barColor}`}
          style={{ width: `${timeData.percentRemaining}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
        <span>{timeData.hasStarted ? 'Pengerjaan berlangsung' : 'Jadwal sesi aktif'}</span>
        <span className="font-mono">{Math.round(timeData.percentRemaining)}% tersisa</span>
      </div>
    </div>
  );
};
