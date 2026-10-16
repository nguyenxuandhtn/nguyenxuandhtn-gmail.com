import { AppDataState, ClassItem, StudentItem, AssessmentRecord, AttendanceRecord } from '../types';
import { DEFAULT_APP_STATE } from '../data/mockData';

const STORAGE_KEY = 'classroom_pro_dong_hy_v1';

export function loadAppState(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_STATE;
    }
    const parsed = JSON.parse(raw);
    // Basic schema sanity checks
    if (!Array.isArray(parsed.classes) || !Array.isArray(parsed.students)) {
      console.warn('Invalid stored data structure. Reverting to default.');
      return DEFAULT_APP_STATE;
    }
    return {
      classes: parsed.classes || [],
      students: parsed.students || [],
      assessments: parsed.assessments || [],
      attendance: parsed.attendance || [],
      activities: parsed.activities || [],
      isDemoLoaded: parsed.isDemoLoaded ?? false,
    };
  } catch (err) {
    console.error('Error reading localStorage:', err);
    return DEFAULT_APP_STATE;
  }
}

export function saveAppState(state: AppDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function clearAndResetAppState(): AppDataState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset storage:', err);
  }
  return DEFAULT_APP_STATE;
}

export function exportDataAsJson(state: AppDataState): void {
  const jsonString = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `classroom_pro_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseAndValidateJsonBackup(jsonString: string): AppDataState {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Tệp không đúng định dạng JSON.');
  }
  if (!Array.isArray(parsed.classes) || !Array.isArray(parsed.students)) {
    throw new Error('Dữ liệu JSON thiếu danh sách lớp học hoặc học sinh bắt buộc.');
  }
  return {
    classes: parsed.classes,
    students: parsed.students,
    assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
    attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
    activities: Array.isArray(parsed.activities) ? parsed.activities : [],
    isDemoLoaded: false,
  };
}

export function exportStudentsToCsv(students: StudentItem[], classes: ClassItem[]): void {
  const classMap = new Map(classes.map((c) => [c.id, c.code]));
  const headers = ['Mã học sinh', 'Họ và tên', 'Mã lớp', 'Giới tính', 'Ngày sinh', 'Trạng thái', 'Ghi chú'];
  
  const rows = students.map((s) => [
    `"${s.code}"`,
    `"${s.fullName}"`,
    `"${classMap.get(s.classId) || s.classId}"`,
    `"${s.gender}"`,
    `"${s.birthDate}"`,
    `"${s.status === 'active' ? 'Đang học' : s.status === 'transferred' ? 'Chuyển lớp' : 'Nghỉ học'}"`,
    `"${(s.academicNotes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `danh_sach_hoc_sinh_THPT_Dong_Hy_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAttendanceToCsv(
  attendanceList: AttendanceRecord[],
  classes: ClassItem[],
  students: StudentItem[]
): void {
  const classMap = new Map(classes.map((c) => [c.id, c.code]));
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const headers = ['Ngày', 'Buổi', 'Lớp', 'Mã HS', 'Họ tên', 'Trạng thái điểm danh', 'Ghi chú', 'Người điểm danh'];
  const statusLabels: Record<string, string> = {
    present: 'Có mặt',
    excused: 'Vắng có phép',
    unexcused: 'Vắng không phép',
    late: 'Đi muộn',
  };

  const rows: string[] = [];

  attendanceList.forEach((record) => {
    const className = classMap.get(record.classId) || record.classId;
    record.entries.forEach((entry) => {
      const student = studentMap.get(entry.studentId);
      const studentCode = student ? student.code : entry.studentId;
      const studentName = student ? student.fullName : 'Học sinh đã xóa';
      const statusText = statusLabels[entry.status] || entry.status;
      rows.push(
        [
          `"${formatDateVN(record.date)}"`,
          `"${record.session}"`,
          `"${className}"`,
          `"${studentCode}"`,
          `"${studentName}"`,
          `"${statusText}"`,
          `"${(entry.notes || '').replace(/"/g, '""')}"`,
          `"${record.recordedBy || 'Nguyễn Thị Thanh Xuân'}"`,
        ].join(',')
      );
    });
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `so_diem_danh_THPT_Dong_Hy_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function calculateStudentStats(
  studentId: string,
  assessments: AssessmentRecord[],
  attendanceList: AttendanceRecord[]
) {
  // Assessments
  const validAssessments = assessments.filter((a) => a.studentId === studentId && !isNaN(a.score));
  const countAssessments = validAssessments.length;
  const averageScore =
    countAssessments > 0
      ? validAssessments.reduce((sum, a) => sum + (a.score / (a.maxScore || 10)) * 10, 0) / countAssessments
      : null;

  // Attendance
  let totalSessions = 0;
  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;

  attendanceList.forEach((att) => {
    const entry = att.entries.find((e) => e.studentId === studentId);
    if (entry) {
      totalSessions++;
      if (entry.status === 'present') presentCount++;
      else if (entry.status === 'excused') excusedCount++;
      else if (entry.status === 'unexcused') unexcusedCount++;
      else if (entry.status === 'late') lateCount++;
    }
  });

  // Tỷ lệ chuyên cần chuẩn: Có mặt / Tổng số buổi được điểm danh * 100% (Đi muộn tính riêng, không coi là vắng mặt)
  const attendanceRate = totalSessions > 0 ? ((presentCount + lateCount) / totalSessions) * 100 : null;

  return {
    countAssessments,
    averageScore: averageScore !== null ? Number(averageScore.toFixed(1)) : null,
    totalSessions,
    presentCount,
    excusedCount,
    unexcusedCount,
    lateCount,
    attendanceRate: attendanceRate !== null ? Number(attendanceRate.toFixed(1)) : null,
  };
}
