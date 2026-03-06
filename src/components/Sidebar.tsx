import { NavLink } from 'react-router-dom';
import { Inbox, ListTodo, Calendar, FileBarChart, BarChart3, Menu, X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

const navItems = [
  { to: '/', icon: Inbox, label: 'Inbox', key: 'inbox' },
  { to: '/next-actions', icon: ListTodo, label: 'Next Actions', key: 'next' },
  { to: '/calendar', icon: Calendar, label: 'Calendar', key: 'calendared' },
  { to: '/projects', icon: FileBarChart, label: 'Projects', key: 'projects' },
  { to: '/weekly-review', icon: BarChart3, label: 'Weekly Review', key: 'review' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { tasks } = useTaskStore();

  const getCount = (key: string) => {
    switch (key) {
      case 'inbox':
        return tasks.filter(t => t.status === 'inbox').length;
      case 'next':
        return tasks.filter(t => t.status === 'next').length;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden cursor-default transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Attention Flow
            </h1>
            <button
              onClick={onClose}
              className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label, key }) => {
              const count = getCount(key);
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-colors ${
                      'group-[.active]:text-blue-600'
                    }`} />
                    <span>{label}</span>
                  </div>
                  {count !== null && count > 0 && (
                    <span className={`
                      text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors
                      ${'group-[.active]:bg-blue-200/50 group-[.active]:text-blue-700 bg-slate-100 text-slate-500'}
                    `}>
                      {count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer/Settings dummy */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">John Doe</p>
                <p className="text-[10px] text-slate-500 truncate">Pro Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
