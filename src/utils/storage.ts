import { AppSettings, AdminUser, Student, ExamSubject, StudentExamProgress, UserSession } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_ADMIN, DEFAULT_STUDENTS, DEFAULT_EXAMS, DEFAULT_PROGRESS } from '../data/defaultData';

const STORAGE_KEYS = {
  SETTINGS: 'cbt_kawula_settings',
  ADMIN: 'cbt_kawula_admin',
  STUDENTS: 'cbt_kawula_students',
  EXAMS: 'cbt_kawula_exams',
  PROGRESS: 'cbt_kawula_progress',
  SESSION: 'cbt_kawula_session',
};

export const getAppSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Error loading settings', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveAppSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getAdminUser = (): AdminUser => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ADMIN);
    return data ? JSON.parse(data) : DEFAULT_ADMIN;
  } catch (e) {
    return DEFAULT_ADMIN;
  }
};

export const saveAdminUser = (admin: AdminUser): void => {
  localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));
};

export const getStudents = (): Student[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return data ? JSON.parse(data) : DEFAULT_STUDENTS;
  } catch (e) {
    return DEFAULT_STUDENTS;
  }
};

export const saveStudents = (students: Student[]): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getExams = (): ExamSubject[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return data ? JSON.parse(data) : DEFAULT_EXAMS;
  } catch (e) {
    return DEFAULT_EXAMS;
  }
};

export const saveExams = (exams: ExamSubject[]): void => {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
};

export const getExamProgress = (): StudentExamProgress[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : DEFAULT_PROGRESS;
  } catch (e) {
    return DEFAULT_PROGRESS;
  }
};

export const saveExamProgress = (records: StudentExamProgress[]): void => {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(records));
};

export const getCurrentSession = (): UserSession | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveCurrentSession = (session: UserSession | null): void => {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

export const resetAllDataToDefault = (): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(DEFAULT_ADMIN));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(DEFAULT_EXAMS));
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};
