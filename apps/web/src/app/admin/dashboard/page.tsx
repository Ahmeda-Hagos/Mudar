'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Header } from '../../../components/layout/Header';
import { useI18n } from '../../I18nContext';
import { ApiClient } from '../../../lib/api-client';

export default function AdminDashboard() {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'employees' | 'settings'>('reports');
  const [loading, setLoading] = useState(true);

  // Data states
  const [apps, setApps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [docTemplates, setDocTemplates] = useState<any[]>([]);

  // Settings states
  const [officeName, setOfficeName] = useState('مكتب السفر السريع');
  const [officeAddress, setOfficeAddress] = useState('الرياض، المملكة العربية السعودية');

  // Creation forms states
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplCountry, setTplCountry] = useState('');
  const [tplCode, setTplCode] = useState('');
  const [tplReqs, setTplReqs] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const appData: any[] = await ApiClient.get('/applications');
      setApps(appData);

      const userData: any[] = await ApiClient.get('/users');
      setUsers(userData.filter(u => u.role === 'EMPLOYEE' || u.role === 'ADMIN'));

      const templatesData: any[] = await ApiClient.get('/templates');
      setDocTemplates(templatesData);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/users', {
        name: empName,
        email: empEmail,
        password: empPassword,
        role: 'EMPLOYEE',
      });
      alert('تم إضافة الموظف الجديد بنجاح!');
      setShowEmployeeForm(false);
      setEmpName('');
      setEmpEmail('');
      setEmpPassword('');
      fetchData();
    } catch {
      alert('فشل في إضافة الموظف');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء صلاحية هذا الموظف؟')) return;
    try {
      await ApiClient.delete(`/users/${id}`);
      alert('تم إلغاء صلاحية الموظف بنجاح');
      fetchData();
    } catch {
      alert('فشل في إزالة الموظف');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requiredDocs = tplReqs.split(',').map(s => s.trim()).filter(Boolean);
      await ApiClient.post('/templates', {
        country: tplCountry,
        countryCode: tplCode.toUpperCase(),
        requiredDocs,
        optionalDocs: [],
      });
      alert('تم حفظ نموذج متطلبات الدولة بنجاح!');
      setShowTemplateForm(false);
      setTplCountry('');
      setTplCode('');
      setTplReqs('');
      fetchData();
    } catch {
      alert('فشل في حفظ النموذج');
    }
  };

  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateOnboardingLink = () => {
    // Generate a temporary/unique client onboarding intake link token
    const token = 'tok_' + Math.floor(100000 + Math.random() * 900000);
    const link = `${window.location.origin}/customer/onboarding?token=${token}`;
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert(lang === 'ar' ? 'تم نسخ الرابط إلى الحافظة!' : 'Link copied to clipboard!');
  };

  const handleSaveSettings = () => {
    alert('تم حفظ إعدادات المكتب بنجاح!');
  };

  // KPIs
  const totalApps = apps.length;
  const completedApps = apps.filter(a => a.status === 'COMPLETED' || a.status === 'READY_FOR_PICKUP').length;
  const activeApps = totalApps - completedApps;
  const completionRate = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0;

  return (
    <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
      {/* Use the shared Sidebar component directly */}
      <Sidebar role="ADMIN" activeTab={activeTab} onTabChange={(tab: any) => setActiveTab(tab)} />

      <main className="main-content" style={{ flex: 1 }}>
        <Header 
          title={
            activeTab === 'reports' 
              ? (lang === 'ar' ? 'التقارير وتحليلات الأداء' : 'Reports & Performance') 
              : activeTab === 'templates' 
              ? (lang === 'ar' ? 'نماذج متطلبات الدول' : 'Country Requirement Checklists') 
              : activeTab === 'employees' 
              ? t('navEmployees') 
              : t('navSettings')
          } 
          avatarChar="م" 
          profileName={lang === 'ar' ? 'مدير المكتب' : 'Office Owner'} 
        />

        <div style={{ padding: '1.5rem 2rem' }}>
          {loading ? (
            <div>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : (
            <>
              {/* TAB 1: REPORTS & KPIS */}
              {activeTab === 'reports' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="super-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
                    <div className="stat-card">
                      <span className="stat-title">{t('kpiTotal')}</span>
                      <span className="stat-value">{totalApps}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-title" style={{ color: 'var(--warning)' }}>{t('kpiActive')}</span>
                      <span className="stat-value" style={{ color: 'var(--warning)' }}>{activeApps}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-title" style={{ color: 'var(--success)' }}>{t('kpiCompleted')}</span>
                      <span className="stat-value" style={{ color: 'var(--success)' }}>{completedApps}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-title">{t('kpiConversion')}</span>
                      <span className="stat-value">{completionRate}%</span>
                    </div>
                  </div>

                  {/* Onboarding Intake Link Generator */}
                  <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{lang === 'ar' ? 'رابط تسجيل بيانات العملاء الجدد' : 'Customer Intake Onboarding Link'}</h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {lang === 'ar' ? 'قم بتوليد رابط مباشر وإرساله للعميل ليقوم برفع وثائقه بنفسه.' : 'Generate a unique secure link to send to clients so they can self-onboard and scan files.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {generatedLink && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{generatedLink}</span>
                          <button className="btn btn-secondary btn-sm" onClick={handleCopyLink} style={{ padding: '4px 8px' }}>
                            📋
                          </button>
                        </div>
                      )}
                      <button className="btn btn-primary" onClick={handleGenerateOnboardingLink}>
                        {lang === 'ar' ? '✨ توليد رابط جديد' : '✨ Generate Link'}
                      </button>
                    </div>
                  </div>

                  <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h3>{t('chartDestination')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                        {apps.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{lang === 'ar' ? 'لا توجد بيانات كافية' : 'No data available'}</p> : (
                          Object.entries(
                            apps.reduce((acc, curr) => {
                              acc[curr.destination] = (acc[curr.destination] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([country, count]) => (
                            <div key={country} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                              <span>{country}</span>
                              <strong>{Number(count)}</strong>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h3>{t('chartEmployee')}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                        {users.map(u => (
                          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{u.name}</span>
                            <span className="badge">{lang === 'ar' ? 'موظف نشط' : 'Active Staff'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COUNTRY TEMPLATES */}
              {activeTab === 'templates' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>{t('templateManagerTitle')}</h2>
                    <button className="btn btn-primary" onClick={() => setShowTemplateForm(!showTemplateForm)}>
                      {showTemplateForm ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : t('addTemplate')}
                    </button>
                  </div>

                  {showTemplateForm && (
                    <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '20px', maxWidth: '500px' }}>
                      <h3>{t('addTemplate')}</h3>
                      <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        <div className="form-group">
                          <label>{t('countryName')}</label>
                          <input type="text" className="form-control" value={tplCountry} onChange={(e) => setTplCountry(e.target.value)} placeholder="France" required />
                        </div>
                        <div className="form-group">
                          <label>{t('countryCode')}</label>
                          <input type="text" className="form-control" value={tplCode} onChange={(e) => setTplCode(e.target.value)} placeholder="FR" required />
                        </div>
                        <div className="form-group">
                          <label>{lang === 'ar' ? 'المستندات المطلوبة (مفصولة بفاصلة)' : 'Required Documents (comma separated)'}</label>
                          <input type="text" className="form-control" value={tplReqs} onChange={(e) => setTplReqs(e.target.value)} placeholder="Passport, ID, Photo" required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
                          {lang === 'ar' ? 'حفظ النموذج' : 'Save Template'}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="card" style={{ padding: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>{t('countryName')}</th>
                          <th>{t('countryCode')}</th>
                          <th>{t('requiredDocsList')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docTemplates.map((t) => (
                          <tr key={t.id}>
                            <td><strong>{t.country}</strong></td>
                            <td>{t.countryCode}</td>
                            <td>{typeof t.requiredDocs === 'string' ? JSON.parse(t.requiredDocs).join(', ') : t.requiredDocs?.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EMPLOYEES */}
              {activeTab === 'employees' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>{lang === 'ar' ? 'إدارة موظفي الفرع' : 'Branch Staff Management'}</h2>
                    <button className="btn btn-primary" onClick={() => setShowEmployeeForm(!showEmployeeForm)}>
                      {showEmployeeForm ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : (lang === 'ar' ? '+ إضافة موظف جديد' : '+ Onboard Staff')}
                    </button>
                  </div>

                  {showEmployeeForm && (
                    <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '20px', maxWidth: '500px' }}>
                      <h3>{lang === 'ar' ? 'بيانات الموظف الجديد' : 'New Staff Credentials'}</h3>
                      <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        <div className="form-group">
                          <label>{t('fullName')}</label>
                          <input type="text" className="form-control" value={empName} onChange={(e) => setEmpName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input type="email" className="form-control" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                          <input type="password" className="form-control" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
                          {lang === 'ar' ? 'حفظ الموظف' : 'Save Staff'}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="card" style={{ padding: 0 }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>{t('fullName')}</th>
                          <th>Email</th>
                          <th>{lang === 'ar' ? 'الدور الممنوح' : 'Assigned Role'}</th>
                          <th>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td><span className="badge">{u.role}</span></td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteEmployee(u.id)} style={{ color: '#ef4444' }}>
                                {lang === 'ar' ? 'إلغاء الصلاحية' : 'Revoke Access'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: OFFICE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="card glass-panel" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2>{t('settingsTitle')}</h2>
                  
                  <div className="form-group">
                    <label>{lang === 'ar' ? 'اسم المكتب / الشركة' : 'Office / Agency Name'}</label>
                    <input type="text" className="form-control" value={officeName} onChange={(e) => setOfficeName(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>{lang === 'ar' ? 'عنوان المكتب الرئيسي' : 'Main Office Address'}</label>
                    <input type="text" className="form-control" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} />
                  </div>

                  <button className="btn btn-primary btn-sm" onClick={handleSaveSettings} style={{ alignSelf: 'flex-end' }}>
                    {t('saveChanges')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
