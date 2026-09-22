import { ExamSubject } from '../types';

const TIMER_PREFIX = 'cbt_exam_timer_start_';

/**
 * Gets the stored start timestamp (in ms) for a specific student and exam.
 */
export function getExamStartTime(studentId: string, examId: string): number | null {
  try {
    const val = localStorage.getItem(`${TIMER_PREFIX}${studentId}_${examId}`);
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Starts or retrieves the exam timer timestamp for a student.
 */
export function startExamTimer(studentId: string, examId: string): number {
  try {
    const existing = getExamStartTime(studentId, examId);
    if (existing && !isNaN(existing)) return existing;
    const now = Date.now();
    localStorage.setItem(`${TIMER_PREFIX}${studentId}_${examId}`, now.toString());
    return now;
  } catch {
    return Date.now();
  }
}

/**
 * Clears the stored timer for a student and exam (e.g., after completion).
 */
export function clearExamTimer(studentId: string, examId: string): void {
  try {
    localStorage.removeItem(`${TIMER_PREFIX}${studentId}_${examId}`);
  } catch {
    // Ignore storage errors
  }
}

export interface ExamTimeRemaining {
  remainingSeconds: number;
  totalSeconds: number;
  elapsedSeconds: number;
  hasStarted: boolean;
  percentRemaining: number;
  isExpired: boolean;
  urgency: 'normal' | 'warning' | 'critical';
}

/**
 * Calculates real-time remaining time for an exam.
 */
export function calculateExamTimeRemaining(studentId: string, exam: ExamSubject): ExamTimeRemaining {
  const totalSeconds = Math.max(1, (exam.durationMinutes || 90) * 60);
  const startTime = getExamStartTime(studentId, exam.id);

  let remainingSeconds = totalSeconds;
  let elapsedSeconds = 0;
  let hasStarted = false;

  if (startTime) {
    hasStarted = true;
    elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  } else {
    // Check if current real-time fits into today's exam schedule
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      if (exam.date === todayStr && exam.endTime) {
        const [endH, endM] = exam.endTime.split(':').map(Number);
        const endTimestamp = new Date();
        endTimestamp.setHours(endH, endM, 0, 0);
        const diffSec = Math.floor((endTimestamp.getTime() - Date.now()) / 1000);
        
        if (diffSec > 0 && diffSec <= totalSeconds) {
          remainingSeconds = diffSec;
          elapsedSeconds = totalSeconds - diffSec;
          hasStarted = true;
        }
      }
    } catch {
      // Fallback
    }
  }

  const percentRemaining = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  const isExpired = remainingSeconds <= 0;

  let urgency: 'normal' | 'warning' | 'critical' = 'normal';
  if (remainingSeconds <= 300) {
    // 5 minutes or less
    urgency = 'critical';
  } else if (remainingSeconds <= 900) {
    // 15 minutes or less
    urgency = 'warning';
  }

  return {
    remainingSeconds,
    totalSeconds,
    elapsedSeconds,
    hasStarted,
    percentRemaining,
    isExpired,
    urgency,
  };
}

export function formatTimeComponents(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const remainingSec = s % 60;

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(remainingSec).padStart(2, '0'),
    formatted: hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`,
  };
}
