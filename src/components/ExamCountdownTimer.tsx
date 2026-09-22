import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, AlertTriangle, ShieldAlert, CheckCircle2, 
  Volume2, VolumeX, Sparkles, AlertCircle 
} from 'lucide-react';
import { ExamSubject, Student } from '../types';
import { 
  calculateExamTimeRemaining, 
  formatTimeComponents, 
  ExamTimeRemaining,
  clearExamTimer 
} from '../utils/examTimer';

interface ExamCountdownTimerProps {
  exam: ExamSubject;
  student: Student;
  isActive: boolean;
  isCompleted?: boolean;
  onAutoSubmit: () => void;
  className?: string;
}

export const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({
  exam,
  student,
  isActive,
  isCompleted = false,
  onAutoSubmit,
  className = '',
}) => {
  const [timeData, setTimeData] = useState<ExamTimeRemaining>(() => 
    calculateExamTimeRemaining(student.id, exam)
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasAutoSubmittedRef = useRef(false);
  const hasWarnedCriticalRef = useRef(false);

  // Play subtle browser audio cue using Web Audio API
  const playChime = (frequency = 587.33, duration = 0.35) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Safe fallback if audio blocked
    }
  };

  // Live timer interval
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const checkTime = () => {
      const remaining = calculateExamTimeRemaining(student.id, exam);
      setTimeData(remaining);

      // Warning beep when entering critical zone (<= 5 min)
      if (remaining.remainingSeconds <= 300 && remaining.remainingSeconds > 0 && !hasWarnedCriticalRef.current) {
        hasWarnedCriticalRef.current = true;
        playChime(659.25, 0.4); // E5 note
      }

      // Time expired: Trigger auto submit
      if (remaining.remainingSeconds <= 0 && !hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        playChime(440, 0.8); // A4 note
        clearExamTimer(student.id, exam.id);
        onAutoSubmit();
      }
    };

    // Run initial check
    checkTime();

    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [isActive, isCompleted, exam, student.id, onAutoSubmit]);

  const timeComp = formatTimeComponents(timeData.remainingSeconds);
  const isCritical = timeData.urgency === 'critical' && !timeData.isExpired;
  const isWarning = timeData.urgency === 'warning' && !timeData.isExpired;

  // Visual themes based on urgency
  let containerBg = 'bg-white border-emerald-300 ring-2 ring-emerald-100/70';
  let clockBg = 'bg-emerald-800 text-white';
  let clockSubColor = 'text-emerald-200';
  let progressBarBg = 'bg-emerald-600';
  let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';

  if (timeData.isExpired) {
    containerBg = 'bg-rose-50 border-rose-300 ring-2 ring-rose-200';
    clockBg = 'bg-rose-800 text-white';
    clockSubColor = 'text-rose-200';
    progressBarBg = 'bg-rose-600';
    statusBadge = 'bg-rose-100 text-rose-900 border-rose-300';
  } else if (isCritical) {
    containerBg = 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-200/80';
    clockBg = 'bg-rose-700 text-white animate-pulse';
    clockSubColor = 'text-rose-200';
    progressBarBg = 'bg-rose-600';
    statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (isWarning) {
    containerBg = 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100';
    clockBg = 'bg-amber-700 text-white';
    clockSubColor = 'text-amber-200';
    progressBarBg = 'bg-amber-500';
    statusBadge = 'bg-amber-100 text-amber-900 border-amber-200';
  }

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${containerBg} ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
            <span className={`w-2 h-2 rounded-full ${
              timeData.isExpired 
                ? 'bg-rose-600' 
                : isCritical 
                ? 'bg-rose-600 animate-ping' 
                : 'bg-emerald-600 animate-ping'
            }`}></span>
            {timeData.isExpired
              ? 'Waktu Telah Habis'
              : isCritical
              ? 'Waktu Kritis (< 5 Menit)'
              : isWarning
              ? 'Peringatan Sisa Waktu (< 15 Menit)'
              : 'Waktu Ujian Berjalan'}
          </span>
          <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Total {exam.durationMinutes} Menit
          </span>
        </div>

        {/* Audio Mute/Unmute toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-800 transition-colors self-end sm:self-auto"
          title={soundEnabled ? 'Matikan nada peringatan' : 'Nyalakan nada peringatan'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Alarm Aktif</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-gray-400" />
              <span>Alarm Senyap</span>
            </>
          )}
        </button>
      </div>

      {/* Main Countdown Cards Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-white/70 p-4 rounded-xl border border-gray-100 shadow-2xs">
        {/* Left: Summary text */}
        <div className="space-y-1 text-center md:text-left">
          <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center justify-center md:justify-start gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Hitung Mundur Waktu Ujian</span>
          </h4>
          <p className="text-xs text-gray-500">
            {timeData.isExpired 
              ? 'Sesi pengerjaan soal telah berakhir dan otomatis dikirim ke sistem.'
              : 'Perhatikan sisa waktu sebelum menekan tombol Kirim di Google Form.'}
          </p>
        </div>

        {/* Right: Digital Flip Cards */}
        <div className="flex items-center justify-center gap-2">
          {/* Hours Card */}
          <div className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] h-[68px] sm:h-[76px] rounded-xl shadow-xs border border-white/20 ${clockBg}`}>
            <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none">
              {timeComp.hours}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${clockSubColor}`}>
              Jam
            </span>
          </div>

          <span className="text-2xl font-black text-gray-400 font-mono pb-3">:</span>

          {/* Minutes Card */}
          <div className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] h-[68px] sm:h-[76px] rounded-xl shadow-xs border border-white/20 ${clockBg}`}>
            <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none">
              {timeComp.minutes}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${clockSubColor}`}>
              Menit
            </span>
          </div>

          <span className="text-2xl font-black text-gray-400 font-mono pb-3">:</span>

          {/* Seconds Card */}
          <div className={`flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] h-[68px] sm:h-[76px] rounded-xl shadow-xs border border-white/20 ${clockBg}`}>
            <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider leading-none">
              {timeComp.seconds}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 ${clockSubColor}`}>
              Detik
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
          <span>
            Sisa waktu:{' '}
            <strong className="text-gray-900 font-mono">{timeComp.formatted}</strong>{' '}
            ({Math.round(timeData.percentRemaining)}%)
          </span>
          <span className="text-[11px] text-gray-500">
            {timeData.isExpired 
              ? 'Waktu habis' 
              : `Berakhir otomatis pada ${exam.endTime || 'akhir durasi'}`}
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/70 shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressBarBg}`}
            style={{ width: `${timeData.percentRemaining}%` }}
          />
        </div>
      </div>

      {/* Urgency Notification Banners */}
      {isCritical && (
        <div className="mt-3 p-3 rounded-xl bg-rose-100/90 border border-rose-300 text-xs text-rose-900 font-medium flex items-start gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>PERINGATAN WAKTU KRITIS:</strong> Sisa waktu kurang dari 5 menit! Segera periksa jawaban dan pastikan tombol <strong>KIRIM (SUBMIT)</strong> pada formulir Google Form telah diklik.
          </div>
        </div>
      )}

      {timeData.isExpired && (
        <div className="mt-3 p-3 rounded-xl bg-rose-200/90 border border-rose-400 text-xs text-rose-950 font-medium flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>WAKTU TELAH HABIS:</strong> Sesi ujian otomatis ditutup dan status pengerjaan telah disubmit ke sistem CBT.
          </div>
        </div>
      )}
    </div>
  );
};
