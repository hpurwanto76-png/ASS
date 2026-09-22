import { getAccessToken } from './googleAuth';
import { AppSettings, Student, ExamSubject, StudentExamProgress } from '../types';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: Array<{
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  }>;
}

export interface ListFilesOptions {
  pageSize?: number;
  pageToken?: string;
  folderId?: string;
  searchQuery?: string;
  mimeTypeFilter?: 'all' | 'folders' | 'spreadsheets' | 'forms' | 'documents' | 'cbt';
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Akses Google Drive belum terhubung. Silakan Masuk dengan Google terlebih dahulu.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * List files from Google Drive
 */
export const listDriveFiles = async (options: ListFilesOptions = {}): Promise<{
  files: DriveFile[];
  nextPageToken?: string;
}> => {
  const headers = await getAuthHeaders();
  const { pageSize = 30, pageToken, folderId, searchQuery, mimeTypeFilter = 'all' } = options;

  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  if (mimeTypeFilter === 'folders') {
    queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
  } else if (mimeTypeFilter === 'spreadsheets') {
    queryParts.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
  } else if (mimeTypeFilter === 'forms') {
    queryParts.push("mimeType = 'application/vnd.google-apps.form'");
  } else if (mimeTypeFilter === 'documents') {
    queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf')");
  } else if (mimeTypeFilter === 'cbt') {
    queryParts.push("name contains 'CBT' or name contains 'SMK'");
  }

  const q = queryParts.join(' and ');
  const fields = 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners)';

  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields,
    orderBy: 'folder,modifiedTime desc',
    q,
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const res = await fetch(`${DRIVE_API_URL}?${params.toString()}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengambil daftar file Drive (${res.status})`);
  }

  return await res.json();
};

/**
 * List all folders in Google Drive
 */
export const listDriveFolders = async (): Promise<DriveFile[]> => {
  const res = await listDriveFiles({ mimeTypeFilter: 'folders', pageSize: 50 });
  return res.files || [];
};

/**
 * Create a new folder in Google Drive
 */
export const createDriveFolder = async (
  folderName: string,
  parentFolderId?: string
): Promise<DriveFile> => {
  const headers = await getAuthHeaders();
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat folder di Google Drive (${res.status})`);
  }

  return await res.json();
};

/**
 * Upload a text or binary file to Google Drive using multipart upload
 */
export const uploadFileToDrive = async ({
  name,
  content,
  mimeType = 'application/json',
  parentFolderId,
}: {
  name: string;
  content: string | Blob;
  mimeType?: string;
  parentFolderId?: string;
}): Promise<DriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Akses Google Drive belum terhubung.');
  }

  const metadata: any = {
    name,
    mimeType,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const blobContent = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const contentText = typeof content === 'string' ? content : await blobContent.text();

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    contentText +
    closeDelimiter;

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengunggah file ke Google Drive (${res.status})`);
  }

  return await res.json();
};

/**
 * Delete a file or folder from Google Drive
 */
export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${DRIVE_API_URL}/${fileId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menghapus file dari Google Drive (${res.status})`);
  }

  return true;
};

/**
 * Backup full CBT system data to Google Drive
 */
export const backupCbtSystemToDrive = async ({
  settings,
  students,
  exams,
  examProgress,
  targetFolderName,
}: {
  settings: AppSettings;
  students: Student[];
  exams: ExamSubject[];
  examProgress: StudentExamProgress[];
  targetFolderName?: string;
}): Promise<{
  folder: DriveFile;
  uploadedFiles: DriveFile[];
}> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folderName =
    targetFolderName ||
    `[BACKUP CBT] ${settings.schoolName} - ${timestamp}`;

  // 1. Create designated folder
  const folder = await createDriveFolder(folderName);

  // 2. Prepare JSON system dump
  const fullBackupPayload = {
    exportedAt: new Date().toISOString(),
    system: 'SMK KAWULA INDONESIA CBT Portal',
    settings,
    totalStudents: students.length,
    totalExams: exams.length,
    totalCompletedProgress: examProgress.length,
    students,
    exams,
    examProgress,
  };

  const jsonDumpFile = await uploadFileToDrive({
    name: `cbt-system-backup-${timestamp}.json`,
    content: JSON.stringify(fullBackupPayload, null, 2),
    mimeType: 'application/json',
    parentFolderId: folder.id,
  });

  // 3. Prepare CSV for Students
  const studentCsvHeader = 'ID,NISN,Nama Lengkap,Kelas,Jurusan,Sesi,Ruangan,Status\n';
  const studentCsvRows = students
    .map(
      (s) =>
        `"${s.id}","${s.nisn}","${s.name.replace(/"/g, '""')}","${s.classGroup}","${s.major}","${s.session || ''}","${s.room || ''}","${s.status || 'Aktif'}"`
    )
    .join('\n');

  const studentCsvFile = await uploadFileToDrive({
    name: `daftar-siswa-${timestamp}.csv`,
    content: studentCsvHeader + studentCsvRows,
    mimeType: 'text/csv',
    parentFolderId: folder.id,
  });

  // 4. Prepare CSV for Exams
  const examCsvHeader = 'ID,Kode Mapel,Nama Mapel,Tingkat,Jurusan,Tanggal,Jam Mulai,Jam Selesai,Durasi,Token,Status,Google Form URL\n';
  const examCsvRows = exams
    .map(
      (e) =>
        `"${e.id}","${e.code}","${e.name.replace(/"/g, '""')}","${e.gradeLevel}","${e.major}","${e.date}","${e.startTime}","${e.endTime}",${e.durationMinutes},"${e.token}","${e.status}","${e.googleFormUrl}"`
    )
    .join('\n');

  const examCsvFile = await uploadFileToDrive({
    name: `jadwal-ujian-cbt-${timestamp}.csv`,
    content: examCsvHeader + examCsvRows,
    mimeType: 'text/csv',
    parentFolderId: folder.id,
  });

  // 5. Prepare CSV for Progress
  const progressCsvHeader = 'NISN,Nama Ujian,Status Pengerjaan,Waktu Selesai\n';
  const progressCsvRows = examProgress
    .map(
      (p) =>
        `"${p.nisn}","${p.examName.replace(/"/g, '""')}","${p.status}","${p.completedAt || ''}"`
    )
    .join('\n');

  const progressCsvFile = await uploadFileToDrive({
    name: `rekap-progres-siswa-${timestamp}.csv`,
    content: progressCsvHeader + progressCsvRows,
    mimeType: 'text/csv',
    parentFolderId: folder.id,
  });

  return {
    folder,
    uploadedFiles: [jsonDumpFile, studentCsvFile, examCsvFile, progressCsvFile],
  };
};

export interface ExportExamResultsOptions {
  settings: AppSettings;
  students: Student[];
  exams: ExamSubject[];
  examProgress: StudentExamProgress[];
  targetFolderName?: string;
  targetFolderId?: string;
  filterExamId?: string; // empty string or 'all' means all exams
  filterClassGroup?: string; // empty string or 'all' means all classes
  statusFilter?: 'all' | 'completed' | 'pending';
}

export interface ExportExamResultsResult {
  folder: { id: string; name: string; webViewLink?: string };
  uploadedFiles: DriveFile[];
  summary: {
    totalStudents: number;
    totalExams: number;
    filteredRowsCount: number;
    completedCount: number;
    pendingCount: number;
    completionPercentage: number;
    examName: string;
    classGroup: string;
  };
}

/**
 * Specialized Google Drive Module: Export student exam data results to a dedicated folder in Google Drive
 */
export const exportStudentExamResultsToDriveFolder = async (
  options: ExportExamResultsOptions
): Promise<ExportExamResultsResult> => {
  const {
    settings,
    students,
    exams,
    examProgress,
    targetFolderName,
    targetFolderId,
    filterExamId,
    filterClassGroup,
    statusFilter = 'all',
  } = options;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.');
  const timestamp = `${dateStr}_${timeStr}`;

  // 1. Determine target folder
  let destinationFolder: { id: string; name: string; webViewLink?: string };

  if (targetFolderId) {
    // Use existing folder
    destinationFolder = {
      id: targetFolderId,
      name: targetFolderName || 'Folder Google Drive',
      webViewLink: `https://drive.google.com/drive/folders/${targetFolderId}`,
    };
  } else {
    // Create new dedicated folder
    const selectedExamObj = exams.find((e) => e.id === filterExamId);
    const examLabel = selectedExamObj ? selectedExamObj.name : 'Semua Mapel';
    const classLabel = filterClassGroup && filterClassGroup !== 'all' ? ` - ${filterClassGroup}` : '';

    const folderTitle =
      targetFolderName ||
      `[HASIL UJIAN CBT] ${settings.schoolName} - ${examLabel}${classLabel} (${timestamp})`;

    const newFolder = await createDriveFolder(folderTitle);
    destinationFolder = {
      id: newFolder.id,
      name: newFolder.name,
      webViewLink: newFolder.webViewLink,
    };
  }

  // 2. Filter students and exams
  const selectedExams = (!filterExamId || filterExamId === 'all')
    ? exams
    : exams.filter((e) => e.id === filterExamId);

  const selectedStudents = (!filterClassGroup || filterClassGroup === 'all')
    ? students
    : students.filter((s) => s.classGroup === filterClassGroup);

  // 3. Build comprehensive rows of student exam progress
  interface ExamResultRow {
    studentId: string;
    nisn: string;
    studentName: string;
    classGroup: string;
    major: string;
    session: string;
    room: string;
    examId: string;
    examCode: string;
    examName: string;
    status: 'Sudah Selesai' | 'Belum Selesai';
    completedAt: string;
    verificationStatus: string;
  }

  const allRows: ExamResultRow[] = [];

  for (const student of selectedStudents) {
    for (const exam of selectedExams) {
      const match = examProgress.find(
        (p) => p.studentId === student.id && p.examId === exam.id
      );

      const isDone = match && match.status === 'Sudah Selesai';
      const status = isDone ? 'Sudah Selesai' : 'Belum Selesai';

      if (statusFilter === 'completed' && !isDone) continue;
      if (statusFilter === 'pending' && isDone) continue;

      allRows.push({
        studentId: student.id,
        nisn: student.nisn,
        studentName: student.name,
        classGroup: student.classGroup,
        major: student.major,
        session: student.session || 'Sesi 1',
        room: student.room || 'Lab CBT',
        examId: exam.id,
        examCode: exam.code,
        examName: exam.name,
        status,
        completedAt: match?.completedAt || '-',
        verificationStatus: isDone ? 'Terverifikasi CBT' : 'Menunggu Pengerjaan',
      });
    }
  }

  // 4. Calculate statistical metrics
  const completedCount = allRows.filter((r) => r.status === 'Sudah Selesai').length;
  const pendingCount = allRows.length - completedCount;
  const completionPercentage = allRows.length > 0 ? Math.round((completedCount / allRows.length) * 100) : 0;

  // Breakdown by class group
  const classBreakdown: Record<string, { total: number; completed: number }> = {};
  for (const row of allRows) {
    if (!classBreakdown[row.classGroup]) {
      classBreakdown[row.classGroup] = { total: 0, completed: 0 };
    }
    classBreakdown[row.classGroup].total += 1;
    if (row.status === 'Sudah Selesai') {
      classBreakdown[row.classGroup].completed += 1;
    }
  }

  // 5. File 1: CSV of Student Exam Results
  const csvHeaders = 'No,NISN,Nama Siswa,Kelas,Jurusan,Sesi,Ruangan,Kode Mapel,Mata Pelajaran,Status Pengerjaan,Waktu Selesai,Status Verifikasi\n';
  const csvContent =
    csvHeaders +
    allRows
      .map(
        (r, idx) =>
          `${idx + 1},"${r.nisn}","${r.studentName.replace(/"/g, '""')}","${r.classGroup}","${r.major}","${r.session}","${r.room}","${r.examCode}","${r.examName.replace(/"/g, '""')}","${r.status}","${r.completedAt}","${r.verificationStatus}"`
      )
      .join('\n');

  const csvFile = await uploadFileToDrive({
    name: `REKAP_HASIL_UJIAN_SISWA_${timestamp}.csv`,
    content: csvContent,
    mimeType: 'text/csv',
    parentFolderId: destinationFolder.id,
  });

  // 6. File 2: Executive Summary Report (Text format)
  const summaryText = `===============================================================
LAPORAN REKAPITULASI HASIL UJIAN SISWA BERBASIS KOMPUTER (CBT)
${settings.schoolName.toUpperCase()}
===============================================================

Nama Ujian        : ${settings.examName}
Tahun Pelajaran   : ${settings.academicYear} (Semester ${settings.semester})
Waktu Ekspor      : ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')} WIB
Tujuan Ekspor     : Dedicated Google Drive Folder ("${destinationFolder.name}")

--- RINGKASAN DATA ---
Total Rekaman Data    : ${allRows.length} entri siswa-mapel
Siswa Selesai Ujian   : ${completedCount} siswa (${completionPercentage}%)
Siswa Belum Selesai   : ${pendingCount} siswa (${100 - completionPercentage}%)
Mata Pelajaran        : ${selectedExams.map((e) => e.name).join(', ')}

--- STATISTIK PER KELAS ---
${Object.entries(classBreakdown)
  .map(
    ([kelas, stat]) =>
      `• ${kelas.padEnd(16)}: ${stat.completed} dari ${stat.total} tuntas (${stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0}%)`
  )
  .join('\n')}

===============================================================
Dicadangkan & Diekspor secara otomatis melalui CBT Portal SMK KAWULA INDONESIA
===============================================================
`;

  const summaryFile = await uploadFileToDrive({
    name: `RINGKASAN_STATISTIK_HASIL_${timestamp}.txt`,
    content: summaryText,
    mimeType: 'text/plain',
    parentFolderId: destinationFolder.id,
  });

  // 7. File 3: JSON Full Structured Data
  const jsonPayload = {
    exportedAt: now.toISOString(),
    school: {
      name: settings.schoolName,
      examName: settings.examName,
      academicYear: settings.academicYear,
      semester: settings.semester,
    },
    filterOptions: {
      examId: filterExamId || 'all',
      classGroup: filterClassGroup || 'all',
      statusFilter,
    },
    statistics: {
      totalRecords: allRows.length,
      completedCount,
      pendingCount,
      completionPercentage,
      classBreakdown,
    },
    results: allRows,
  };

  const jsonFile = await uploadFileToDrive({
    name: `HASIL_UJIAN_LENGKAP_${timestamp}.json`,
    content: JSON.stringify(jsonPayload, null, 2),
    mimeType: 'application/json',
    parentFolderId: destinationFolder.id,
  });

  return {
    folder: destinationFolder,
    uploadedFiles: [csvFile, summaryFile, jsonFile],
    summary: {
      totalStudents: selectedStudents.length,
      totalExams: selectedExams.length,
      filteredRowsCount: allRows.length,
      completedCount,
      pendingCount,
      completionPercentage,
      examName: selectedExams.length === 1 ? selectedExams[0].name : 'Semua Mapel',
      classGroup: filterClassGroup && filterClassGroup !== 'all' ? filterClassGroup : 'Semua Kelas',
    },
  };
};

