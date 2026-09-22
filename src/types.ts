export interface Student {
  id: string;
  nisn: string;
  name: string;
  classGroup: string;
  major: string;
  password: string;
  session?: string;
  room?: string;
  status?: 'Aktif' | 'Nonaktif';
}

export interface ExamSubject {
  id: string;
  code: string;
  name: string;
  gradeLevel: string;
  major: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  googleFormUrl: string;
  googleSpreadsheetUrl?: string;
  token?: string;
  isActive: boolean;
  status: 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai';
}

export interface AppSettings {
  schoolName: string;
  schoolSubtitle: string;
  examName: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  schoolAddress: string;
  masterSpreadsheetUrl: string;
  enableToken: boolean;
  announcement: string;
}

export interface AdminUser {
  username: string;
  name: string;
  password: string;
  role: 'admin';
}

export interface StudentExamProgress {
  studentId: string;
  nisn: string;
  examId: string;
  examName: string;
  status: 'Belum Mulai' | 'Sedang Mengerjakan' | 'Sudah Selesai';
  startedAt?: string;
  completedAt?: string;
  tokenUsed?: string;
}

export interface UserSession {
  role: 'admin' | 'student';
  data: AdminUser | Student;
}
