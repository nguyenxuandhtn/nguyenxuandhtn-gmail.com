import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassItem } from '../../types';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Users,
  CalendarCheck,
  Award,
  Edit2,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { TEACHER_NAME } from '../../data/mockData';

interface ClassesTabProps {
  onOpenAddClass: () => void;
}

export const ClassesTab: React.FC<ClassesTabProps> = ({ onOpenAddClass }) => {
  const {
    classes,
    students,
    assessments,
    attendance,
    updateClass,
    deleteClass,
    openClassDetail,
    setActiveTab,
    setSelectedClassFilter,
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '10' | '11' | '12'>('all');

  // Edit Class Modal state
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  // Delete Confirmation state
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // Form states for Edit
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState<10 | 11 | 12>(10);
  const [editSchoolYear, setEditSchoolYear] = useState('2025-2026');
  const [editRoom, setEditRoom] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleStartEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setEditCode(cls.code);
    setEditName(cls.name);
    setEditGrade(cls.grade);
    setEditSchoolYear(cls.schoolYear);
    setEditRoom(cls.room || '');
    setEditNotes(cls.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editCode.trim() || !editName.trim()) return;

    updateClass({
      ...editingClass,
      code: editCode.trim().toUpperCase(),
      name: editName.trim(),
      grade: editGrade,
      schoolYear: editSchoolYear.trim(),
      room: editRoom.trim(),
      notes: editNotes.trim(),
    });
    setEditingClass(null);
  };

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchSearch =
        cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGrade = gradeFilter === 'all' || cls.grade.toString() === gradeFilter;

      return matchSearch && matchGrade;
    });
  }, [classes, searchQuery, gradeFilter]);

  // Sĩ số map for each class
  const classStudentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach((c) => map.set(c.id, 0));
    students.forEach((s) => {
      if (s.classId) {
        map.set(s.classId, (map.get(s.classId) || 0) + 1);
      }
    });
    return map;
  }, [classes, students]);

  // Attendance rate map for each class
  const classAttendanceRateMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => {
      const recs = attendance.filter((a) => a.classId === c.id);
      let total = 0;
      let present = 0;
      recs.forEach((r) => {
        r.entries.forEach((e) => {
          total++;
          if (e.status === 'present' || e.status === 'late') present++;
        });
      });
      map.set(c.id, total > 0 ? ((present / total) * 100).toFixed(1) : '100.0');
    });
    return map;
  }, [classes, attendance]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-600" />
            Quản lý Lớp học THPT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giáo viên phụ trách: <span className="font-semibold text-slate-700">{TEACHER_NAME}</span> · Trường THPT Đồng Hỷ
          </p>
        </div>

        <button
          onClick={onOpenAddClass}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Thêm lớp học mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã lớp, tên lớp, phòng..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Grade Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setGradeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                gradeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả khối
            </button>
            <button
              onClick={() => setGradeFilter('10')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                gradeFilter === '10'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 10
            </button>
            <button
              onClick={() => setGradeFilter('11')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                gradeFilter === '11'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 11
            </button>
            <button
              onClick={() => setGradeFilter('12')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                gradeFilter === '12'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 12
            </button>
          </div>

          {/* Grid vs Table View Mode */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Class Content */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-800">Không tìm thấy lớp học phù hợp</p>
          <p className="text-xs text-slate-500 mt-1">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc khối lớp.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredClasses.map((cls) => {
            const studentCount = classStudentCountMap.get(cls.id) || 0;
            const attRate = classAttendanceRateMap.get(cls.id) || '100.0';

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold text-lg font-mono">
                        {cls.code}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight">
                          {cls.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Khối {cls.grade} · Năm học {cls.schoolYear}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cls)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin lớp"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingClassId(cls.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa lớp học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Class Meta Data & Room */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50">
                      <span className="text-slate-400 text-[11px] block">Sĩ số lớp</span>
                      <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                        {studentCount} học sinh
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50">
                      <span className="text-slate-400 text-[11px] block">Chuyên cần TB</span>
                      <span className="font-bold text-emerald-600 font-mono text-sm tabular-nums">
                        {attRate}%
                      </span>
                    </div>
                  </div>

                  {/* Room & Teacher */}
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.room || 'Phòng bộ môn THPT Đồng Hỷ'}</span>
                    </div>
                    {cls.notes && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1">
                        {cls.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openClassDetail(cls.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem chi tiết lớp &rarr;
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClassFilter(cls.id);
                      setActiveTab('attendance');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                    Điểm danh
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Mã lớp</th>
                  <th className="px-4 py-3">Tên lớp</th>
                  <th className="px-4 py-3">Khối</th>
                  <th className="px-4 py-3 text-center">Sĩ số</th>
                  <th className="px-4 py-3 text-center">Chuyên cần</th>
                  <th className="px-4 py-3">Phòng học</th>
                  <th className="px-4 py-3">Giáo viên phụ trách</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => {
                  const studentCount = classStudentCountMap.get(cls.id) || 0;
                  const attRate = classAttendanceRateMap.get(cls.id) || '100.0';

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-700">{cls.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{cls.name}</td>
                      <td className="px-4 py-3 text-slate-600">Khối {cls.grade}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {studentCount}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-600 font-semibold">
                        {attRate}%
                      </td>
                      <td className="px-4 py-3 text-slate-600">{cls.room || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{cls.teacherName}</td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openClassDetail(cls.id)}
                          className="text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleStartEdit(cls)}
                          className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeletingClassId(cls.id)}
                          className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
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
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-teal-600" />
              Chỉnh sửa lớp học {editingClass.code}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã lớp (Ví dụ: 10A1)</label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên lớp đầy đủ</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={editSchoolYear}
                    onChange={(e) => setEditSchoolYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  placeholder="Ví dụ: Phòng 201 - Nhà A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú lớp học</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingClassId !== null}
        title="Xác nhận xóa lớp học?"
        message="Hành động này sẽ xóa lớp khỏi danh sách quản lý. Học sinh thuộc lớp này sẽ được chuyển về trạng thái 'Chưa phân lớp' để đảm bảo không mất dữ liệu học sinh."
        confirmText="Xóa lớp"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={() => {
          if (deletingClassId) {
            deleteClass(deletingClassId);
            setDeletingClassId(null);
          }
        }}
        onCancel={() => setDeletingClassId(null)}
      />
    </div>
  );
};
