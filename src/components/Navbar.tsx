import React from 'react';
import { School, User, LogOut, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { AppSettings, UserSession } from '../types';

interface NavbarProps {
  settings: AppSettings;
  session: UserSession | null;
  onLogout: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  session,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-emerald-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & School Info */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-100">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
                  {settings.schoolName}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  CBT Portal
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {settings.examName} &bull; TP {settings.academicYear} ({settings.semester})
              </p>
            </div>
          </div>

          {/* User Session & Logout */}
          {session ? (
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-gray-800">
                  {session.role === 'admin' ? session.data.name : (session.data as any).name}
                </span>
                <span className="text-xs text-emerald-700 font-medium flex items-center justify-end gap-1">
                  {session.role === 'admin' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Administrator
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      NISN: {(session.data as any).nisn} | {(session.data as any).classGroup}
                    </>
                  )}
                </span>
              </div>

              <div className="h-8 w-px bg-emerald-200 hidden sm:block" />

              <button
                id="btn-logout"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                title="Keluar dari sistem"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Portal Ujian Aktif</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
