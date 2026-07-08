'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Header } from '../../../components/layout/Header';
import { useI18n } from '../../I18nContext';
import { ApiClient } from '../../../lib/api-client';

interface Application {
  id: string;
  appNumber: string;
  customerName: string;
  destination: string;
  travelDate: string;
  status: string;
  isUrgent?: boolean;
}

const KANBAN_STAGES = [
  { id: 'NEW_REQUEST', titleAr: 'طلب جديد', titleEn: 'New Request', indicator: 'new' },
  { id: 'WAITING_DOCUMENTS', titleAr: 'بانتظار مستندات', titleEn: 'Waiting for Docs', indicator: 'waiting' },
  { id: 'UNDER_REVIEW', titleAr: 'تحت المراجعة', titleEn: 'Under Review', indicator: 'review' },
  { id: 'READY_FOR_BOOKING', titleAr: 'جاهز للحجز', titleEn: 'Ready for Booking', indicator: 'booking' },
  { id: 'APPOINTMENT_BOOKED', titleAr: 'تم حجز الموعد', titleEn: 'Appt Booked', indicator: 'booked' },
  { id: 'RESERVATIONS_PREPARED', titleAr: 'الحجوزات جاهزة', titleEn: 'Reservations Prepared', indicator: 'reservations' },
  { id: 'READY_FOR_PICKUP', titleAr: 'جاهز للتسليم', titleEn: 'Ready for Pickup', indicator: 'pickup' },
  { id: 'COMPLETED', titleAr: 'مكتمل', titleEn: 'Completed', indicator: 'completed' },
];

export default function EmployeeDashboard() {
  const { t, lang } = useI18n();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterMode, setFilterMode] = useState<'all' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Application[]>('/applications');
      setApps(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.appNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgent = filterMode === 'urgent' ? app.isUrgent : true;
    return matchesSearch && matchesUrgent;
  });

  return (
    <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
      <Sidebar role="EMPLOYEE" />

      <main className="main-content" style={{ flex: 1 }}>
        <Header 
          title={t('employeeDashboardTitle')} 
          avatarChar="أ" 
          profileName="أحمد الحربي" 
        />

        {/* Sub-Header Filters & Search */}
        <div style={{ padding: '1.5rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexGrow: 1, maxWidth: '600px' }}>
            <input
              type="text"
              className="form-control"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '350px' }}
            />
            
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
              <button
                className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterMode('all')}
                style={{ border: 'none' }}
              >
                {t('assignedToMe')}
              </button>
              <button
                className={`btn btn-sm ${filterMode === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterMode('urgent')}
                style={{ border: 'none', color: '#ef4444' }}
              >
                العاجلة فقط 🔴
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('kanban')}
              style={{ border: 'none' }}
            >
              {t('viewKanban')}
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('table')}
              style={{ border: 'none' }}
            >
              {t('viewTable')}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>جاري التحميل...</div>
        ) : (
          /* Kanban View Container */
          viewMode === 'kanban' ? (
            <div className="kanban-container" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1.5rem 2rem' }}>
              {KANBAN_STAGES.map(stage => {
                const stageApps = filteredApps.filter(app => app.status === stage.id);
                return (
                  <div key={stage.id} className="kanban-column" style={{ minWidth: '280px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                    <div className="column-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <strong>{lang === 'ar' ? stage.titleAr : stage.titleEn}</strong>
                      <span className="badge">{stageApps.length}</span>
                    </div>
                    <div className="kanban-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stageApps.map(app => (
                        <div
                          key={app.id}
                          className="kanban-card card"
                          onClick={() => window.location.href = `/employee/application/${app.id}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div>{app.appNumber}</div>
                          <strong>{app.customerName}</strong>
                          <div>{app.destination}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View Container */
            <div style={{ padding: '1.5rem 2rem' }}>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t('appNumber')}</th>
                      <th>{t('fullName')}</th>
                      <th>{t('appDestination')}</th>
                      <th>{t('appTravelDate')}</th>
                      <th>{t('appStatus')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map(app => (
                      <tr key={app.id}>
                        <td>{app.appNumber}</td>
                        <td><strong>{app.customerName}</strong></td>
                        <td>{app.destination}</td>
                        <td>{app.travelDate}</td>
                        <td>{app.status}</td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => window.location.href = `/employee/application/${app.id}`}>
                            {t('openDetails')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
