import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssessmentRecord } from '../../types';
import {
  LineChart,
  Plus,
  Search,
  Filter,
  Award,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { formatDateVN } from '../../utils/storage';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProgressTab: React.FC = () => {
  const {
    classes,
    students,
    assessments,
    addAssessment,
    updateAssessment,
    deleteAssessment,
    selectedClassFilter,
    setSelectedClassFilter,
    openStudentDetail,
  } = useApp();

  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'month' | 'semester'>('all');

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formStudentId, setFormStudentId] = useState('');
  const [formSubject, setFormSubject] = useState('Toán học');
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formScore, setFormScore] = useState<number | ''>(8.0);
  const [formMaxScore, setFormMaxScore] = useState<number>(10);
  const [formComment, setFormComment] = useState('Hoàn thành tốt nhiệm vụ');
  const [formNeedsSupport, setFormNeedsSupport] = useState(false);

  // Available students for chosen class in form
  const formClassStudents = useMemo(() => {
    return students.filter((s) => s.classId === formClassId);
  }, [students, formClassId]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingAssessment(null);
    const initialClassId = selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || '';
    setFormClassId(initialClassId);
    const firstStu = students.find((s) => s.classId === initialClassId);
    setFormStudentId(firstStu ? firstStu.id : '');
    setFormSubject('Toán học');
    setFormName('Kiểm tra 15 phút');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormScore(8.0);
    setFormMaxScore(10);
    setFormComment('Hoàn thành tốt nhiệm vụ');
    setFormNeedsSupport(false);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (rec: AssessmentRecord) => {
    setEditingAssessment(rec);
    setFormClassId(rec.classId);
    setFormStudentId(rec.studentId);
    setFormSubject(rec.subject);
    setFormName(rec.name);
    setFormDate(rec.date);
    setFormScore(rec.score);
    setFormMaxScore(rec.maxScore || 10);
    setFormComment(rec.teacherComment);
    setFormNeedsSupport(rec.needsSupport ?? false);
    setIsModalOpen(true);
  };

  // Form submit
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formClassId || !formName.trim() || formScore === '') return;

    const scoreNum = Number(formScore);
    const maxScoreNum = Number(formMaxScore) || 10;

    if (editingAssessment) {
      updateAssessment({
        ...editingAssessment,
        studentId: formStudentId,
        classId: formClassId,
        subject: formSubject.trim(),
        name: formName.trim(),
        date: formDate,
        score: scoreNum,
        maxScore: maxScoreNum,
        teacherComment: formComment.trim(),
        needsSupport: formNeedsSupport,
      });
    } else {
      addAssessment({
        studentId: formStudentId,
        classId: formClassId,
        subject: formSubject.trim(),
        name: formName.trim(),
        date: formDate,
        score: scoreNum,
        maxScore: maxScoreNum,
        teacherComment: formComment.trim(),
        needsSupport: formNeedsSupport,
        isDemo: false,
      });
    }
    setIsModalOpen(false);
  };

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((rec) => {
      const matchClass = selectedClassFilter === 'all' || rec.classId === selectedClassFilter;
      const matchStudent = studentFilter === 'all' || rec.studentId === studentFilter;
      const matchSubject = subjectFilter === 'all' || rec.subject === subjectFilter;

      const student = students.find((s) => s.id === rec.studentId);
      const studentName = student ? student.fullName.toLowerCase() : '';
      const studentCode = student ? student.code.toLowerCase() : '';

      const matchSearch =
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        studentName.includes(searchQuery.toLowerCase()) ||
        studentCode.includes(searchQuery.toLowerCase());

      return matchClass && matchStudent && matchSubject && matchSearch;
    });
  }, [assessments, students, selectedClassFilter, studentFilter, subjectFilter, searchQuery]);

  // Statistical Calculation with clear formula display
  const statsSummary = useMemo(() => {
    const validScores = filteredAssessments.map((a) => (a.score / (a.maxScore || 10)) * 10);
    const count = validScores.length;
    if (count === 0) {
      return { count: 0, average: null, excellent: 0, good: 0, fair: 0, medium: 0, weak: 0 };
    }
    const sum = validScores.reduce((acc, val) => acc + val, 0);
    const avg = Number((sum / count).toFixed(1));

    let excellent = 0; // >= 9.0
    let good = 0; // 8.0 - 8.9
    let fair = 0; // 6.5 - 7.9
    let medium = 0; // 5.0 - 6.4
    let weak = 0; // < 5.0

    validScores.forEach((s) => {
      if (s >= 9.0) excellent++;
      else if (s >= 8.0) good++;
      else if (s >= 6.5) fair++;
      else if (s >= 5.0) medium++;
      else weak++;
    });

    return { count, average: avg, sum, excellent, good, fair, medium, weak };
  }, [filteredAssessments]);

  // Preset Comments
  const commentPresets = [
    'Hoàn thành tốt nhiệm vụ',
    'Có tiến bộ',
    'Cần củng cố kiến thức',
    'Cần hỗ trợ thêm',
    'Nắm vững phương pháp giải',
    'Trình bày bài cẩn thận',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LineChart className="w-6 h-6 text-teal-600" />
            Theo dõi Tiến độ & Sổ Điểm Học tập
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá thường xuyên, kiểm tra định kỳ và nhận xét chuyên môn của GV Nguyễn Thị Thanh Xuân
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Thêm bản ghi điểm mới
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto flex-1">
          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => {
              setSelectedClassFilter(e.target.value);
              setStudentFilter('all');
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Lớp {c.code}
              </option>
            ))}
          </select>

          {/* Student Filter */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700 max-w-xs truncate"
          >
            <option value="all">Tất cả học sinh</option>
            {students
              .filter((s) => selectedClassFilter === 'all' || s.classId === selectedClassFilter)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.code})
                </option>
              ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bài kiểm tra, học sinh..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="text-slate-500 font-mono tabular-nums whitespace-nowrap self-end lg:self-center">
          {filteredAssessments.length} bản ghi hợp lệ
        </div>
      </div>

      {/* Statistical Calculation Formula & Distribution Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Thống kê kết quả & Điểm trung bình (ĐTB)
              </h3>
              <p className="text-xs text-slate-500">
                Công thức: ĐTB = Tổng điểm quy đổi hệ 10 / Tổng số bài đánh giá hợp lệ ({statsSummary.count} bài)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500">Điểm trung bình phạm vi này:</span>
            <span className="text-xl font-bold font-mono text-teal-700">
              {statsSummary.average !== null ? `${statsSummary.average} / 10` : 'Chưa có điểm'}
            </span>
          </div>
        </div>

        {/* Grade Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Phổ điểm đánh giá:</span>
            <span className="font-mono text-slate-400">{statsSummary.count} lượt đánh giá</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
              <span className="text-teal-800 block font-semibold">Xuất sắc (9.0 - 10)</span>
              <span className="text-lg font-bold font-mono text-teal-700 tabular-nums">
                {statsSummary.excellent}{' '}
                <span className="text-[10px] font-normal text-teal-600">
                  ({statsSummary.count > 0 ? ((statsSummary.excellent / statsSummary.count) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <span className="text-sky-800 block font-semibold">Giỏi (8.0 - 8.9)</span>
              <span className="text-lg font-bold font-mono text-sky-700 tabular-nums">
                {statsSummary.good}{' '}
                <span className="text-[10px] font-normal text-sky-600">
                  ({statsSummary.count > 0 ? ((statsSummary.good / statsSummary.count) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <span className="text-indigo-800 block font-semibold">Khá (6.5 - 7.9)</span>
              <span className="text-lg font-bold font-mono text-indigo-700 tabular-nums">
                {statsSummary.fair}{' '}
                <span className="text-[10px] font-normal text-indigo-600">
                  ({statsSummary.count > 0 ? ((statsSummary.fair / statsSummary.count) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="text-amber-800 block font-semibold">Trung bình (5.0 - 6.4)</span>
              <span className="text-lg font-bold font-mono text-amber-700 tabular-nums">
                {statsSummary.medium}{' '}
                <span className="text-[10px] font-normal text-amber-600">
                  ({statsSummary.count > 0 ? ((statsSummary.medium / statsSummary.count) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <span className="text-rose-800 block font-semibold">Chưa đạt (&lt; 5.0)</span>
              <span className="text-lg font-bold font-mono text-rose-700 tabular-nums">
                {statsSummary.weak}{' '}
                <span className="text-[10px] font-normal text-rose-600">
                  ({statsSummary.count > 0 ? ((statsSummary.weak / statsSummary.count) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredAssessments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Chưa có bản ghi kết quả học tập nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3">Tên bài kiểm tra / Nội dung</th>
                  <th className="px-4 py-3 text-center">Điểm số</th>
                  <th className="px-4 py-3">Nhận xét của GV Xuân</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((rec) => {
                  const student = students.find((s) => s.id === rec.studentId);
                  const currentClass = classes.find((c) => c.id === rec.classId);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">{formatDateVN(rec.date)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {student ? (
                          <button
                            onClick={() => openStudentDetail(student.id)}
                            className="hover:text-teal-700 hover:underline cursor-pointer"
                          >
                            {student.fullName}
                          </button>
                        ) : (
                          <span className="text-slate-400">Học sinh đã xóa</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {currentClass ? currentClass.code : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{rec.subject}</td>
                      <td className="px-4 py-3 text-slate-800">
                        {rec.name}
                        {rec.isDemo && (
                          <span className="ml-1.5 text-[10px] text-slate-400 italic">
                            (minh họa)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            rec.score >= 8.0
                              ? 'text-teal-700'
                              : rec.score < 5.0
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {rec.score}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">/{rec.maxScore || 10}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100/90 text-[11px] text-slate-700 border border-slate-200/60">
                          {rec.teacherComment}
                        </span>
                        {rec.needsSupport && (
                          <span className="ml-1.5 text-[10px] text-rose-600 font-medium">
                            [Cần hỗ trợ]
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeletingId(rec.id)}
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
        )}
      </div>

      {/* Add / Edit Assessment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-600" />
              {editingAssessment ? 'Chỉnh sửa kết quả đánh giá' : 'Thêm bản ghi kết quả học tập mới'}
            </h3>

            <form onSubmit={handleSaveAssessment} className="space-y-3.5 text-xs">
              {/* Class & Student Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp học</label>
                  <select
                    value={formClassId}
                    onChange={(e) => {
                      const newClsId = e.target.value;
                      setFormClassId(newClsId);
                      const st = students.find((s) => s.classId === newClsId);
                      setFormStudentId(st ? st.id : '');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học sinh</label>
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {formClassStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & Assessment Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Toán học"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày đánh giá</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên bài kiểm tra / Nội dung đánh giá
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 15 phút - Chương Hàm số"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Score and Scale */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm số</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={formMaxScore}
                    required
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-teal-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thang điểm</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    required
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Teacher Comments & Quick Preset Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Nhận xét của giáo viên</label>
                  <span className="text-[10px] text-slate-400">Chọn nhanh hoặc nhập tự do</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commentPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormComment(preset)}
                      className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                        formComment === preset
                          ? 'bg-teal-600 text-white font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formNeedsSupport"
                  checked={formNeedsSupport}
                  onChange={(e) => setFormNeedsSupport(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="formNeedsSupport" className="text-slate-700 font-medium">
                  Đánh dấu học sinh cần hỗ trợ / củng cố kiến thức
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {editingAssessment ? 'Lưu thay đổi' : 'Thêm bản ghi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Xác nhận xóa bản ghi kết quả học tập?"
        message="Hành động này sẽ xóa vĩnh viễn điểm số này khỏi hệ thống và tự động cập nhật lại điểm trung bình của lớp và học sinh."
        confirmText="Xóa bản ghi"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={() => {
          if (deletingId) {
            deleteAssessment(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
