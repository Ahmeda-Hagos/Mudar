'use client';

import React, { useState } from 'react';
import { useI18n } from './I18nContext';
import { useTheme } from './ThemeContext';

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error(lang === 'ar' ? 'البريد أو كلمة المرور غير صالحة' : 'Invalid email or password');
      const data = await response.json();

      if (data.twoFactorRequired) {
        setTempToken(data.tempToken);
      } else {
        completeSession(data);
      }
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: twoFactorCode }),
      });

      if (!response.ok) throw new Error(lang === 'ar' ? 'رمز التحقق غير صحيح أو انتهت صلاحيته' : 'Incorrect or expired verification code');
      const data = await response.json();
      completeSession(data);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const completeSession = (data: any) => {
    localStorage.setItem('visaflow_token', data.accessToken);
    localStorage.setItem('visaflow_user', JSON.stringify(data.user));
    localStorage.setItem('visaflow_tenant_id', data.user.tenantId);

    // Route based on role
    if (data.user.role === 'ADMIN') {
      window.location.href = '/admin/dashboard';
    } else if (data.user.role === 'SUPER_ADMIN') {
      window.location.href = '/superadmin/dashboard';
    } else {
      window.location.href = '/employee/dashboard';
    }
  };

  return (
    <div>
      {/* Language controls only */}
      <div style={{ position: 'absolute', top: '20px', insetInlineEnd: '20px', display: 'flex', gap: '12px', zIndex: 1000 }}>
        <button className="lang-switch" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          {t('langToggle')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', minHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#ffffff', color: '#000000' }}>
        
        {/* Left Side: Login Form */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem 4rem', position: 'relative' }}>
          
          {/* Logo Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.2rem', color: '#000000' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '4px', background: 'var(--primary)', color: '#ffffff', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-1px' }}>
              VF
            </div>
            <span>VisaFlow</span>
          </div>

          {/* Form Container */}
          <div style={{ maxWidth: '360px', width: '100%', margin: 'auto' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '1.5rem', color: '#0d0d0d' }}>
              {lang === 'ar' ? 'أهلاً بك في فلو فيزا' : 'Welcome to VisaFlow'}
            </h1>

            {loginError && (
              <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)', padding: '10px', borderRadius: '4px', fontSize: '0.82rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '1rem' }}>
                {loginError}
              </div>
            )}

            {!tempToken ? (
              /* Step 1: Password Login Form */
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder={lang === 'ar' ? 'أدخل عنوان بريدك الإلكتروني' : 'Enter your email address'} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.88rem', outline: 'none', color: '#000000', backgroundColor: '#ffffff' }}
                  required 
                />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.88rem', outline: 'none', color: '#000000', backgroundColor: '#ffffff' }}
                  required 
                />
                <button type="submit" style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '4px', background: '#4A5568', color: '#ffffff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                  {lang === 'ar' ? 'متابعة بالبريد' : 'Continue with email'}
                </button>
              </form>
            ) : (
              /* Step 2: 2FA Verification Form */
              <form onSubmit={handle2FaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '4px', lineHeight: 1.4 }}>
                  {lang === 'ar' 
                    ? 'لقد أرسلنا رمز تحقق ثنائي مكون من 6 أرقام إلى بريدك الإلكتروني. يرجى إدخاله أدناه:' 
                    : 'We have sent a 6-digit 2FA verification code to your email. Please enter it below:'}
                </p>
                <input 
                  type="text" 
                  value={twoFactorCode} 
                  onChange={(e) => setTwoFactorCode(e.target.value)} 
                  placeholder="------" 
                  maxLength={6}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '8px', textAlign: 'center', outline: 'none', color: '#000000', backgroundColor: '#ffffff' }}
                  required 
                />
                <button type="submit" style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '4px', background: 'var(--primary)', color: '#ffffff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                  {lang === 'ar' ? 'تأكيد الرمز' : 'Verify Code'}
                </button>
                <button type="button" onClick={() => setTempToken(null)} style={{ background: 'none', border: 'none', color: '#718096', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '4px' }}>
                  {lang === 'ar' ? 'الرجوع للخلف' : 'Go back'}
                </button>
              </form>
            )}

            <div style={{ fontSize: '0.75rem', color: '#718096', textAlign: 'center', marginTop: '1.25rem' }}>
              {lang === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
              <a href="#" style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}>{lang === 'ar' ? 'سجل الآن' : 'Sign up'}</a>
            </div>
            
            <div style={{ fontSize: '0.72rem', color: '#a0aec0', textAlign: 'center', marginTop: '1rem', background: '#f7fafc', padding: '6px', borderRadius: '4px' }}>
              {lang === 'ar' ? 'تجربة: super@visaflow.ai | password123' : 'Sandbox: super@visaflow.ai | password123'}
            </div>
          </div>

          {/* Footer Terms */}
          <div style={{ fontSize: '0.68rem', color: '#a0aec0', textAlign: 'center' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>
          </div>
        </div>

        {/* Right Side: Visual Mesh Aesthetic Art */}
        <div style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.4) 0%, transparent 60%)' }}></div>
          <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.1rem', color: '#0369a1', fontWeight: 500, flex: 1 }}>
              {lang === 'ar' ? 'حوّل أفكارك إلى تطبيقات واقعية مذهلة |' : 'Turn your ideas into apps |'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>↑</div>
          </div>
        </div>

      </div>
    </div>
  );
}
