import React, { useState, useEffect } from 'react';
import { 
  AppSettings, AdminUser, Student, ExamSubject, 
  StudentExamProgress, UserSession 
} from './types';
import { 
  getAppSettings, saveAppSettings, getAdminUser, saveAdminUser, 
  getStudents, saveStudents, getExams, saveExams, 
  getExamProgress, saveExamProgress, getCurrentSession, 
  saveCurrentSession, resetAllDataToDefault 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings);
  const [adminUser, setAdminUser] = useState<AdminUser>(getAdminUser);
  const [students, setStudents] = useState<Student[]>(getStudents);
  const [exams, setExams] = useState<ExamSubject[]>(getExams);
  const [examProgress, setExamProgress] = useState<StudentExamProgress[]>(getExamProgress);
  const [session, setSession] = useState<UserSession | null>(getCurrentSession);

  // Sync document title with settings
  useEffect(() => {
    document.title = `${settings.schoolName} - ${settings.examName}`;
  }, [settings.schoolName, settings.examName]);

  const handleLoginSuccess = (role: 'admin' | 'student', user: AdminUser | Student) => {
    const newSession: UserSession = { role, data: user };
    setSession(newSession);
    saveCurrentSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
    saveCurrentSession(null);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveAppSettings(newSettings);
  };

  const handleUpdateAdmin = (newAdmin: AdminUser) => {
    setAdminUser(newAdmin);
    saveAdminUser(newAdmin);
    if (session && session.role === 'admin') {
      const updatedSession: UserSession = { role: 'admin', data: newAdmin };
      setSession(updatedSession);
      saveCurrentSession(updatedSession);
    }
  };

  const handleImportStudents = (newStudents: Student[], mode: 'sync' | 'append' | 'replace') => {
    let updatedList: Student[] = [];
    if (mode === 'replace') {
      updatedList = newStudents;
    } else if (mode === 'append') {
      // Append only: add students whose NISN doesn't exist yet
      const existingNisnMap = new Set(students.map((s) => s.nisn.trim().toLowerCase()));
      const filteredIncoming = newStudents.filter((s) => !existingNisnMap.has(s.nisn.trim().toLowerCase()));
      updatedList = [...students, ...filteredIncoming];
    } else {
      // Default: 'sync' (Upsert / Sinkronisasi Login & Password)
      // Updates login password & profile for existing students while keeping their ID intact,
      // and adds new students from Excel
      const studentMap = new Map<string, Student>();
      students.forEach((s) => {
        studentMap.set(s.nisn.trim().toLowerCase(), s);
      });

      newStudents.forEach((incoming) => {
        const key = incoming.nisn.trim().toLowerCase();
        const existing = studentMap.get(key);
        if (existing) {
          studentMap.set(key, {
            ...existing,
            ...incoming,
            id: existing.id, // preserve existing ID so exam progress remains valid
            password: incoming.password || existing.password,
          });
        } else {
          studentMap.set(key, incoming);
        }
      });
      updatedList = Array.from(studentMap.values());
    }

    setStudents(updatedList);
    saveStudents(updatedList);

    // If current logged-in student has updated credentials, refresh session
    if (session && session.role === 'student') {
      const currentStudent = session.data as Student;
      const matched = updatedList.find((s) => s.id === currentStudent.id || s.nisn === currentStudent.nisn);
      if (matched) {
        const updatedSession: UserSession = { role: 'student', data: matched };
        setSession(updatedSession);
        saveCurrentSession(updatedSession);
      }
    }
  };

  const handleAddStudent = (newStudent: Student) => {
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStudents(updated);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStudents(updated);
    if (session && session.role === 'student' && (session.data as Student).id === updatedStudent.id) {
      const updatedSession: UserSession = { role: 'student', data: updatedStudent };
      setSession(updatedSession);
      saveCurrentSession(updatedSession);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    saveStudents(updated);
  };

  const handleAddExam = (newExam: ExamSubject) => {
    const updated = [newExam, ...exams];
    setExams(updated);
    saveExams(updated);
  };

  const handleUpdateExam = (updatedExam: ExamSubject) => {
    const updated = exams.map((e) => (e.id === updatedExam.id ? updatedExam : e));
    setExams(updated);
    saveExams(updated);
  };

  const handleDeleteExam = (examId: string) => {
    const updated = exams.filter((e) => e.id !== examId);
    setExams(updated);
    saveExams(updated);
  };

  const handleFinishExam = (examId: string) => {
    if (!session || session.role !== 'student') return;
    const currentStudent = session.data as Student;
    const targetExam = exams.find((e) => e.id === examId);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const newRecord: StudentExamProgress = {
      studentId: currentStudent.id,
      nisn: currentStudent.nisn,
      examId,
      examName: targetExam?.name || 'Ujian CBT',
      status: 'Sudah Selesai',
      completedAt: `${dateFormatted}, ${timeFormatted} WIB`,
    };

    const existingIndex = examProgress.findIndex(
      (p) => p.studentId === currentStudent.id && p.examId === examId
    );

    let updatedProgress: StudentExamProgress[] = [];
    if (existingIndex >= 0) {
      updatedProgress = [...examProgress];
      updatedProgress[existingIndex] = newRecord;
    } else {
      updatedProgress = [...examProgress, newRecord];
    }

    setExamProgress(updatedProgress);
    saveExamProgress(updatedProgress);
  };

  const handleResetAllData = () => {
    resetAllDataToDefault();
    setSettings(getAppSettings());
    setAdminUser(getAdminUser());
    setStudents(getStudents());
    setExams(getExams());
    setExamProgress([]);
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-gray-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navbar is displayed when logged in */}
      {session && (
        <Navbar
          settings={settings}
          session={session}
          onLogout={handleLogout}
        />
      )}

      {/* Main Body */}
      <main className="flex-1">
        {!session ? (
          <LoginView
            settings={settings}
            students={students}
            adminUser={adminUser}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : session.role === 'admin' ? (
          <AdminDashboard
            settings={settings}
            adminUser={adminUser}
            students={students}
            exams={exams}
            examProgress={examProgress}
            onSaveSettings={handleSaveSettings}
            onUpdateAdmin={handleUpdateAdmin}
            onImportStudents={handleImportStudents}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddExam={handleAddExam}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
            onResetAllData={handleResetAllData}
          />
        ) : (
          <StudentDashboard
            student={session.data as Student}
            exams={exams}
            settings={settings}
            examProgress={examProgress}
            onFinishExam={handleFinishExam}
          />
        )}
      </main>
    </div>
  );
}
