import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentItem, StudentStatus } from '../../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  UserCheck,
  UserX,
} from 'lucide-react';
import { calculateStudentStats, formatDateVN } from '../../utils/storage';
import { ConfirmModal } from '../common/ConfirmModal';

interface StudentsTabProps {
  onOpenAddStudent: () => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ onOpenAddStudent }) => {
  const {
    students,
    classes,
    assessments,
    attendance,
    updateStudent,
    deleteStudent,
    openStudentDetail,
    selectedClassFilter,
    setSelectedClassFilter,
    exportStudentsCsv,
    importBulkStudents,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'class' | 'gpa'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  // Delete Student State
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // CSV Import Modal State
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvPreviewItems, setCsvPreviewItems] = useState<Omit<StudentItem, 'id' | 'createdAt'>[]>([]);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Edit
  const [editFullName, setEditFullName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editGender, setEditGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editStatus, setEditStatus] = useState<StudentStatus>('active');
  const [editNotes, setEditNotes] = useState('');
  const [editNeedsSupport, setEditNeedsSupport] = useState(false);

  const handleStartEdit = (stu: StudentItem) => {
    setEditingStudent(stu);
    setEditFullName(stu.fullName);
    setEditCode(stu.code);
    setEditClassId(stu.classId || '');
    setEditGender(stu.gender);
    setEditBirthDate(stu.birthDate || '');
    setEditStatus(stu.status);
    setEditNotes(stu.academicNotes || '');
    setEditNeedsSupport(stu.needsSupport ?? false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editFullName.trim() || !editCode.trim()) return;

    updateStudent({
      ...editingStudent,
      fullName: editFullName.trim(),
      code: editCode.trim().toUpperCase(),
      classId: editClassId,
      gender: editGender,
      birthDate: editBirthDate,
      status: editStatus,
      academicNotes: editNotes.trim(),
      needsSupport: editNeedsSupport,
    });
    setEditingStudent(null);
  };

  // CSV Parsing logic
  const handleParseCsv = (text: string) => {
    setCsvRawText(text);
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setCsvPreviewItems([]);
      return;
    }

    const items: Omit<StudentItem, 'id' | 'createdAt'>[] = [];
    const classCodeMap = new Map<string, string>();
    classes.forEach((c) => {
      classCodeMap.set(c.code.toLowerCase(), c.id);
      classCodeMap.set(c.id.toLowerCase(), c.id);
    });

    // Detect if first line is header
    const startIndex = lines[0].toLowerCase().includes('mã') || lines[0].toLowerCase().includes('tên') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      // Split by comma or semicolon
      const parts = lines[i].split(/[,;]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length >= 2) {
        const code = parts[0];
        const fullName = parts[1];
        const classStr = parts[2] || '';
        const genderStr = (parts[3] || 'Nam').toLowerCase().startsWith('nữ') ? 'Nữ' : 'Nam';
        const birthDate = parts[4] || '';
        const notes = parts[5] || '';

        // Find class
        const targetClassId = classCodeMap.get(classStr.toLowerCase()) || (classes[0] ? classes[0].id : '');

        if (code && fullName) {
          items.push({
            code: code.toUpperCase(),
            fullName,
            classId: targetClassId,
            gender: genderStr,
            birthDate,
            status: 'active',
            academicNotes: notes,
            needsSupport: false,
          });
        }
      }
    }
    setCsvPreviewItems(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseCsv(content);
      }
    };
    reader.readAsText(file);
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };

  const handleConfirmCsvImport = () => {
    if (csvPreviewItems.length === 0) return;
    const importedCount = importBulkStudents(csvPreviewItems);
    setShowCsvImportModal(false);
    setCsvPreviewItems([]);
    setCsvRawText('');
  };

  // Filter & Sort Students
  const processedStudents = useMemo(() => {
    let result = students.filter((stu) => {
      const matchSearch =
        stu.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stu.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stu.academicNotes && stu.academicNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchClass = selectedClassFilter === 'all' || stu.classId === selectedClassFilter;

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = stu.status === 'active';
      else if (statusFilter === 'transferred') matchStatus = stu.status === 'transferred';
      else if (statusFilter === 'dropped') matchStatus = stu.status === 'dropped';
      else if (statusFilter === 'needsSupport') matchStatus = !!stu.needsSupport;

      return matchSearch && matchClass && matchStatus;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        const nameA = a.fullName.split(' ').slice(-1)[0] || a.fullName;
        const nameB = b.fullName.split(' ').slice(-1)[0] || b.fullName;
        cmp = nameA.localeCompare(nameB, 'vi');
      } else if (sortBy === 'code') {
        cmp = a.code.localeCompare(b.code);
      } else if (sortBy === 'class') {
        const clsA = classes.find((c) => c.id === a.classId)?.code || '';
        const clsB = classes.find((c) => c.id === b.classId)?.code || '';
        cmp = clsA.localeCompare(clsB);
      } else if (sortBy === 'gpa') {
        const gpaA = calculateStudentStats(a.id, assessments, attendance).averageScore ?? -1;
        const gpaB = calculateStudentStats(b.id, assessments, attendance).averageScore ?? -1;
        cmp = gpaA - gpaB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [students, classes, assessments, attendance, searchQuery, selectedClassFilter, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'code' | 'class' | 'gpa') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Hồ sơ & Danh sách Học sinh THPT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị học sinh theo lớp, theo dõi học lực và nề nếp chuyên cần Trường THPT Đồng Hỷ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => setShowCsvImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Nhập CSV
          </button>
          <button
            onClick={exportStudentsCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất CSV Excel
          </button>
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm học sinh
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên, mã HS..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="all">Tất cả các lớp ({classes.length} lớp)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Lớp {c.code}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="needsSupport">Cần chú ý / Hỗ trợ</option>
            <option value="transferred">Chuyển lớp</option>
            <option value="dropped">Nghỉ học</option>
          </select>
        </div>

        {/* Counter Summary */}
        <div className="text-slate-500 self-end lg:self-center font-mono tabular-nums whitespace-nowrap">
          Hiển thị <span className="font-bold text-slate-900">{processedStudents.length}</span> / {students.length} học sinh
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {processedStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Không tìm thấy học sinh nào phù hợp với điều kiện tìm kiếm và lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => toggleSort('code')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      Mã HS
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('name')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Họ và tên
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('class')}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Lớp
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Giới tính</th>
                  <th className="px-4 py-3">Ngày sinh</th>
                  <th
                    onClick={() => toggleSort('gpa')}
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Điểm TB
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Chuyên cần</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ghi chú học tập</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedStudents.map((stu) => {
                  const currentClass = classes.find((c) => c.id === stu.classId);
                  const stats = calculateStudentStats(stu.id, assessments, attendance);

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-600">{stu.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openStudentDetail(stu.id)}
                            className="hover:text-teal-700 hover:underline text-left cursor-pointer"
                          >
                            {stu.fullName}
                          </button>
                          {stu.needsSupport && (
                            <span
                              className="px-1.5 py-0.2 text-[10px] bg-rose-50 text-rose-600 rounded border border-rose-200"
                              title="Cần giáo viên hỗ trợ đặc biệt"
                            >
                              Cần chú ý
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {currentClass ? (
                          <span className="font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                            {currentClass.code}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa phân lớp</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{stu.gender}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {formatDateVN(stu.birthDate) || '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {stats.averageScore !== null ? (
                          <span
                            className={
                              stats.averageScore >= 8.0
                                ? 'text-teal-700'
                                : stats.averageScore < 5.0
                                ? 'text-rose-600'
                                : 'text-slate-800'
                            }
                          >
                            {stats.averageScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {stats.attendanceRate !== null ? (
                          <span
                            className={
                              stats.attendanceRate >= 90
                                ? 'text-emerald-600 font-semibold'
                                : 'text-amber-600 font-semibold'
                            }
                          >
                            {stats.attendanceRate}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">100%</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stu.status === 'active' ? (
                          <span className="text-[11px] text-emerald-700 font-medium">Đang học</span>
                        ) : stu.status === 'transferred' ? (
                          <span className="text-[11px] text-sky-700 font-medium">Chuyển lớp</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Nghỉ học</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={stu.academicNotes}>
                        {stu.academicNotes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openStudentDetail(stu.id)}
                          className="text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
                          title="Xem hồ sơ học sinh"
                        >
                          Hồ sơ
                        </button>
                        <button
                          onClick={() => handleStartEdit(stu)}
                          className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                          title="Sửa học sinh"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeletingStudentId(stu.id)}
                          className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                          title="Xóa học sinh"
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-teal-600" />
              Chỉnh sửa thông tin học sinh: {editingStudent.fullName}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp</label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Chưa xếp lớp --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên học sinh</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái học tập</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as StudentStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="active">Đang học</option>
                  <option value="transferred">Chuyển lớp</option>
                  <option value="dropped">Nghỉ học</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú học tập / nề nếp</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editNeedsSupport"
                  checked={editNeedsSupport}
                  onChange={(e) => setEditNeedsSupport(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="editNeedsSupport" className="text-slate-700 font-medium">
                  Đánh dấu học sinh cần hỗ trợ / theo dõi tiến độ đặc biệt
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
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

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              Nhập danh sách học sinh từ tệp CSV
            </h3>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Chọn tệp CSV hoặc dán nội dung văn bản. Định dạng các cột:
                <code className="ml-1 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">
                  Mã HS, Họ tên, Lớp, Giới tính, Ngày sinh, Ghi chú
                </code>
              </p>
            </div>

            {/* File Upload Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => csvFileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Chọn tệp .CSV từ máy
              </button>
              <input
                type="file"
                ref={csvFileInputRef}
                onChange={handleFileUpload}
                accept=".csv,text/csv,text/plain"
                className="hidden"
              />
              <span className="text-[11px] text-slate-400">hoặc dán văn bản trực tiếp bên dưới</span>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                rows={4}
                value={csvRawText}
                onChange={(e) => handleParseCsv(e.target.value)}
                placeholder="HS1009, Hoàng Minh Châu, 10A1, Nữ, 2010-05-19, Chăm chỉ&#10;HS1010, Lê Quốc Đạt, 10A1, Nam, 2010-02-11, Tích cực"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Preview Section */}
            {csvPreviewItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Xem trước danh sách ({csvPreviewItems.length} học sinh sẵn sàng nhập):</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Mã HS</th>
                        <th className="px-3 py-2">Họ và tên</th>
                        <th className="px-3 py-2">Lớp</th>
                        <th className="px-3 py-2">Giới tính</th>
                        <th className="px-3 py-2">Ngày sinh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvPreviewItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-mono text-slate-600">{item.code}</td>
                          <td className="px-3 py-1.5 font-medium text-slate-900">{item.fullName}</td>
                          <td className="px-3 py-1.5 font-mono">
                            {classes.find((c) => c.id === item.classId)?.code || '10A1'}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">{item.gender}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-500">
                            {item.birthDate || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowCsvImportModal(false);
                  setCsvPreviewItems([]);
                  setCsvRawText('');
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={csvPreviewItems.length === 0}
                onClick={handleConfirmCsvImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Nhập {csvPreviewItems.length} học sinh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingStudentId !== null}
        title="Xác nhận xóa hồ sơ học sinh?"
        message="Hành động này sẽ xóa vĩnh viễn học sinh này khỏi danh sách lớp và hệ thống. Điểm số và lịch sử điểm danh của học sinh cũng sẽ được xóa sạch để tránh sai lệch dữ liệu."
        confirmText="Xóa học sinh"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={() => {
          if (deletingStudentId) {
            deleteStudent(deletingStudentId);
            setDeletingStudentId(null);
          }
        }}
        onCancel={() => setDeletingStudentId(null)}
      />
    </div>
  );
};
