import React from 'react';
import { useApp, NavTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  LineChart,
  ClipboardCheck,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, classes, students, assessments } = useApp();

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'classes',
      label: 'Lớp học',
      icon: GraduationCap,
      count: classes.length,
    },
    {
      id: 'students',
      label: 'Học sinh',
      icon: Users,
      count: students.length,
    },
    {
      id: 'progress',
      label: 'Tiến độ học tập',
      icon: LineChart,
      count: assessments.length,
    },
    {
      id: 'attendance',
      label: 'Điểm danh',
      icon: ClipboardCheck,
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Header inside Mobile Drawer */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">CLASSROOM PRO</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Tagline in Sidebar (desktop) */}
        <div className="hidden lg:block px-6 pt-5 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
            Hệ thống Quản trị THPT
          </p>
          <p className="text-xs text-slate-400 font-medium">Bảng điều khiển tác nghiệp</p>
        </div>

        {/* 5 Main Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-teal-600/90 text-white shadow-md shadow-teal-900/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Teacher Profile Footer Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  Nguyễn Thị Thanh Xuân
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 truncate">Trường THPT Đồng Hỷ</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-teal-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Trực tuyến</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
