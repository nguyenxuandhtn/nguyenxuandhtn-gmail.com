import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewTab } from './components/modules/OverviewTab';
import { ClassesTab } from './components/modules/ClassesTab';
import { StudentsTab } from './components/modules/StudentsTab';
import { ProgressTab } from './components/modules/ProgressTab';
import { AttendanceTab } from './components/modules/AttendanceTab';
import { AddClassModal } from './components/modals/AddClassModal';
import { AddStudentModal } from './components/modals/AddStudentModal';
import { ClassDetailModal } from './components/modals/ClassDetailModal';
import { StudentProfileModal } from './components/modals/StudentProfileModal';
import { ToastContainer } from './components/common/ToastContainer';
import { TEACHER_NAME, SCHOOL_NAME } from './data/mockData';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Sidebar (left 260px on desktop) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by sidebar on desktop lg:pl-64) */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* Sticky Top Header */}
        <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Dynamic Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              onOpenAddClass={() => setShowAddClassModal(true)}
              onOpenAddStudent={() => setShowAddStudentModal(true)}
            />
          )}

          {activeTab === 'classes' && (
            <ClassesTab onOpenAddClass={() => setShowAddClassModal(true)} />
          )}

          {activeTab === 'students' && (
            <StudentsTab onOpenAddStudent={() => setShowAddStudentModal(true)} />
          )}

          {activeTab === 'progress' && <ProgressTab />}

          {activeTab === 'attendance' && <AttendanceTab />}
        </main>

        {/* Quiet Professional Footer */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium text-slate-700">
              CLASSROOM PRO – QUẢN TRỊ LỚP HỌC
            </span>
            <span>
              Phát triển riêng cho Giáo viên: <strong className="text-slate-800">{TEACHER_NAME}</strong> – {SCHOOL_NAME}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Dữ liệu an toàn trên thiết bị cá nhân
            </span>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <AddClassModal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
      />

      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
      />

      <ClassDetailModal />
      <StudentProfileModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
