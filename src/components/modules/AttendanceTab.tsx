import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceEntry, AttendanceSession, AttendanceStatus } from '../../types';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Save,
  Search,
  Filter,
  Download,
  Calendar,
  History,
  Trash2,
  UserCheck,
  CheckCheck,
  HelpCircle,
} from 'lucide-react';
import { formatDateVN } from '../../utils/storage';
import { ConfirmModal } from '../common/ConfirmModal';

export const AttendanceTab: React.FC = () => {
  const {
    classes,
    students,
    attendance,
    saveAttendanceSheet,
    deleteAttendanceRecord,
    selectedClassFilter,
    setSelectedClassFilter,
    exportAttendanceCsv,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'sheet' | 'history'>('sheet');

  // Attendance Sheet Configuration
  const [currentClassId, setCurrentClassId] = useState<string>(() => {
    return selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '';
  });
  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentSession, setCurrentSession] = useState<AttendanceSession>('Sáng');

  // Search & Filter in roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | AttendanceStatus>('all');

  // Current Working Entries (studentId -> { status, notes })
  const [entries, setEntries] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

  // History Tab Filter
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  // Sync class selection if global selectedClassFilter changed
  useEffect(() => {
    if (selectedClassFilter !== 'all') {
      setCurrentClassId(selectedClassFilter);
    }
  }, [selectedClassFilter]);

  // Students belonging to currently selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === currentClassId);
  }, [students, currentClassId]);

  // Load existing attendance record if already saved for this class + date + session
  useEffect(() => {
    const existing = attendance.find(
      (a) => a.classId === currentClassId && a.date === currentDate && a.session === currentSession
    );

    const initialEntries: Record<string, { status: AttendanceStatus; notes: string }> = {};

    classStudents.forEach((stu) => {
      const match = existing?.entries.find((e) => e.studentId === stu.id);
      if (match) {
        initialEntries[stu.id] = { status: match.status, notes: match.notes || '' };
      } else {
        // Default: present
        initialEntries[stu.id] = { status: 'present', notes: '' };
      }
    });

    setEntries(initialEntries);
  }, [currentClassId, currentDate, currentSession, classStudents, attendance]);

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    classStudents.forEach((stu) => {
      updated[stu.id] = {
        status: 'present',
        notes: entries[stu.id]?.notes || '',
      };
    });
    setEntries(updated);
  };

  // Change individual status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || '',
      },
    }));
  };

  // Change individual note
  const handleSetNote = (studentId: string, notes: string) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'present',
        notes,
      },
    }));
  };

  // Save attendance sheet
  const handleSave = () => {
    if (!currentClassId || classStudents.length === 0) return;

    const entryList: AttendanceEntry[] = classStudents.map((stu) => ({
      studentId: stu.id,
      status: entries[stu.id]?.status || 'present',
      notes: entries[stu.id]?.notes || '',
    }));

    saveAttendanceSheet(currentClassId, currentDate, currentSession, entryList);
  };

  // Real-time calculation of current sheet metrics
  const sheetStats = useMemo(() => {
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let late = 0;
    const total = classStudents.length;

    classStudents.forEach((stu) => {
      const entry = entries[stu.id];
      const st = entry ? entry.status : 'present';
      if (st === 'present') present++;
      else if (st === 'excused') excused++;
      else if (st === 'unexcused') unexcused++;
      else if (st === 'late') late++;
    });

    // Attendance rate formula: (present + late) / total * 100%
    const rate = total > 0 ? (((present + late) / total) * 100).toFixed(1) : '100.0';

    return { total, present, excused, unexcused, late, rate };
  }, [classStudents, entries]);

  // Filtered roster for display
  const filteredRoster = useMemo(() => {
    return classStudents.filter((stu) => {
      const matchSearch =
        stu.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        stu.code.toLowerCase().includes(rosterSearch.toLowerCase());

      const status = entries[stu.id]?.status || 'present';
      const matchStatus = rosterStatusFilter === 'all' || status === rosterStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [classStudents, rosterSearch, rosterStatusFilter, entries]);

  // Attendance History records
  const filteredHistory = useMemo(() => {
    return attendance
      .filter((rec) => {
        const matchClass = historyClassFilter === 'all' || rec.classId === historyClassFilter;
        const matchDate = !historyDateFilter || rec.date === historyDateFilter;
        return matchClass && matchDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, historyClassFilter, historyDateFilter]);

  const currentClassObj = classes.find((c) => c.id === currentClassId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-teal-600" />
            Điểm danh Lớp học Hằng ngày
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Điểm danh nhanh theo buổi, ghi chú chuyên cần và lưu vết lịch sử Trường THPT Đồng Hỷ
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab('sheet')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'sheet'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Sổ điểm danh hôm nay
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Lịch sử & Báo cáo ({attendance.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'sheet' ? (
        /* DAILY ATTENDANCE SHEET SUBVIEW */
        <div className="space-y-5">
          {/* Controls Bar: Class, Date, Session */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Select Class */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Chọn lớp học:
                </label>
                <select
                  value={currentClassId}
                  onChange={(e) => setCurrentClassId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.code} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Ngày điểm danh:
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                />
              </div>

              {/* Select Session */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Buổi học:
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCurrentSession('Sáng')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                      currentSession === 'Sáng'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Buổi Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSession('Chiều')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                      currentSession === 'Chiều'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Buổi Chiều
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Button: All Present */}
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                title="Đánh dấu tất cả học sinh trong lớp là có mặt"
              >
                <CheckCheck className="w-4 h-4 text-teal-600" />
                Tất cả có mặt
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu điểm danh
              </button>
            </div>
          </div>

          {/* Real-Time Attendance Status KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Sĩ số lớp</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {sheetStats.total}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-800 font-medium block">Có mặt</span>
              <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {sheetStats.present}
              </span>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[11px] text-amber-800 font-medium block">Vắng có phép</span>
              <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
                {sheetStats.excused}
              </span>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
              <span className="text-[11px] text-rose-800 font-medium block">Vắng không phép</span>
              <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
                {sheetStats.unexcused}
              </span>
            </div>

            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
              <span className="text-[11px] text-sky-800 font-medium block">Đi muộn</span>
              <span className="text-xl font-bold font-mono text-sky-700 tabular-nums">
                {sheetStats.late}
              </span>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <span className="text-[11px] text-indigo-800 font-medium block">Tỷ lệ chuyên cần</span>
              <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
                {sheetStats.rate}%
              </span>
            </div>
          </div>

          {/* Roster Table with Status Selectors and Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Table Search & Filter Bar */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Lọc học sinh theo tên..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <span className="text-slate-500">Lọc trạng thái:</span>
                <select
                  value={rosterStatusFilter}
                  onChange={(e) => setRosterStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="all">Tất cả ({classStudents.length})</option>
                  <option value="present">Có mặt</option>
                  <option value="excused">Vắng có phép</option>
                  <option value="unexcused">Vắng không phép</option>
                  <option value="late">Đi muộn</option>
                </select>
              </div>
            </div>

            {filteredRoster.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Lớp {currentClassObj?.code || ''} hiện chưa có học sinh nào hoặc không tìm thấy theo bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">STT</th>
                      <th className="px-4 py-3 w-28">Mã HS</th>
                      <th className="px-4 py-3">Họ và tên</th>
                      <th className="px-4 py-3 text-center">Trạng thái điểm danh</th>
                      <th className="px-4 py-3">Ghi chú chuyên cần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoster.map((stu, index) => {
                      const currentStatus = entries[stu.id]?.status || 'present';
                      const currentNote = entries[stu.id]?.notes || '';

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center font-mono text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 font-medium">
                            {stu.code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {stu.fullName}
                            {stu.needsSupport && (
                              <span className="ml-1.5 text-[10px] text-rose-600 font-normal">
                                [Theo dõi]
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* Present */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(stu.id, 'present')}
                                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Có mặt
                              </button>

                              {/* Excused */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(stu.id, 'excused')}
                                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'excused'
                                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Có phép
                              </button>

                              {/* Unexcused */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(stu.id, 'unexcused')}
                                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'unexcused'
                                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Không phép
                              </button>

                              {/* Late */}
                              <button
                                type="button"
                                onClick={() => handleSetStatus(stu.id, 'late')}
                                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === 'late'
                                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Đi muộn
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) => handleSetNote(stu.id, e.target.value)}
                              placeholder="Ghi chú (lý do vắng, đi muộn...)"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Điểm danh lớp {currentClassObj?.code || ''} · {currentSession} {formatDateVN(currentDate)}
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu kết quả điểm danh
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ATTENDANCE HISTORY & REPORT SUBVIEW */
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter by Class */}
              <select
                value={historyClassFilter}
                onChange={(e) => setHistoryClassFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white"
              >
                <option value="all">Tất cả lớp ({classes.length} lớp)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.code}
                  </option>
                ))}
              </select>

              {/* Filter by Date */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg font-mono bg-white"
                />
                {historyDateFilter && (
                  <button
                    onClick={() => setHistoryDateFilter('')}
                    className="text-xs text-teal-700 font-medium hover:underline cursor-pointer"
                  >
                    Xem tất cả ngày
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={exportAttendanceCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Xuất sổ điểm danh ra CSV
            </button>
          </div>

          {/* History List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Chưa có buổi điểm danh nào được lưu trong hệ thống.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Ngày</th>
                      <th className="px-4 py-3">Buổi</th>
                      <th className="px-4 py-3">Lớp học</th>
                      <th className="px-4 py-3 text-center">Sĩ số</th>
                      <th className="px-4 py-3 text-center text-emerald-700">Có mặt</th>
                      <th className="px-4 py-3 text-center text-amber-700">Vắng có phép</th>
                      <th className="px-4 py-3 text-center text-rose-700">Vắng không phép</th>
                      <th className="px-4 py-3 text-center text-sky-700">Đi muộn</th>
                      <th className="px-4 py-3 text-center">Chuyên cần</th>
                      <th className="px-4 py-3">Người ghi nhận</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((rec) => {
                      const cls = classes.find((c) => c.id === rec.classId);
                      let present = 0;
                      let excused = 0;
                      let unexcused = 0;
                      let late = 0;
                      rec.entries.forEach((e) => {
                        if (e.status === 'present') present++;
                        else if (e.status === 'excused') excused++;
                        else if (e.status === 'unexcused') unexcused++;
                        else if (e.status === 'late') late++;
                      });
                      const total = rec.entries.length;
                      const rate = total > 0 ? (((present + late) / total) * 100).toFixed(1) : '100.0';

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-700">{formatDateVN(rec.date)}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{rec.session}</td>
                          <td className="px-4 py-3 font-semibold text-teal-800 font-mono">
                            {cls ? cls.code : rec.classId}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">{total}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">
                            {present}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-amber-600">
                            {excused}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-rose-600">
                            {unexcused}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-sky-600">
                            {late}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                            {rate}%
                          </td>
                          <td className="px-4 py-3 text-slate-500">{rec.recordedBy}</td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCurrentClassId(rec.classId);
                                setCurrentDate(rec.date);
                                setCurrentSession(rec.session);
                                setActiveSubTab('sheet');
                              }}
                              className="text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
                              title="Tải lên để xem và chỉnh sửa buổi điểm danh này"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => setDeletingRecordId(rec.id)}
                              className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                              title="Xóa buổi điểm danh này"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Record Confirmation */}
      <ConfirmModal
        isOpen={deletingRecordId !== null}
        title="Xác nhận xóa buổi điểm danh?"
        message="Hành động này sẽ xóa dữ liệu điểm danh của buổi học này và cập nhật lại thống kê chuyên cần trên dashboard."
        confirmText="Xóa buổi điểm danh"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={() => {
          if (deletingRecordId) {
            deleteAttendanceRecord(deletingRecordId);
            setDeletingRecordId(null);
          }
        }}
        onCancel={() => setDeletingRecordId(null)}
      />
    </div>
  );
};
