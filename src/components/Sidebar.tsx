import { NavLink } from 'react-router-dom';
import { Inbox, ListTodo, Calendar, FileBarChart, BarChart3, Menu } from 'lucide-react';

const navItems = [
  { to: '/', icon: Inbox, label: 'Inbox' },
  { to: '/next-actions', icon: ListTodo, label: 'Next Actions' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/projects', icon: FileBarChart, label: 'Projects' },
  { to: '/weekly-review', icon: BarChart3, label: 'Weekly Review' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 md:hidden cursor-default"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100
        transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <h1 className="text-xl font-bold">Attention Flow</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
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
      className="md:hidden p-2 rounded-lg hover:bg-slate-100"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
