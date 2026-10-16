import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, X } from 'lucide-react';
import { StudentStatus } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  const { classes, addStudent, selectedClassFilter } = useApp();

  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState(
    selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.id || ''
  );
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [birthDate, setBirthDate] = useState('2010-01-01');
  const [status, setStatus] = useState<StudentStatus>('active');
  const [notes, setNotes] = useState('');
  const [needsSupport, setNeedsSupport] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !fullName.trim()) return;

    addStudent({
      code: code.trim().toUpperCase(),
      fullName: fullName.trim(),
      classId,
      gender,
      birthDate,
      status,
      academicNotes: notes.trim(),
      needsSupport,
    });

    // Reset and close
    setCode('');
    setFullName('');
    setNotes('');
    setNeedsSupport(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Thêm Hồ sơ Học sinh mới
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã học sinh *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: HS1027"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân vào lớp</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
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
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên học sinh *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Hoàng Gia Bảo"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
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
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trạng thái ban đầu</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StudentStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="active">Đang học</option>
              <option value="transferred">Chuyển lớp</option>
              <option value="dropped">Nghỉ học</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú học tập ban đầu</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhận xét ý thức, kỹ năng, ghi chú sức khỏe nếu có..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="addNeedsSupport"
              checked={needsSupport}
              onChange={(e) => setNeedsSupport(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="addNeedsSupport" className="text-slate-700 font-medium">
              Đánh dấu học sinh cần hỗ trợ / theo dõi tiến độ đặc biệt
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Lưu học sinh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
