'use client';

import React from 'react';
import { useI18n } from '../../app/I18nContext';
import { useTheme } from '../../app/ThemeContext';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, role }) => {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    window.location.href = '/';
  };

  const superAdminLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'agencies', label: 'Agencies' },
    { id: 'templates', label: 'Templates' },
    { id: 'infra', label: 'Infrastructure' },
    { id: 'complaints', label: 'Complaints' },
  ];

  const adminLinks = [
    { id: 'reports', label: lang === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Stats' },
    { id: 'templates', label: lang === 'ar' ? 'متطلبات الدول' : 'Country Checklists' },
    { id: 'employees', label: lang === 'ar' ? 'إدارة الموظفين' : 'Staff Management' },
    { id: 'settings', label: lang === 'ar' ? 'إعدادات المكتب' : 'Office Settings' },
  ];

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="logo-container">
          <div className="logo-icon">VF</div>
          <span>{t('appName')}</span>
        </div>
        <nav className="nav-links">
          {role === 'SUPER_ADMIN' && superAdminLinks.map(link => (
            <a
              key={link.id}
              href="#"
              className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onTabChange) onTabChange(link.id);
              }}
            >
              <span>{link.label}</span>
            </a>
          ))}

          {role === 'ADMIN' && adminLinks.map(link => (
            <a
              key={link.id}
              href="#"
              className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onTabChange) onTabChange(link.id);
              }}
            >
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="theme-switch-group" style={{ width: '100%', justifyContent: 'center' }}>
          {(['light', 'dark', 'system'] as const).map(tMode => (
            <button
              key={tMode}
              className={`theme-btn ${theme === tMode ? 'theme-active' : ''}`}
              onClick={() => setTheme(tMode)}
            >
              {t(`theme${tMode.charAt(0).toUpperCase() + tMode.slice(1)}`)}
            </button>
          ))}
        </div>

        <button className="btn btn-secondary btn-sm w-full" onClick={handleLogout} style={{ justifyContent: 'center' }}>
          <span>{t('navLogout')}</span>
        </button>
      </div>
    </aside>
  );
};
