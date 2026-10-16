import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { calculateStudentStats, formatDateVN } from '../../utils/storage';

export const ClassDetailModal: React.FC = () => {
  const {
    selectedClassForDetail,
    setSelectedClassForDetail,
    students,
    assessments,
    attendance,
    setActiveTab,
    setSelectedClassFilter,
    openStudentDetail,
  } = useApp();

  if (!selectedClassForDetail) return null;

  const currentClass = selectedClassForDetail;
  const classStudents = students.filter((s) => s.classId === currentClass.id);
  const classAssessments = assessments.filter((a) => a.classId === currentClass.id);
  const classAttendanceRecords = attendance.filter((a) => a.classId === currentClass.id);

  // Calculate attendance metrics
  let totalAttendanceEntries = 0;
  let presentEntries = 0;
  let lateEntries = 0;
  let excusedEntries = 0;
  let unexcusedEntries = 0;

  classAttendanceRecords.forEach((rec) => {
    rec.entries.forEach((entry) => {
      totalAttendanceEntries++;
      if (entry.status === 'present') presentEntries++;
      else if (entry.status === 'late') lateEntries++;
      else if (entry.status === 'excused') excusedEntries++;
      else if (entry.status === 'unexcused') unexcusedEntries++;
    });
  });

  const attendanceRate =
    totalAttendanceEntries > 0
      ? (((presentEntries + lateEntries) / totalAttendanceEntries) * 100).toFixed(1)
      : '100.0';

  // Calculate academic metrics
  const validScores = classAssessments.map((a) => (a.score / (a.maxScore || 10)) * 10);
  const classAverage =
    validScores.length > 0
      ? (validScores.reduce((sum, s) => sum + s, 0) / validScores.length).toFixed(1)
      : 'Chưa có điểm';

  const handleStartAttendance = () => {
    setSelectedClassFilter(currentClass.id);
    setSelectedClassForDetail(null);
    setActiveTab('attendance');
  };

  const handleViewStudents = () => {
    setSelectedClassFilter(currentClass.id);
    setSelectedClassForDetail(null);
    setActiveTab('students');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col text-slate-800 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{currentClass.name}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-500/30 text-teal-200 rounded">
                  Mã: {currentClass.code}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                GV: {currentClass.teacherName} · Trường THPT Đồng Hỷ · Năm học {currentClass.schoolYear}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedClassForDetail(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" /> Sĩ số học sinh
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {classStudents.length}{' '}
                <span className="text-xs font-normal text-slate-500">học sinh</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" /> Tỷ lệ chuyên cần
              </span>
              <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
                {attendanceRate}%
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-sky-600" /> Điểm TB môn
              </span>
              <p className="text-xl font-bold text-sky-600 mt-1 font-mono tabular-nums">
                {classAverage}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Số bài đánh giá
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {classAssessments.length}{' '}
                <span className="text-xs font-normal text-slate-500">bản ghi</span>
              </p>
            </div>
          </div>

          {/* Location & Notes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Phòng học:</span> {currentClass.room || 'Chưa xếp phòng'}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Khối:</span> Khối {currentClass.grade}
              </div>
            </div>
            {currentClass.notes && (
              <div className="pt-2 border-t border-slate-200 text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Ghi chú lớp học:</span> {currentClass.notes}
              </div>
            )}
          </div>

          {/* Student Roster Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Danh sách học sinh lớp {currentClass.code} ({classStudents.length})
              </h3>
              <button
                onClick={handleViewStudents}
                className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
              >
                Mở trong tab Học sinh &rarr;
              </button>
            </div>

            {classStudents.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                Lớp này hiện chưa có học sinh nào. Hãy thêm học sinh mới hoặc phân lớp vào đây.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Mã HS</th>
                        <th className="px-3 py-2.5">Họ và tên</th>
                        <th className="px-3 py-2.5">Giới tính</th>
                        <th className="px-3 py-2.5">Ngày sinh</th>
                        <th className="px-3 py-2.5 text-right">Điểm TB</th>
                        <th className="px-3 py-2.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map((s) => {
                        const stats = calculateStudentStats(s.id, assessments, attendance);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3 py-2 font-mono text-slate-500">{s.code}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {s.fullName}
                              {s.needsSupport && (
                                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-rose-50 text-rose-600 rounded">
                                  Cần hỗ trợ
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{s.gender}</td>
                            <td className="px-3 py-2 text-slate-500 font-mono">
                              {formatDateVN(s.birthDate)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                              {stats.averageScore !== null ? stats.averageScore : '—'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => {
                                  setSelectedClassForDetail(null);
                                  openStudentDetail(s.id);
                                }}
                                className="text-teal-700 hover:text-teal-900 font-medium hover:underline cursor-pointer"
                              >
                                Xem hồ sơ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Dữ liệu quản trị GV Nguyễn Thị Thanh Xuân
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={() => setSelectedClassForDetail(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleStartAttendance}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Điểm danh lớp {currentClass.code} ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
