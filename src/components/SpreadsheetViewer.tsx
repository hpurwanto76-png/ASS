import React, { useState } from 'react';
import { Table, ExternalLink, RefreshCw, HelpCircle, FileSpreadsheet, Eye, HardDrive } from 'lucide-react';
import { ExamSubject, AppSettings, Student, StudentExamProgress } from '../types';
import { ExportExamResultsDriveModal } from './ExportExamResultsDriveModal';

interface SpreadsheetViewerProps {
  masterUrl: string;
  exams?: ExamSubject[];
  userRole: 'admin' | 'student';
  settings?: AppSettings;
  students?: Student[];
  examProgress?: StudentExamProgress[];
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  masterUrl,
  exams = [],
  userRole,
  settings,
  students = [],
  examProgress = [],
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(masterUrl);
  const [selectedTitle, setSelectedTitle] = useState<string>('Rekap Nilai Induk CBT');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showExportDriveModal, setShowExportDriveModal] = useState<boolean>(false);

  // Helper to convert standard Google Sheet URL to embeddable preview or pubhtml URL
  const formatEmbedUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    // If it's already pubhtml or preview or embedded
    if (url.includes('/pubhtml') || url.includes('/htmlembed') || url.includes('/preview')) {
      return url;
    }

    // Replace /edit#gid=... or /edit?usp=sharing with /preview
    if (url.includes('/edit')) {
      return url.replace(/\/edit.*$/, '/preview');
    }

    // Default append /preview if ends with doc id
    return url;
  };

  const currentEmbedUrl = formatEmbedUrl(selectedUrl);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Selector */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              {selectedTitle}
            </h3>
            <p className="text-xs text-gray-500">
              Integrasi live Google Spreadsheet Nilai Ujian Siswa
            </p>
          </div>
        </div>

        {/* Source Dropdown / Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedUrl}
            onChange={(e) => {
              const url = e.target.value;
              setSelectedUrl(url);
              if (url === masterUrl) {
                setSelectedTitle('Rekap Nilai Induk CBT');
              } else {
                const matched = exams.find((x) => x.googleSpreadsheetUrl === url);
                setSelectedTitle(matched ? `Nilai: ${matched.name}` : 'Lembar Nilai Mapel');
              }
            }}
            className="text-xs bg-emerald-50/60 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-950 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={masterUrl}>Sheet Induk: Rekapitulasi Semua Nilai</option>
            {exams
              .filter((x) => x.googleSpreadsheetUrl)
              .map((x) => (
                <option key={x.id} value={x.googleSpreadsheetUrl}>
                  Nilai: {x.name} ({x.code})
                </option>
              ))}
          </select>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            title="Muat ulang tabel"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href={selectedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Google Sheets</span>
          </a>

          {userRole === 'admin' && settings && (
            <button
              type="button"
              onClick={() => setShowExportDriveModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors shadow-xs"
              title="Ekspor rekap hasil pengerjaan ujian ke folder khusus di Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor ke Google Drive</span>
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="p-2 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              title="Panduan Integrasi Google Sheet"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Guide Info for Admin */}
      {showGuide && userRole === 'admin' && (
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 text-xs sm:text-sm text-emerald-950 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            Cara Menghubungkan Nilai dari Google Form ke Google Spreadsheet agar Tampil di Sini:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-emerald-900/90 leading-relaxed font-medium">
            <li>Buka <strong>Google Form</strong> soal ujian Anda &gt; Buka tab <strong>Tanggapan / Responses</strong> &gt; Klik <strong>"Tautkan ke Spreadsheet"</strong>.</li>
            <li>Di Google Spreadsheet tersebut, klik menu <strong>File &gt; Bagikan (Share) &gt; Publikasikan ke web (Publish to the web)</strong>.</li>
            <li>Pilih <strong>Seluruh Dokumen</strong> atau lembar nilai yang diinginkan &gt; Pilih format <strong>Halaman Web</strong> &gt; Klik <strong>Publikasikan</strong>.</li>
            <li>Salin URL link publikasi tersebut (biasanya berakhiran <code>/pubhtml</code>) dan masukkan ke menu <strong>Pengaturan</strong> atau di masing-masing Mata Pelajaran.</li>
          </ol>
        </div>
      )}

      {/* Embedded Sheet Container */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col">
        <div className="bg-emerald-800 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-300" />
            <span>Tampilan Lembar Nilai Google Spreadsheet</span>
          </div>
          <span className="text-[11px] text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded">
            Live View
          </span>
        </div>

        <div className="w-full h-[620px] bg-gray-50 relative">
          {currentEmbedUrl ? (
            <iframe
              key={iframeKey}
              src={currentEmbedUrl}
              title="Google Spreadsheet Nilai"
              className="w-full h-full border-0"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-2" />
              <p className="font-semibold text-gray-700">Link Google Spreadsheet Belum Diatur</p>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Silakan masukkan URL Google Spreadsheet pada menu Pengaturan (untuk admin) agar rekapan nilai dapat langsung dilihat di sini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export to Google Drive Modal */}
      {userRole === 'admin' && settings && (
        <ExportExamResultsDriveModal
          isOpen={showExportDriveModal}
          onClose={() => setShowExportDriveModal(false)}
          settings={settings}
          students={students}
          exams={exams}
          examProgress={examProgress}
        />
      )}
    </div>
  );
};
