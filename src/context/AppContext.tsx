import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppDataState,
  ClassItem,
  StudentItem,
  AssessmentRecord,
  AttendanceRecord,
  AttendanceEntry,
  ActivityLog,
  AttendanceSession,
} from '../types';
import {
  loadAppState,
  saveAppState,
  clearAndResetAppState,
  exportDataAsJson,
  parseAndValidateJsonBackup,
  exportStudentsToCsv,
  exportAttendanceToCsv,
} from '../utils/storage';

export type NavTab = 'overview' | 'classes' | 'students' | 'progress' | 'attendance';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextValue {
  classes: ClassItem[];
  students: StudentItem[];
  assessments: AssessmentRecord[];
  attendance: AttendanceRecord[];
  activities: ActivityLog[];
  isDemoLoaded: boolean;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedClassFilter: string;
  setSelectedClassFilter: (id: string) => void;

  // Modals & Navigation helpers
  openClassDetail: (classId: string) => void;
  openStudentDetail: (studentId: string) => void;
  selectedStudentForDetail: StudentItem | null;
  setSelectedStudentForDetail: (student: StudentItem | null) => void;
  selectedClassForDetail: ClassItem | null;
  setSelectedClassForDetail: (c: ClassItem | null) => void;

  // CRUD Classes
  addClass: (item: Omit<ClassItem, 'id' | 'createdAt'>) => ClassItem;
  updateClass: (item: ClassItem) => void;
  deleteClass: (id: string) => { success: boolean; message: string };

  // CRUD Students
  addStudent: (item: Omit<StudentItem, 'id' | 'createdAt'>) => StudentItem;
  updateStudent: (item: StudentItem) => void;
  deleteStudent: (id: string) => void;
  importBulkStudents: (items: Omit<StudentItem, 'id' | 'createdAt'>[]) => number;

  // CRUD Assessments
  addAssessment: (item: Omit<AssessmentRecord, 'id' | 'createdAt'>) => AssessmentRecord;
  updateAssessment: (item: AssessmentRecord) => void;
  deleteAssessment: (id: string) => void;

  // Attendance
  saveAttendanceSheet: (
    classId: string,
    date: string,
    session: AttendanceSession,
    entries: AttendanceEntry[]
  ) => void;
  deleteAttendanceRecord: (id: string) => void;

  // Backup & Reset
  resetDemoData: () => void;
  exportBackupJson: () => void;
  importBackupJson: (content: string) => boolean;
  exportStudentsCsv: () => void;
  exportAttendanceCsv: () => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppDataState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentItem | null>(null);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<ClassItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Automatically persist changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logActivity = useCallback((type: ActivityLog['type'], title: string, description: string) => {
    const newAct: ActivityLog = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      type,
      title,
      description,
    };
    setState((prev) => ({
      ...prev,
      activities: [newAct, ...(prev.activities || [])].slice(0, 30),
    }));
  }, []);

  // Class Actions
  const addClass = useCallback(
    (item: Omit<ClassItem, 'id' | 'createdAt'>): ClassItem => {
      const newClass: ClassItem = {
        ...item,
        id: 'cls-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        classes: [...prev.classes, newClass],
      }));
      logActivity('class', `Thêm lớp ${newClass.code}`, `Đã thêm lớp ${newClass.code} vào hệ thống.`);
      addToast('success', `Đã thêm lớp ${newClass.code} thành công.`);
      return newClass;
    },
    [addToast, logActivity]
  );

  const updateClass = useCallback(
    (item: ClassItem) => {
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((c) => (c.id === item.id ? item : c)),
      }));
      logActivity('class', `Cập nhật lớp ${item.code}`, `Thông tin lớp ${item.code} đã được chỉnh sửa.`);
      addToast('success', `Cập nhật lớp ${item.code} thành công.`);
    },
    [addToast, logActivity]
  );

  const deleteClass = useCallback(
    (id: string): { success: boolean; message: string } => {
      const target = state.classes.find((c) => c.id === id);
      const studentCount = state.students.filter((s) => s.classId === id).length;
      if (!target) return { success: false, message: 'Không tìm thấy lớp' };

      setState((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== id),
        // Keep students but clear their class or leave note
        students: prev.students.map((s) => (s.classId === id ? { ...s, classId: '' } : s)),
      }));

      logActivity(
        'class',
        `Xóa lớp ${target.code}`,
        `Đã xóa lớp ${target.code}. ${studentCount} học sinh được chuyển trạng thái chưa phân lớp.`
      );
      addToast('success', `Đã xóa lớp ${target.code} thành công.`);
      return { success: true, message: 'Đã xóa lớp' };
    },
    [state.classes, state.students, addToast, logActivity]
  );

  // Student Actions
  const addStudent = useCallback(
    (item: Omit<StudentItem, 'id' | 'createdAt'>): StudentItem => {
      const newStudent: StudentItem = {
        ...item,
        id: 'hs-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        students: [...prev.students, newStudent],
      }));
      logActivity('student', `Thêm học sinh mới`, `Đã thêm ${newStudent.fullName} (${newStudent.code}).`);
      addToast('success', `Đã thêm học sinh ${newStudent.fullName} thành công.`);
      return newStudent;
    },
    [addToast, logActivity]
  );

  const updateStudent = useCallback(
    (item: StudentItem) => {
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === item.id ? item : s)),
      }));
      logActivity('student', `Cập nhật học sinh`, `Hồ sơ của ${item.fullName} (${item.code}) đã được cập nhật.`);
      addToast('success', `Đã cập nhật học sinh ${item.fullName}.`);
    },
    [addToast, logActivity]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      const target = state.students.find((s) => s.id === id);
      setState((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id),
        // Preserve historical assessments and attendance or cleanly keep records
        assessments: prev.assessments.filter((a) => a.studentId !== id),
        attendance: prev.attendance.map((att) => ({
          ...att,
          entries: att.entries.filter((e) => e.studentId !== id),
        })),
      }));
      if (target) {
        logActivity('student', `Xóa học sinh`, `Đã xóa học sinh ${target.fullName} (${target.code}).`);
        addToast('success', `Đã xóa học sinh ${target.fullName}.`);
      }
    },
    [state.students, addToast, logActivity]
  );

  const importBulkStudents = useCallback(
    (items: Omit<StudentItem, 'id' | 'createdAt'>[]): number => {
      let count = 0;
      const newItems: StudentItem[] = [];
      const existingCodes = new Set(state.students.map((s) => s.code.toLowerCase()));

      items.forEach((item, index) => {
        if (!item.fullName || !item.code) return;
        if (existingCodes.has(item.code.toLowerCase())) {
          return; // skip duplicate code
        }
        existingCodes.add(item.code.toLowerCase());
        newItems.push({
          ...item,
          id: 'hs-' + Date.now() + '-' + index,
          createdAt: new Date().toISOString(),
        });
        count++;
      });

      if (newItems.length > 0) {
        setState((prev) => ({
          ...prev,
          students: [...prev.students, ...newItems],
        }));
        logActivity('student', `Nhập ${count} học sinh từ CSV`, `Đã nhập thêm ${count} học sinh vào hệ thống.`);
        addToast('success', `Đã nhập thành công ${count} học sinh mới.`);
      } else {
        addToast('warning', 'Không có học sinh mới nào được thêm (trùng mã hoặc dữ liệu trống).');
      }
      return count;
    },
    [state.students, addToast, logActivity]
  );

  // Assessment Actions
  const addAssessment = useCallback(
    (item: Omit<AssessmentRecord, 'id' | 'createdAt'>): AssessmentRecord => {
      const newRec: AssessmentRecord = {
        ...item,
        id: 'asm-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        assessments: [newRec, ...prev.assessments],
      }));
      logActivity('assessment', `Thêm điểm đánh giá`, `Ghi nhận điểm ${newRec.score}/${newRec.maxScore} môn ${newRec.subject}.`);
      addToast('success', `Đã thêm bản ghi đánh giá thành công.`);
      return newRec;
    },
    [addToast, logActivity]
  );

  const updateAssessment = useCallback(
    (item: AssessmentRecord) => {
      setState((prev) => ({
        ...prev,
        assessments: prev.assessments.map((a) => (a.id === item.id ? item : a)),
      }));
      logActivity('assessment', `Sửa bản ghi điểm`, `Đã cập nhật bài ${item.name} (${item.score} điểm).`);
      addToast('success', `Đã cập nhật kết quả đánh giá.`);
    },
    [addToast, logActivity]
  );

  const deleteAssessment = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        assessments: prev.assessments.filter((a) => a.id !== id),
      }));
      logActivity('assessment', `Xóa bản ghi điểm`, `Đã xóa 1 bản ghi kết quả học tập.`);
      addToast('success', `Đã xóa bản ghi đánh giá.`);
    },
    [addToast, logActivity]
  );

  // Attendance Actions
  const saveAttendanceSheet = useCallback(
    (classId: string, date: string, session: AttendanceSession, entries: AttendanceEntry[]) => {
      const classItem = state.classes.find((c) => c.id === classId);
      const className = classItem ? classItem.code : 'Lớp';

      // Check if there is already a record for same class, date, session
      setState((prev) => {
        const existingIndex = prev.attendance.findIndex(
          (a) => a.classId === classId && a.date === date && a.session === session
        );

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev.attendance];
          updated[existingIndex] = {
            ...updated[existingIndex],
            entries,
            updatedAt: new Date().toISOString(),
          };
          return { ...prev, attendance: updated };
        } else {
          // Create new record
          const newRecord: AttendanceRecord = {
            id: 'att-' + Date.now(),
            classId,
            date,
            session,
            entries,
            recordedBy: 'Nguyễn Thị Thanh Xuân',
            updatedAt: new Date().toISOString(),
          };
          return { ...prev, attendance: [newRecord, ...prev.attendance] };
        }
      });

      const presentCount = entries.filter((e) => e.status === 'present').length;
      const lateCount = entries.filter((e) => e.status === 'late').length;
      const excusedCount = entries.filter((e) => e.status === 'excused').length;
      const unexcusedCount = entries.filter((e) => e.status === 'unexcused').length;

      logActivity(
        'attendance',
        `Lưu điểm danh ${className}`,
        `Buổi ${session} ${date}: ${presentCount} có mặt, ${lateCount} đi muộn, ${excusedCount} có phép, ${unexcusedCount} không phép.`
      );
      addToast('success', `Đã lưu điểm danh lớp ${className} (${session} - ${date}) thành công.`);
    },
    [state.classes, addToast, logActivity]
  );

  const deleteAttendanceRecord = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        attendance: prev.attendance.filter((a) => a.id !== id),
      }));
      logActivity('attendance', `Xóa bản ghi điểm danh`, `Đã xóa 1 buổi điểm danh.`);
      addToast('success', `Đã xóa buổi điểm danh.`);
    },
    [addToast, logActivity]
  );

  // Reset & Backup
  const resetDemoData = useCallback(() => {
    const fresh = clearAndResetAppState();
    setState(fresh);
    addToast('info', 'Đã khôi phục dữ liệu mẫu minh họa ban đầu của THPT Đồng Hỷ.');
  }, [addToast]);

  const exportBackupJson = useCallback(() => {
    exportDataAsJson(state);
    addToast('success', 'Đã tải tệp JSON sao lưu dữ liệu về máy.');
  }, [state, addToast]);

  const importBackupJson = useCallback(
    (content: string): boolean => {
      try {
        const validated = parseAndValidateJsonBackup(content);
        setState(validated);
        addToast('success', 'Nhập dữ liệu sao lưu thành công!');
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
        addToast('error', `Không thể nhập dữ liệu: ${msg}`);
        return false;
      }
    },
    [addToast]
  );

  const exportStudentsCsv = useCallback(() => {
    exportStudentsToCsv(state.students, state.classes);
    addToast('success', 'Đã xuất danh sách học sinh ra file CSV (chuẩn tiếng Việt Excel).');
  }, [state.students, state.classes, addToast]);

  const exportAttendanceCsv = useCallback(() => {
    exportAttendanceToCsv(state.attendance, state.classes, state.students);
    addToast('success', 'Đã xuất dữ liệu điểm danh ra file CSV.');
  }, [state.attendance, state.classes, state.students, addToast]);

  const openClassDetail = useCallback(
    (classId: string) => {
      const cls = state.classes.find((c) => c.id === classId) || null;
      setSelectedClassForDetail(cls);
    },
    [state.classes]
  );

  const openStudentDetail = useCallback(
    (studentId: string) => {
      const stu = state.students.find((s) => s.id === studentId) || null;
      setSelectedStudentForDetail(stu);
    },
    [state.students]
  );

  const value = useMemo(
    () => ({
      classes: state.classes,
      students: state.students,
      assessments: state.assessments,
      attendance: state.attendance,
      activities: state.activities,
      isDemoLoaded: state.isDemoLoaded,
      activeTab,
      setActiveTab,
      selectedClassFilter,
      setSelectedClassFilter,

      openClassDetail,
      openStudentDetail,
      selectedStudentForDetail,
      setSelectedStudentForDetail,
      selectedClassForDetail,
      setSelectedClassForDetail,

      addClass,
      updateClass,
      deleteClass,

      addStudent,
      updateStudent,
      deleteStudent,
      importBulkStudents,

      addAssessment,
      updateAssessment,
      deleteAssessment,

      saveAttendanceSheet,
      deleteAttendanceRecord,

      resetDemoData,
      exportBackupJson,
      importBackupJson,
      exportStudentsCsv,
      exportAttendanceCsv,

      toasts,
      addToast,
      removeToast,
    }),
    [
      state,
      activeTab,
      selectedClassFilter,
      openClassDetail,
      openStudentDetail,
      selectedStudentForDetail,
      selectedClassForDetail,
      addClass,
      updateClass,
      deleteClass,
      addStudent,
      updateStudent,
      deleteStudent,
      importBulkStudents,
      addAssessment,
      updateAssessment,
      deleteAssessment,
      saveAttendanceSheet,
      deleteAttendanceRecord,
      resetDemoData,
      exportBackupJson,
      importBackupJson,
      exportStudentsCsv,
      exportAttendanceCsv,
      toasts,
      addToast,
      removeToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
