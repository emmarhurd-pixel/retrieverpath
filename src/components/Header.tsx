import { GraduationCap, LogOut, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

interface HeaderProps {
  onSettings?: () => void;
}

export function Header({ onSettings }: HeaderProps) {
  const { profile, reset } = useStore();

  return (
    <header className="bg-umbc-gray border-b border-umbc-gray-light px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="bg-umbc-gold rounded-lg p-1.5">
          <GraduationCap size={20} className="text-black" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">RetrieverPath</span>
      </div>

      <div className="flex items-center gap-3">
        {profile?.name && (
          <span className="text-gray-400 text-sm hidden sm:block">
            {profile.name}
          </span>
        )}
        {onSettings && (
          <button
            onClick={onSettings}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <Settings size={18} />
          </button>
        )}
        <button
          onClick={reset}
          className="text-gray-400 hover:text-umbc-gold transition-colors p-1"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
