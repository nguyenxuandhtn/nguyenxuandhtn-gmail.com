export type StudentStatus = 'active' | 'transferred' | 'dropped';

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export type AttendanceSession = 'Sáng' | 'Chiều';

export interface ClassItem {
  id: string;
  code: string; // e.g. "10A1"
  name: string; // e.g. "Lớp 10A1 - Ban Khoa học tự nhiên"
  grade: 10 | 11 | 12;
  schoolYear: string; // e.g. "2025-2026"
  teacherName: string; // "Nguyễn Thị Thanh Xuân"
  room: string;
  notes: string;
  createdAt: string;
}

export interface StudentItem {
  id: string;
  code: string; // e.g. "HS1001"
  fullName: string;
  classId: string;
  gender: 'Nam' | 'Nữ';
  birthDate: string; // YYYY-MM-DD
  status: StudentStatus;
  academicNotes: string;
  needsSupport?: boolean;
  createdAt: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  name: string; // e.g. "Kiểm tra 15 phút - Đại số"
  date: string; // YYYY-MM-DD
  score: number;
  maxScore: number;
  teacherComment: string;
  needsSupport?: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  session: AttendanceSession;
  entries: AttendanceEntry[];
  recordedBy: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'class' | 'student' | 'attendance' | 'assessment' | 'system';
  title: string;
  description: string;
}

export interface AppDataState {
  classes: ClassItem[];
  students: StudentItem[];
  assessments: AssessmentRecord[];
  attendance: AttendanceRecord[];
  activities: ActivityLog[];
  isDemoLoaded: boolean;
}
