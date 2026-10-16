import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  User,
  GraduationCap,
  CalendarCheck,
  Award,
  Calendar,
  AlertCircle,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { calculateStudentStats, formatDateVN } from '../../utils/storage';

export const StudentProfileModal: React.FC = () => {
  const {
    selectedStudentForDetail,
    setSelectedStudentForDetail,
    classes,
    assessments,
    attendance,
    setActiveTab,
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'assessments' | 'attendance' | 'notes'>('assessments');

  if (!selectedStudentForDetail) return null;

  const student = selectedStudentForDetail;
  const currentClass = classes.find((c) => c.id === student.classId);
  const stats = calculateStudentStats(student.id, assessments, attendance);

  const studentAssessments = assessments
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Student specific attendance history
  const studentAttendanceHistory: {
    date: string;
    session: string;
    status: string;
    notes: string;
  }[] = [];

  attendance.forEach((rec) => {
    const entry = rec.entries.find((e) => e.studentId === student.id);
    if (entry) {
      studentAttendanceHistory.push({
        date: rec.date,
        session: rec.session,
        status: entry.status,
        notes: entry.notes,
      });
    }
  });

  studentAttendanceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Có mặt
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3" /> Vắng có phép
          </span>
        );
      case 'unexcused':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Vắng không phép
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            <Clock className="w-3 h-3" /> Đi muộn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col text-slate-800 animate-in zoom-in-95">
        {/* Header with Student Name & Avatar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{student.fullName}</h2>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded">
                  {student.code}
                </span>
                {student.needsSupport && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                    Cần chú ý
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentClass ? `Lớp ${currentClass.code} (${currentClass.name})` : 'Chưa phân lớp'} · THPT Đồng Hỷ · Giới tính: {student.gender}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStudentForDetail(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="p-5 sm:p-6 pb-2 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-teal-600" /> Điểm TB hiện tại
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {stats.averageScore !== null ? `${stats.averageScore}/10` : '—'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" /> Tỷ lệ chuyên cần
              </span>
              <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
                {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '100%'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" /> Bài đã kiểm tra
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {stats.countAssessments} <span className="text-xs font-normal text-slate-500">bài</span>
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Ngày sinh
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-1.5 font-mono">
                {formatDateVN(student.birthDate) || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTabSub('assessments')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTabSub === 'assessments'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Kết quả học tập ({studentAssessments.length})
            </button>
            <button
              onClick={() => setActiveTabSub('attendance')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTabSub === 'attendance'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Lịch sử chuyên cần ({studentAttendanceHistory.length})
            </button>
            <button
              onClick={() => setActiveTabSub('notes')}
              className={`pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTabSub === 'notes'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Ghi chú rèn luyện & Theo dõi
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTabSub === 'assessments' && (
            <div>
              {studentAssessments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                  Chưa có bản ghi điểm nào cho học sinh này.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Ngày</th>
                        <th className="px-3.5 py-2.5">Môn học</th>
                        <th className="px-3.5 py-2.5">Tên bài kiểm tra</th>
                        <th className="px-3.5 py-2.5 text-center">Điểm số</th>
                        <th className="px-3.5 py-2.5">Nhận xét của giáo viên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentAssessments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-slate-500">
                            {formatDateVN(a.date)}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-800">{a.subject}</td>
                          <td className="px-3.5 py-2.5 text-slate-700">
                            {a.name}
                            {a.isDemo && (
                              <span className="ml-1.5 text-[10px] text-slate-400 italic">
                                (minh họa)
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-bold text-teal-700">
                            {a.score}/{a.maxScore || 10}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700">
                              {a.teacherComment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTabSub === 'attendance' && (
            <div>
              {studentAttendanceHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                  Chưa có buổi điểm danh nào được ghi nhận cho học sinh này.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Ngày</th>
                        <th className="px-3.5 py-2.5">Buổi</th>
                        <th className="px-3.5 py-2.5">Trạng thái</th>
                        <th className="px-3.5 py-2.5">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentAttendanceHistory.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-slate-500">{formatDateVN(h.date)}</td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-700">{h.session}</td>
                          <td className="px-3.5 py-2.5">{getStatusBadge(h.status)}</td>
                          <td className="px-3.5 py-2.5 text-slate-600 italic">
                            {h.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTabSub === 'notes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" /> Nhận xét quá trình học tập
                </span>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {student.academicNotes || 'Chưa có ghi chú chi tiết cho học sinh này.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-900 leading-relaxed">
                <span className="font-semibold">Định hướng bồi dưỡng của GV Xuân:</span> Củng cố trọng tâm các dạng toán đại số, theo dõi sát chuyên cần và động viên học sinh tích cực tương tác bài giảng trong giờ học.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Hồ sơ học sinh lưu nội bộ thiết bị giáo viên
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={() => setSelectedStudentForDetail(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                setSelectedStudentForDetail(null);
                setActiveTab('progress');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm điểm đánh giá
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
