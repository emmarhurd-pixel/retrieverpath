import { LayoutDashboard, BookOpen, Calendar, Users } from 'lucide-react';
import { useStore } from '../store/useStore';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'planner', label: 'Planner', icon: Calendar },
  { id: 'network', label: 'Network', icon: Users },
];

export function BottomNav() {
  const { currentPage, setCurrentPage } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-umbc-gray border-t border-umbc-gray-light z-50 safe-area-pb">
      <div className="max-w-lg mx-auto flex justify-around">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className="flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors"
            >
              <Icon
                size={22}
                className={active ? 'text-umbc-gold' : 'text-white'}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                className={`text-xs font-medium ${active ? 'text-umbc-gold' : 'text-white'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
