import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  badgeColor?: string;
  className?: string;
  headerClassName?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  badge,
  badgeColor = 'bg-umbc-gold text-black',
  className = '',
  headerClassName = '',
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`section-header w-full text-left ${headerClassName}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? (
            <ChevronDown size={16} className="text-umbc-gold flex-shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
          )}
          <span className="font-medium text-white truncate">{title}</span>
        </div>
        {badge !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${badgeColor}`}>
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-1 pl-6">
          {children}
        </div>
      )}
    </div>
  );
}
