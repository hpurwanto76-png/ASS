import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParseResult {
  students: Student[];
  errors: string[];
  summary: {
    totalRows: number;
    validRows: number;
    skippedRows: number;
  };
}

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          return resolve({
            students: [],
            errors: ['File kosong atau tidak dapat dibaca'],
            summary: { totalRows: 0, validRows: 0, skippedRows: 0 },
          });
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array with header row (raw: false ensures strings and preserves leading zeros)
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: false });

        const students: Student[] = [];
        const errors: string[] = [];
        let validRows = 0;
        let skippedRows = 0;

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // Excel row numbering (header is row 1)

          // Normalize keys by lowercase and trimming
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalized[cleanKey] = String(row[k]).trim();
          });

          // Match login identifier (NISN / Username / No Peserta)
          const rawNisn = 
            normalized['nisn'] ||
            normalized['nisnsiswa'] ||
            normalized['nomorinduksiswanasional'] ||
            normalized['username'] ||
            normalized['user'] ||
            normalized['userlogin'] ||
            normalized['login'] ||
            normalized['noinduk'] ||
            normalized['nomorinduk'] ||
            normalized['nis'] ||
            normalized['nopeserta'] ||
            normalized['nomorpeserta'] ||
            normalized['no_peserta'] ||
            normalized['idpeserta'] ||
            normalized['id'] ||
            '';

          // Match password / kata sandi
          const rawPassword = 
            normalized['password'] ||
            normalized['sandi'] ||
            normalized['katasandi'] ||
            normalized['passwordsiswa'] ||
            normalized['pin'] ||
            normalized['pass'] ||
            normalized['pwd'] ||
            normalized['passkey'] ||
            normalized['token'] ||
            normalized['kodeakses'] ||
            normalized['sandiujian'] ||
            normalized['passwordujian'] ||
            '';

          const name = 
            normalized['nama'] ||
            normalized['namasiswa'] ||
            normalized['namalengkap'] ||
            normalized['namapeserta'] ||
            normalized['nama_siswa'] ||
            normalized['siswa'] ||
            '';

          const classGroup = 
            normalized['kelas'] ||
            normalized['rombel'] ||
            normalized['tingkat'] ||
            normalized['kelassiswa'] ||
            normalized['rombelbelajar'] ||
            'XII TKJ 1';

          const major = 
            normalized['jurusan'] ||
            normalized['kompetensikeahlian'] ||
            normalized['programkeahlian'] ||
            normalized['prodi'] ||
            'Teknik Komputer & Jaringan';

          const session = 
            normalized['sesi'] ||
            normalized['sesiujian'] ||
            normalized['gelombang'] ||
            'Sesi 1';

          const room = 
            normalized['ruang'] ||
            normalized['ruangujian'] ||
            normalized['lab'] ||
            normalized['lokasi'] ||
            'Lab Komputer';

          const nisn = String(rawNisn).trim();
          // Ensure password is never blank; default to 'siswa123' if not provided in Excel
          const password = String(rawPassword).trim() || 'siswa123';

          if (!nisn || !name) {
            skippedRows++;
            errors.push(`Baris ${rowNum}: NISN (Login) atau Nama siswa kosong, baris dilewati.`);
            return;
          }

          // Check duplicate NISN within current Excel batch
          const isDuplicate = students.some((s) => s.nisn === nisn);
          if (isDuplicate) {
            skippedRows++;
            errors.push(`Baris ${rowNum}: NISN ${nisn} terdeteksi duplikat di file Excel, baris dilewati.`);
            return;
          }

          students.push({
            id: `std-import-${Date.now()}-${index}`,
            nisn,
            name,
            classGroup,
            major,
            password,
            session,
            room,
            status: 'Aktif',
          });

          validRows++;
        });

        resolve({
          students,
          errors,
          summary: {
            totalRows: rawRows.length,
            validRows,
            skippedRows,
          },
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file Excel'));
    };

    reader.readAsBinaryString(file);
  });
};

export const downloadExcelTemplate = (): void => {
  const templateData = [
    {
      'NISN': '0071234501',
      'NAMA': 'Ahmad Fauzi Rizky',
      'KELAS': 'XII TKJ 1',
      'JURUSAN': 'Teknik Komputer & Jaringan',
      'PASSWORD': 'siswa123',
      'SESI': 'Sesi 1',
      'RUANG': 'Lab Komputer 1',
    },
    {
      'NISN': '0071234502',
      'NAMA': 'Siti Nur Aisyah',
      'KELAS': 'XII TKJ 1',
      'JURUSAN': 'Teknik Komputer & Jaringan',
      'PASSWORD': 'siswa123',
      'SESI': 'Sesi 1',
      'RUANG': 'Lab Komputer 1',
    },
    {
      'NISN': '0071234503',
      'NAMA': 'Budi Kurniawan',
      'KELAS': 'XII AKL 1',
      'JURUSAN': 'Akuntansi & Keuangan Lembaga',
      'PASSWORD': 'siswa123',
      'SESI': 'Sesi 1',
      'RUANG': 'Lab Komputer 2',
    },
    {
      'NISN': '0071234504',
      'NAMA': 'Dinda Ayu Lestari',
      'KELAS': 'XII MP 1',
      'JURUSAN': 'Manajemen Perkantoran',
      'PASSWORD': 'siswa123',
      'SESI': 'Sesi 2',
      'RUANG': 'Lab Komputer 2',
    },
    {
      'NISN': '0071234505',
      'NAMA': 'Rian Pratama',
      'KELAS': 'XII TKRO 1',
      'JURUSAN': 'Teknik Kendaraan Ringan Otomotif',
      'PASSWORD': 'siswa123',
      'SESI': 'Sesi 2',
      'RUANG': 'Lab Komputer 3',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // NISN
    { wch: 25 }, // NAMA
    { wch: 12 }, // KELAS
    { wch: 30 }, // JURUSAN
    { wch: 15 }, // PASSWORD
    { wch: 10 }, // SESI
    { wch: 18 }, // RUANG
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Siswa CBT');

  XLSX.writeFile(workbook, 'Template_Daftar_Siswa_CBT_SMK_KAWULA_INDONESIA.xlsx');
};

export const exportStudentsToExcel = (students: Student[], filename = 'Data_Siswa_CBT.xlsx'): void => {
  const exportData = students.map((s, index) => ({
    'NO': index + 1,
    'NISN': s.nisn,
    'NAMA SISWA': s.name,
    'KELAS': s.classGroup,
    'JURUSAN': s.major,
    'PASSWORD': s.password,
    'SESI': s.session || 'Sesi 1',
    'RUANG': s.room || 'Lab Komputer',
    'STATUS': s.status || 'Aktif',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 30 },
    { wch: 15 },
    { wch: 10 },
    { wch: 18 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
  XLSX.writeFile(workbook, filename);
};
