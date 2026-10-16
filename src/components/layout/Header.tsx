import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Download,
  Upload,
  RotateCcw,
  Menu,
  School,
  UserCheck,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    activities,
    resetDemoData,
    exportBackupJson,
    importBackupJson,
    exportStudentsCsv,
    exportAttendanceCsv,
    isDemoLoaded,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
        setShowDataMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJson(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowDataMenu(false);
  };

  // Vietnamese date string
  const today = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[today.getDay()];
  const formattedDate = `${dayName}, ${String(today.getDate()).padStart(2, '0')}/${String(
    today.getMonth() + 1
  ).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & School / Teacher Lockup */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Mở danh mục điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-inner shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    THPT ĐỒNG HỶ
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold tracking-wide bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded">
                    CLASSROOM PRO
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                  <span className="font-medium text-teal-300">GV: Nguyễn Thị Thanh Xuân</span>
                  <span className="text-slate-600 hidden md:inline">|</span>
                  <span className="hidden md:inline text-slate-400">Năm học 2025 - 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Date, Notifications, Data Backup actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Current Date Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono tabular-nums">{formattedDate}</span>
            </div>

            {/* Notification Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Thông báo và hoạt động gần đây"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {activities.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full ring-2 ring-slate-900" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-4 z-40 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-teal-600" />
                      Nhật ký hoạt động gần đây
                    </h3>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">{activities.length} sự kiện</span>
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {activities.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Chưa có hoạt động nào được ghi nhận.</p>
                    ) : (
                      activities.slice(0, 8).map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">{act.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{act.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Data Management Menu (JSON Backup, CSV, Reset) */}
            <div className="relative" ref={dataMenuRef}>
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Dữ liệu & Sao lưu</span>
                <span className="sm:hidden">Dữ liệu</span>
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Lưu trữ & Xuất nhập
                  </div>

                  <button
                    onClick={() => {
                      exportBackupJson();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Sao lưu dữ liệu (JSON)</div>
                      <div className="text-[10px] text-slate-500">Tải về toàn bộ cấu hình & học sinh</div>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Phục hồi dữ liệu (JSON)</div>
                      <div className="text-[10px] text-slate-500">Tải lên tệp sao lưu đã lưu</div>
                    </div>
                  </button>

                  <div className="my-1.5 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      exportStudentsCsv();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Xuất học sinh ra CSV</div>
                      <div className="text-[10px] text-slate-500">Tương thích Microsoft Excel tiếng Việt</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportAttendanceCsv();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Xuất sổ điểm danh ra CSV</div>
                      <div className="text-[10px] text-slate-500">Báo cáo chuyên cần chi tiết</div>
                    </div>
                  </button>

                  <div className="my-1.5 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setShowResetConfirm(true);
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <div>
                      <div className="font-semibold text-rose-700">Khôi phục dữ liệu mẫu ban đầu</div>
                      <div className="text-[10px] text-rose-500">Đặt lại mẫu minh họa THPT Đồng Hỷ</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden JSON file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </div>

        {/* Discreet Demo Indicator Banner */}
        {isDemoLoaded && (
          <div className="bg-slate-800/90 border-t border-slate-700/60 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <span>Ứng dụng đang nạp dữ liệu minh họa THPT Đồng Hỷ (Có thể chỉnh sửa, thêm mới hoặc sao lưu bất cứ lúc nào).</span>
            </div>
            <span className="font-medium text-teal-400 shrink-0 ml-2">Lưu tự động LocalStorage</span>
          </div>
        )}
      </header>

      {/* Confirmation Modal for Resetting to Demo Data */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Khôi phục dữ liệu minh họa ban đầu?"
        message="Mọi dữ liệu bạn đã chỉnh sửa hoặc thêm mới sẽ được thay thế bằng bộ dữ liệu mẫu THPT Đồng Hỷ ban đầu. Bạn có chắc chắn muốn thực hiện thao tác này?"
        confirmText="Khôi phục dữ liệu mẫu"
        cancelText="Giữ lại dữ liệu hiện tại"
        isDanger={true}
        onConfirm={() => {
          resetDemoData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
