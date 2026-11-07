import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  ChevronDown, 
  Bell, 
  CheckCircle2,
  Shield
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { INSTITUTIONAL_USERS } from '../data/seedData';
import { getRolePermissions } from '../utils/timetableConflict';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchUser: (role: UserRole) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSwitchUser }) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const perms = getRolePermissions(currentUser.role);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'lecturer':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'admin_staff':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'system_admin':
        return 'bg-purple-100 text-purple-900 border-purple-200';
    }
  };

  const formatRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'student': return 'Student';
      case 'lecturer': return 'Lecturer / Faculty';
      case 'admin_staff': return 'Administrative Staff';
      case 'system_admin': return 'System Administrator';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#312E81] text-white shadow-md">
      {/* Top institution sub-bar */}
      <div className="bg-[#1e1b4b] px-4 py-1.5 text-xs text-indigo-200 flex items-center justify-between border-b border-indigo-900/80">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-indigo-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Institutional SSO (OIDC / OAuth2) Active
          </span>
          <span className="text-indigo-400">|</span>
          <span className="hidden sm:inline text-indigo-300">Realm: <code className="text-amber-300 font-semibold">sso.univ.edu</code></span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-indigo-200 hidden md:inline">RBAC Middleware: Enforcing role scopes</span>
          <span className="bg-indigo-900/90 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
            {currentUser.idNumber}
          </span>
        </div>
      </div>

      {/* Main header navbar (Brand 30%: Indigo Navy #312E81) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Crest */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 ring-2 ring-white/20">
            <GraduationCap className="w-6 h-6 text-[#1e1b4b]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white">OmniCampus</span>
              <span className="bg-amber-400 text-[#1e1b4b] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Hub
              </span>
            </div>
            <p className="text-xs text-indigo-200 hidden sm:block">
              {currentUser.faculty} &bull; {currentUser.department}
            </p>
          </div>
        </div>

        {/* Right side: Role Switcher & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationToast(!showNotificationToast)}
              aria-label="View notifications"
              className="p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition relative focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Bell className="w-5 h-5" />
              {/* Sunset Amber Accent #F59E0B */}
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#F59E0B] rounded-full ring-2 ring-[#312E81]"></span>
            </button>

            {showNotificationToast && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 text-xs z-50 animate-in fade-in slide-in-from-top-2 text-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                  <span className="font-bold text-slate-900">Campus Alerts</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded">2 New</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900">Exam Repository Updated</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">CS301 & ENG210 past examination papers with marking schemes published.</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="font-semibold text-amber-950">Timetable Conflict Engine</p>
                    <p className="text-amber-900 text-[11px] mt-0.5">Semester 1 schedule validation active. Live class overlap check ready.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Role Switcher for Testing RBAC */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              aria-label="Switch institutional role persona"
              className="flex items-center space-x-2.5 bg-indigo-900/90 hover:bg-indigo-800 border border-indigo-700/80 px-3 py-1.5 rounded-xl text-xs transition shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white/50" 
              />
              <div className="text-left hidden md:block">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{currentUser.fullName}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                {formatRoleLabel(currentUser.role)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-300" />
            </button>

            {/* Dropdown to switch personas */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 text-xs text-slate-800 animate-in fade-in">
                <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#312E81]" />
                    Simulate Institutional SSO Identity
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Switch role to test live RBAC security permissions and feature access:
                  </p>
                </div>

                <div className="space-y-1">
                  {(Object.keys(INSTITUTIONAL_USERS) as UserRole[]).map((roleKey) => {
                    const u = INSTITUTIONAL_USERS[roleKey];
                    const isSelected = currentUser.role === roleKey;
                    return (
                      <button
                        key={roleKey}
                        onClick={() => {
                          onSwitchUser(roleKey);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition ${
                          isSelected ? 'bg-indigo-50 border border-indigo-300 text-[#312E81] font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                          <div>
                            <p className="font-bold text-slate-900">{u.fullName}</p>
                            <p className="text-[11px] text-slate-500">{formatRoleLabel(u.role)} &bull; {u.department.split('&')[0]}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#312E81]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Role Capabilities summary */}
                <div className="mt-2 pt-2 border-t border-slate-100 px-2 text-[11px] text-slate-600 space-y-1 bg-slate-50 rounded-xl p-2">
                  <div className="flex items-center justify-between">
                    <span>Upload Course Notes:</span>
                    <span className={perms.canUploadResources ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}>
                      {perms.canUploadResources ? '✓ Allowed' : '✕ Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Approve Admin Forms:</span>
                    <span className={perms.canApproveForms ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}>
                      {perms.canApproveForms ? '✓ Allowed' : '✕ Restricted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Facility Management:</span>
                    <span className={perms.canManageFacilities ? 'text-emerald-700 font-bold' : 'text-slate-400 font-medium'}>
                      {perms.canManageFacilities ? '✓ Allowed' : '✕ Restricted'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
