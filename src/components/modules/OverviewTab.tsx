import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  Percent,
  AlertTriangle,
  Plus,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { calculateStudentStats, formatDateVN } from '../../utils/storage';
import { UPCOMING_SCHEDULE } from '../../data/mockData';

interface OverviewTabProps {
  onOpenAddClass: () => void;
  onOpenAddStudent: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenAddClass, onOpenAddStudent }) => {
  const {
    classes,
    students,
    assessments,
    attendance,
    activities,
    setActiveTab,
    setSelectedClassFilter,
    openStudentDetail,
    openClassDetail,
  } = useApp();

  // 1. Calculate real-time stats directly from state
  const totalClasses = classes.length;
  const totalStudents = students.length;

  // Latest attendance session analysis
  const latestAttendanceRecord = useMemo(() => {
    if (attendance.length === 0) return null;
    return [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [attendance]);

  const latestAttendanceStats = useMemo(() => {
    if (!latestAttendanceRecord || latestAttendanceRecord.entries.length === 0) {
      return { present: 0, excused: 0, unexcused: 0, late: 0, total: 0, rate: 0 };
    }
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let late = 0;
    latestAttendanceRecord.entries.forEach((e) => {
      if (e.status === 'present') present++;
      else if (e.status === 'excused') excused++;
      else if (e.status === 'unexcused') unexcused++;
      else if (e.status === 'late') late++;
    });
    const total = latestAttendanceRecord.entries.length;
    // Formula: (present + late) / total * 100
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;
    return { present, excused, unexcused, late, total, rate };
  }, [latestAttendanceRecord]);

  // Overall attendance rate across all recorded sessions
  const overallAttendanceRate = useMemo(() => {
    if (attendance.length === 0) return '100.0';
    let totalEntries = 0;
    let attended = 0;
    attendance.forEach((rec) => {
      rec.entries.forEach((e) => {
        totalEntries++;
        if (e.status === 'present' || e.status === 'late') {
          attended++;
        }
      });
    });
    if (totalEntries === 0) return '100.0';
    return ((attended / totalEntries) * 100).toFixed(1);
  }, [attendance]);

  // Students needing attention (flagged by teacher, or average score < 5.0, or unexcused absences > 0)
  const studentsNeedingAttention = useMemo(() => {
    return students
      .map((s) => {
        const stats = calculateStudentStats(s.id, assessments, attendance);
        const reasons: string[] = [];
        if (s.needsSupport) reasons.push('Được giáo viên lưu ý');
        if (stats.averageScore !== null && stats.averageScore < 5.0) {
          reasons.push(`Điểm TB thấp (${stats.averageScore}/10)`);
        }
        if (stats.unexcusedCount > 0) {
          reasons.push(`Có ${stats.unexcusedCount} buổi vắng không phép`);
        }
        if (stats.attendanceRate !== null && stats.attendanceRate < 85) {
          reasons.push(`Chuyên cần thấp (${stats.attendanceRate}%)`);
        }
        return {
          student: s,
          stats,
          reasons,
          isAlert: reasons.length > 0,
        };
      })
      .filter((item) => item.isAlert)
      .slice(0, 6);
  }, [students, assessments, attendance]);

  // Attendance trend chart data (last 7 recorded dates)
  const attendanceTrendData = useMemo(() => {
    if (attendance.length === 0) return [];
    // Group attendance by date
    const dateMap = new Map<string, { present: number; total: number }>();
    attendance.forEach((rec) => {
      const prev = dateMap.get(rec.date) || { present: 0, total: 0 };
      rec.entries.forEach((e) => {
        prev.total++;
        if (e.status === 'present' || e.status === 'late') {
          prev.present++;
        }
      });
      dateMap.set(rec.date, prev);
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-7)
      .map(([date, data]) => ({
        date,
        label: formatDateVN(date),
        rate: data.total > 0 ? Number(((data.present / data.total) * 100).toFixed(1)) : 100,
        total: data.total,
      }));
  }, [attendance]);

  // Class academic comparison data
  const classPerformanceData = useMemo(() => {
    return classes.map((c) => {
      const classAssessments = assessments.filter((a) => a.classId === c.id && !isNaN(a.score));
      const avg =
        classAssessments.length > 0
          ? classAssessments.reduce((sum, a) => sum + (a.score / (a.maxScore || 10)) * 10, 0) /
            classAssessments.length
          : 0;
      const classStudentCount = students.filter((s) => s.classId === c.id).length;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        average: Number(avg.toFixed(1)),
        count: classAssessments.length,
        studentCount: classStudentCount,
      };
    });
  }, [classes, assessments, students]);

  // Empty state if no classes or students
  if (totalClasses === 0 && totalStudents === 0) {
    return (
      <div className="p-8 sm:p-12 max-w-3xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Chào mừng cô Nguyễn Thị Thanh Xuân đến với Classroom Pro!
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
            Hệ thống chưa có dữ liệu lớp học nào. Hãy bắt đầu bằng cách thêm lớp học đầu tiên hoặc tải lại dữ liệu mẫu minh họa của Trường THPT Đồng Hỷ.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenAddClass}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm lớp học đầu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded">
                THPT Đồng Hỷ
              </span>
              <span className="text-xs text-slate-400">Không gian quản trị giảng dạy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              Bảng điều khiển lớp học – GV Nguyễn Thị Thanh Xuân
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Theo dõi toàn diện {totalStudents} học sinh trên {totalClasses} lớp học phụ trách. Dữ liệu được tính toán tự động và đồng bộ tức thời.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenAddClass}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              Thêm lớp
            </button>
            <button
              onClick={onOpenAddStudent}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              Thêm học sinh
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Điểm danh ngay
            </button>
          </div>
        </div>
      </div>

      {/* 6 Top Metric Cards (Calculated directly from real state) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Classes */}
        <div
          onClick={() => setActiveTab('classes')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-500/50 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng lớp học</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalClasses}
          </p>
          <span className="text-[11px] text-teal-700 font-medium flex items-center gap-0.5 mt-1">
            Quản lý danh sách &rarr;
          </span>
        </div>

        {/* Total Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-500/50 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng học sinh</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalStudents}
          </p>
          <span className="text-[11px] text-sky-700 font-medium flex items-center gap-0.5 mt-1">
            Xem hồ sơ học sinh &rarr;
          </span>
        </div>

        {/* Present (Latest session) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Có mặt buổi gần nhất</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2 font-mono tabular-nums">
            {latestAttendanceStats.present + latestAttendanceStats.late}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {latestAttendanceRecord
              ? `Lớp ${classes.find((c) => c.id === latestAttendanceRecord.classId)?.code || ''} (${
                  latestAttendanceRecord.session
                })`
              : 'Chưa có buổi'}
          </p>
        </div>

        {/* Absent (Latest session) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Vắng mặt buổi gần nhất</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2 font-mono tabular-nums">
            {latestAttendanceStats.excused + latestAttendanceStats.unexcused}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {latestAttendanceStats.excused} có phép · {latestAttendanceStats.unexcused} không phép
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tỷ lệ chuyên cần</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2 font-mono tabular-nums">
            {overallAttendanceRate}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {attendance.length} buổi điểm danh
          </p>
        </div>

        {/* Students needing progress tracking */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cần theo dõi tiến độ</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2 font-mono tabular-nums">
            {studentsNeedingAttention.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Học sinh cần hỗ trợ thêm</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Biểu đồ tỷ lệ chuyên cần theo thời gian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tỷ lệ học sinh tham gia học tập theo từng ngày điểm danh
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Mục tiêu &ge; 95%
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-end min-h-[220px]">
            {attendanceTrendData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                Chưa có đủ lịch sử điểm danh để vẽ biểu đồ xu hướng.
              </div>
            ) : (
              <div className="w-full space-y-3">
                <div className="h-44 flex items-end gap-2 sm:gap-4 pt-4 px-2">
                  {attendanceTrendData.map((d, index) => {
                    const heightPercent = Math.max(15, Math.min(100, d.rate));
                    const isGood = d.rate >= 90;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 font-mono">
                          {d.rate}% ({d.total} lượt)
                        </div>
                        {/* Bar */}
                        <div className="w-full bg-slate-100 rounded-t-md h-full flex items-end">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              isGood ? 'bg-teal-600 group-hover:bg-teal-500' : 'bg-amber-500 group-hover:bg-amber-400'
                            }`}
                          />
                        </div>
                        {/* Date label */}
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-full">
                          {d.label.slice(0, 5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block"></span>
                      Đạt chuẩn (&ge;90%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
                      Cần nhắc nhở (&lt;90%)
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">Đơn vị: % chuyên cần</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Academic Comparison by Class */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                Kết quả học tập & Điểm trung bình theo lớp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh điểm trung bình các lớp THPT do cô Xuân phụ trách
              </p>
            </div>
            <button
              onClick={() => setActiveTab('progress')}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium hover:underline cursor-pointer"
            >
              Chi tiết sổ điểm &rarr;
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3.5">
            {classPerformanceData.map((cls) => {
              const widthPct = Math.min(100, Math.max(10, (cls.average / 10) * 100));
              return (
                <div
                  key={cls.id}
                  onClick={() => openClassDetail(cls.id)}
                  className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 group-hover:text-teal-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Lớp {cls.code}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({cls.studentCount} HS · {cls.count} bài KT)
                      </span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {cls.average > 0 ? `${cls.average} / 10` : 'Chưa có điểm'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        cls.average >= 8.0
                          ? 'bg-teal-600'
                          : cls.average >= 6.5
                          ? 'bg-sky-600'
                          : cls.average > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Columns: Students Needing Attention & Upcoming Teaching Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students needing attention (2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Danh sách học sinh cần chú ý & theo dõi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các học sinh có điểm dưới trung bình, vắng không phép hoặc giáo viên đánh dấu
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {studentsNeedingAttention.length} học sinh
            </span>
          </div>

          {studentsNeedingAttention.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
              Hiện tại tất cả học sinh đều duy trì tiến độ học tập và chuyên cần tốt!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {studentsNeedingAttention.map(({ student, stats, reasons }) => {
                const cls = classes.find((c) => c.id === student.classId);
                return (
                  <div
                    key={student.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        HS
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900">
                            {student.fullName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">({student.code})</span>
                          {cls && (
                            <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                              {cls.code}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {reasons.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-medium"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right text-xs">
                        <span className="text-slate-400 block text-[10px]">Điểm TB</span>
                        <span className="font-mono font-bold text-slate-800">
                          {stats.averageScore !== null ? `${stats.averageScore}/10` : '—'}
                        </span>
                      </div>
                      <button
                        onClick={() => openStudentDetail(student.id)}
                        className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Hồ sơ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Teaching Schedule / Timetable (THPT Đồng Hỷ) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Lịch giảng dạy & Buổi học sắp tới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Thời khóa biểu giảng dạy THPT</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {UPCOMING_SCHEDULE.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span className="flex items-center gap-1.5 text-teal-700">
                    <Clock className="w-3.5 h-3.5" />
                    {item.day} · {item.time}
                  </span>
                  <span className="px-2 py-0.5 bg-teal-100/80 text-teal-800 rounded font-mono font-bold">
                    Lớp {item.classCode}
                  </span>
                </div>
                <div className="font-medium text-slate-900">{item.topic}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>{item.subject}</span>
                  <span className="italic">{item.room}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Phòng Giáo vụ THPT Đồng Hỷ phê duyệt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
