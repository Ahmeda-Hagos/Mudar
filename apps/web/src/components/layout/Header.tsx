'use client';

import React from 'react';
import { useI18n } from '../../app/I18nContext';

interface HeaderProps {
  title: string;
  avatarChar: string;
  profileName: string;
}

export const Header: React.FC<HeaderProps> = ({ title, avatarChar, profileName }) => {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button className="lang-switch" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          {t('langToggle')}
        </button>
        <div className="flex align-center gap-2">
          <div className="avatar">{avatarChar}</div>
          <span className="font-medium" style={{ fontSize: '0.9rem' }}>{profileName}</span>
        </div>
      </div>
    </header>
  );
};
