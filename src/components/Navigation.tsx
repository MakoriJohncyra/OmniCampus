import React from 'react';
import { 
  LayoutDashboard, 
  FolderDown, 
  BookOpen, 
  CalendarClock, 
  DoorClosed, 
  FileText, 
  Sparkles, 
  Database 
} from 'lucide-react';

export type NavTabId = 
  | 'dashboard' 
  | 'resources' 
  | 'library' 
  | 'timetable' 
  | 'bookings' 
  | 'forms' 
  | 'events' 
  | 'architecture';

interface NavigationProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  badgeCounts?: {
    resources?: number;
    books?: number;
    pendingForms?: number;
    events?: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  onTabChange,
  badgeCounts 
}) => {
  const navItems: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resources', label: 'Academic Repository', icon: FolderDown, badge: badgeCounts?.resources },
    { id: 'library', label: 'Library Catalog', icon: BookOpen, badge: badgeCounts?.books },
    { id: 'timetable', label: 'Timetable Builder', icon: CalendarClock },
    { id: 'bookings', label: 'Room & Lab Bookings', icon: DoorClosed },
    { id: 'forms', label: 'Administrative Forms', icon: FileText, badge: badgeCounts?.pendingForms },
    { id: 'events', label: 'Campus Events', icon: Sparkles, badge: badgeCounts?.events },
    { id: 'architecture', label: 'PostgreSQL & FastAPI Specs', icon: Database }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[73px] z-30 px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-[#312E81] text-white shadow-sm ring-1 ring-[#312E81]'
                  : 'text-slate-700 hover:text-[#312E81] hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive 
                    ? 'bg-amber-400 text-[#1e1b4b]' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
