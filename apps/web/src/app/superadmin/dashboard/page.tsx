'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Header } from '../../../components/layout/Header';
import { useI18n } from '../../I18nContext';

interface TenantDetail {
  id: string;
  name: string;
  plan: string;
  users: number;
  limit: number;
  storage: string;
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
  flags: { ocrEnabled: boolean; automationsEnabled: boolean };
}

export default function SuperAdminDashboard() {
  const { lang } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Tenant for lifecycle management
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null);

  // Platform-wide Announcements state
  const [announcementText, setAnnouncementText] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);

  // Initial Seed Tenants Data
  const [tenants, setTenants] = useState<TenantDetail[]>([
    {
      id: 'tenant-default',
      name: 'مكتب السفر السريع',
      plan: 'PROFESSIONAL',
      users: 3,
      limit: 10,
      storage: '1.2 GB / 5 GB',
      status: 'ACTIVE',
      flags: { ocrEnabled: true, automationsEnabled: true }
    },
    {
      id: 'tenant-elite',
      name: 'النخبة للخدمات الدبلوماسية',
      plan: 'ENTERPRISE',
      users: 18,
      limit: 50,
      storage: '4.8 GB / 20 GB',
      status: 'ACTIVE',
      flags: { ocrEnabled: true, automationsEnabled: true }
    }
  ]);

  // Support Tickets Integration Mock
  const [tickets, setTickets] = useState([
    { id: 'TCK-928', tenant: 'مكتب السفر السريع', title: 'فشل معالجة استخراج PDF فرنسا', priority: 'HIGH', status: 'OPEN' },
    { id: 'TCK-401', tenant: 'النخبة للخدمات', title: 'تأخر استلام إشعارات البريد', priority: 'ENTERPRISE', status: 'RESOLVED' }
  ]);

  // Global Security Logs
  const [securityLogs] = useState([
    { timestamp: '2026-07-08 09:12:04', desc: 'تكرار محاولات تسجيل دخول خاطئة من IP 192.168.1.4', type: 'WARNING' },
    { timestamp: '2026-07-08 08:44:12', desc: 'محاولة وصول غير مصرح بها لـ tenant-elite من مستخدم خارجي', type: 'CRITICAL' }
  ]);

  // System Errors categories feed
  const [systemErrors] = useState([
    { code: 'ERR-503', severity: 'P0', msg: 'فشل في الاتصال بمزود معالجة OCR (Document AI)', time: 'منذ دقيقتين' },
    { code: 'ERR-400', severity: 'P2', msg: 'بيانات جواز سفر غير مقروءة بملف PDF', time: 'منذ ١٠ دقائق' }
  ]);

  const handleUpdateStatus = (tenantId: string, status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED') => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status } : t));
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleToggleFlag = (tenantId: string, flag: 'ocrEnabled' | 'automationsEnabled') => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const updatedFlags = { ...t.flags, [flag]: !t.flags[flag] };
        return { ...t, flags: updatedFlags };
      }
      return t;
    }));
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant(prev => {
        if (!prev) return null;
        return { ...prev, flags: { ...prev.flags, [flag]: !prev.flags[flag] } };
      });
    }
  };

  const handlePushAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setActiveAnnouncement(announcementText);
    setAnnouncementText('');
    alert(lang === 'ar' ? 'تم نشر الإعلان بنجاح إلى جميع لوحات الوكالات!' : 'Announcement pushed successfully to all tenants!');
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
      <Sidebar role="SUPER_ADMIN" activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="main-content" style={{ flex: 1 }}>
        <Header 
          title="لوحة إدارة المنصة (SaaS Super Admin)" 
          avatarChar="S" 
          profileName="Super Admin" 
        />

        {activeAnnouncement && (
          <div style={{ background: '#fef3c7', borderBottom: '1px solid #f59e0b', color: '#d97706', padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📢 إعلان المنصة النشط: {activeAnnouncement}</span>
            <button onClick={() => setActiveAnnouncement(null)} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
          </div>
        )}

        <div style={{ padding: '1.5rem 2rem' }}>
          
          {/* TAB 1: System Health & Observability */}
          {activeTab === 'overview' && (
            <section id="tab-overview" style={{ display: 'block' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>نظرة عامة على المنصة وبنية التحتية</h2>
              
              {/* Infrastructure Real-time metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>إجمالي الوكالات</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>{tenants.length}</div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>١٠٠٪ نشطة هذا الأسبوع</div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>CPU Cluster Load</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>24.2%</div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '24.2%', height: '100%', background: '#10b981' }}></div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Memory Consumption</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#eab308' }}>68.4%</div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '68.4%', height: '100%', background: '#eab308' }}></div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Uptime & Average Latency</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>99.98%</div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px' }}>متوسط زمن الاستجابة: 124ms</div>
                </div>
              </div>

              {/* Real-time System Critical Errors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444' }}>أعطال النظام النشطة (Critical Errors)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {systemErrors.map(err => (
                      <div key={err.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                        <div>
                          <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px', marginInlineEnd: '10px' }}>{err.severity}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{err.msg}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{err.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tenant Active State Distribution */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>توزيع نشاط الوكالات (Active / Idle)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Active Tenants</span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>2</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Trialing Tenants</span>
                      <span style={{ fontWeight: 600 }}>0</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Suspended Tenants</span>
                      <span style={{ fontWeight: 600, color: '#ef4444' }}>0</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: Tenant Lifecycle Management */}
          {activeTab === 'agencies' && (
            <section id="tab-agencies" style={{ display: 'block' }}>
              <div className="header-flex" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>إدارة دورة حياة الوكالات</h2>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '2px' }}>البحث والتحكم في إعدادات الوكالات المسجلة على المنصة</p>
                </div>
                
                {/* Search / Drill-down */}
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو المعرف..." 
                  style={{ padding: '8px 12px', fontSize: '0.85rem', width: '260px', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedTenant ? '1.5fr 1fr' : '1fr', gap: '1.5rem' }}>
                
                {/* Tenants List Table */}
                <div className="card" style={{ padding: 0 }}>
                  <div className="custom-table-container" style={{ border: 'none' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>الوكالة</th>
                          <th>الباقة (Plan)</th>
                          <th>الحالة</th>
                          <th>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTenants.map(tenant => (
                          <tr key={tenant.id} onClick={() => setSelectedTenant(tenant)} style={{ cursor: 'pointer', background: selectedTenant?.id === tenant.id ? 'rgba(91, 106, 208, 0.04)' : 'transparent' }}>
                            <td>
                              <strong>{tenant.name}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>ID: {tenant.id}</div>
                            </td>
                            <td><span className="badge">{tenant.plan}</span></td>
                            <td>
                              <span className={`badge ${tenant.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                                {tenant.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn btn-secondary btn-sm" onClick={(e) => {
                                  e.stopPropagation();
                                  // Impersonate triggers
                                  const mockAdminUser = { id: 'usr-admin', name: 'عبد الرحمن القحطاني', email: 'admin@Mudar.ai', role: 'ADMIN', tenantId: tenant.id };
                                  localStorage.setItem('Mudar_token', 'mock-admin-token');
                                  localStorage.setItem('Mudar_user', JSON.stringify(mockAdminUser));
                                  localStorage.setItem('Mudar_tenant_id', tenant.id);
                                  window.location.href = '/admin/dashboard';
                                }}>
                                  دخول كمدير
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tenant Overview Panel & Control Drill-Down */}
                {selectedTenant && (
                  <div className="card animate-fade-in" style={{ padding: '1.5rem', alignSelf: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>تفاصيل الوكالة</h3>
                      <button onClick={() => setSelectedTenant(null)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#6B7280', display: 'block', marginBottom: '2px' }}>اسم الوكالة</span>
                        <strong>{selectedTenant.name}</strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <span style={{ color: '#6B7280', display: 'block', marginBottom: '2px' }}>باقة الاشتراك</span>
                          <span className="badge">{selectedTenant.plan}</span>
                        </div>
                        <div>
                          <span style={{ color: '#6B7280', display: 'block', marginBottom: '2px' }}>المستخدمين النشطين</span>
                          <strong>{selectedTenant.users} / {selectedTenant.limit}</strong>
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#6B7280', display: 'block', marginBottom: '2px' }}>استهلاك مساحة التخزين</span>
                        <strong>{selectedTenant.storage}</strong>
                      </div>

                      {/* Feature Flagging controls */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
                        <span style={{ color: '#6B7280', display: 'block', marginBottom: '10px', fontWeight: 600 }}>التحكم بالميزات (Feature Flags)</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedTenant.flags.ocrEnabled} 
                              onChange={() => handleToggleFlag(selectedTenant.id, 'ocrEnabled')}
                            />
                            <span>تفعيل محرك استخراج البيانات الذكي (OCR)</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedTenant.flags.automationsEnabled} 
                              onChange={() => handleToggleFlag(selectedTenant.id, 'automationsEnabled')}
                            />
                            <span>تفعيل محرك الأتمتة التلقائي للنماذج</span>
                          </label>
                        </div>
                      </div>

                      {/* Control Operations */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px', display: 'flex', gap: '8px' }}>
                        {selectedTenant.status === 'ACTIVE' ? (
                          <button className="btn btn-secondary w-full" onClick={() => handleUpdateStatus(selectedTenant.id, 'SUSPENDED')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                            تعليق الوكالة
                          </button>
                        ) : (
                          <button className="btn btn-primary w-full" onClick={() => handleUpdateStatus(selectedTenant.id, 'ACTIVE')}>
                            تنشيط الحساب
                          </button>
                        )}
                        <button className="btn btn-secondary w-full" onClick={() => {
                          if (confirm('هل أنت متأكد من حذف حساب هذه الوكالة بالكامل؟')) {
                            setTenants(prev => prev.filter(t => t.id !== selectedTenant.id));
                            setSelectedTenant(null);
                          }
                        }} style={{ backgroundColor: '#f9fafb', color: '#4b5563' }}>
                          حذف الحساب
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: Global Operations & Governance */}
          {activeTab === 'infra' && (
            <section id="tab-infra" style={{ display: 'block' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Global Security Logs anomaly tracking */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>سجلات الأمان العالمية (Security & Governance Logs)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {securityLogs.map((log, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{log.timestamp}</span>
                          <span style={{ color: log.type === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontSize: '0.7rem', fontWeight: 'bold' }}>{log.type}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', margin: 0 }}>{log.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform-wide announcements trigger banner */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>دفع إعلانات النظام (System Announcements)</h3>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem', lineHeight: 1.4 }}>سيتم عرض هذا الشريط لجميع المستخدمين والوكلاء في المنصة فوراً.</p>
                  
                  <form onSubmit={handlePushAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <textarea 
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="أدخل رسالة الإعلان مثلاً: صيانة مجدولة للنظام الليلة..." 
                      style={{ width: '100%', height: '80px', padding: '10px', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none' }}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      نشر الإعلان
                    </button>
                  </form>
                </div>
              </div>

              {/* Support Ticket Integrations */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>تذاكر دعم العملاء (Centralized Support Tickets)</h3>
                <div className="custom-table-container" style={{ border: 'none' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>المعرف</th>
                        <th>الوكالة</th>
                        <th>عنوان التذكرة</th>
                        <th>أولوية الدعم</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket => (
                        <tr key={ticket.id}>
                          <td><strong>{ticket.id}</strong></td>
                          <td>{ticket.tenant}</td>
                          <td>{ticket.title}</td>
                          <td>
                            <span className={`badge ${ticket.priority === 'ENTERPRISE' ? 'badge-success' : 'badge-warning'}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td><span className="badge">{ticket.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </section>
          )}

        </div>
      </main>
    </div>
  );
}



