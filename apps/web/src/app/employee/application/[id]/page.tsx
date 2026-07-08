'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { Header } from '../../../../components/layout/Header';
import { useI18n } from '../../../I18nContext';
import { ApiClient } from '../../../../lib/api-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApplicationDetailPage({ params }: PageProps) {
  const { t } = useI18n();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any>(null);

  const [hotelName, setHotelName] = useState('');
  const [hotelPhone, setHotelPhone] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [purpose, setPurpose] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data: any = await ApiClient.get(`/applications/${id}`);
      setApp(data);
      if (data.travelAccommodation) {
        setHotelName(data.travelAccommodation.hotelName || '');
        setHotelPhone(data.travelAccommodation.hotelPhone || '');
        setHotelAddress(data.travelAccommodation.hotelAddress || '');
        setHotelCity(data.travelAccommodation.hotelCity || '');
        setPurpose(data.travelAccommodation.purposeOfTravel || '');
      }
    } catch (err) {
      console.error('Error loading details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSaveTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.put(`/applications/${id}/travel-accommodation`, {
        hotelName,
        hotelPhone,
        hotelAddress,
        hotelCity,
        purposeOfTravel: purpose,
      });
      alert('تم حفظ تفاصيل السفر والإقامة بنجاح!');
      fetchDetails();
    } catch (err) {
      alert('فشل في حفظ تفاصيل السفر');
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>جاري التحميل...</div>;
  }

  return (
    <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
      <Sidebar role="EMPLOYEE" />

      <main className="main-content" style={{ flex: 1 }}>
        <Header 
          title={`تفاصيل الطلب: ${app?.appNumber || id}`} 
          avatarChar="أ" 
          profileName="أحمد الحربي" 
        />

        <div className="detail-layout animate-fade-in" style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Left panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                معلومات العميل
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>الاسم الكامل</span>
                  <p className="font-bold">{app?.customerName || '-'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>رقم الهاتف</span>
                  <p className="font-bold">{app?.customerPhone || '-'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>الوجهة</span>
                  <p className="font-bold">{app?.destination || '-'}</p>
                </div>
              </div>
            </div>

            {/* Travel & Accommodation Fields */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                تفاصيل السفر والإقامة
              </h3>
              <form onSubmit={handleSaveTravel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>اسم الفندق</label>
                    <input type="text" className="form-control" value={hotelName} onChange={(e) => setHotelName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>رقم هاتف الفندق</label>
                    <input type="text" className="form-control" value={hotelPhone} onChange={(e) => setHotelPhone(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>عنوان الفندق</label>
                    <input type="text" className="form-control" value={hotelAddress} onChange={(e) => setHotelAddress(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>مدينة الفندق</label>
                    <input type="text" className="form-control" value={hotelCity} onChange={(e) => setHotelCity(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>الغرض من السفر</label>
                    <input type="text" className="form-control" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '8px', alignSelf: 'flex-end' }}>
                  حفظ تفاصيل السفر
                </button>
              </form>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                استخراج البيانات الذكي (OCR + AI)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>رقم جواز السفر</div>
                  <strong>{app?.extractedData?.passportNo || '-'}</strong>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>تاريخ الانتهاء</div>
                  <strong>{app?.extractedData?.expiryDate || '-'}</strong>
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.href = `/employee/form-studio/${id}`}
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}
            >
              🧐 الذهاب إلى محرك تعبئة النماذج
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
