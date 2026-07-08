'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '../../I18nContext';
import { ApiClient } from '../../../lib/api-client';

export default function OnboardingPage() {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [appId, setAppId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Load checklist dynamically when destination changes
  useEffect(() => {
    if (!destination) {
      setChecklist([]);
      return;
    }

    const fetchChecklist = async () => {
      try {
        const templates: any[] = await ApiClient.get(`/templates?countryCode=${destination}`);
        if (templates.length > 0) {
          const required = typeof templates[0].requiredDocs === 'string'
            ? JSON.parse(templates[0].requiredDocs)
            : templates[0].requiredDocs || [];
          setChecklist(required);
        } else {
          setChecklist(['جواز السفر (Passport)', 'صورة شخصية (Personal Photo)']);
        }
      } catch (err) {
        setChecklist(['جواز السفر (Passport)', 'صورة شخصية (Personal Photo)']);
      }
    };

    fetchChecklist();
  }, [destination]);

  const handleFileUpload = async (docType: string, file: File) => {
    if (!appId) {
      try {
        const mockApp: any = await ApiClient.post('/applications', {
          customerName: lang === 'ar' ? 'عميل أونلاين' : 'Online Client',
          destination,
          travelDate,
        });
        setAppId(mockApp.id);
      } catch {
        const fallbackId = 'app-' + Math.floor(10000 + Math.random() * 90000);
        setAppId(fallbackId);
      }
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', appId || 'app-74921');
    formData.append('type', docType);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/documents/upload`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('visaflow_token')}`,
          'x-tenant-id': localStorage.getItem('visaflow_tenant_id') || '',
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      setUploadedFiles(prev => ({
        ...prev,
        [docType]: file.name,
      }));
      alert(lang === 'ar' ? `تم رفع مستند ${docType} بنجاح!` : `Document ${docType} uploaded successfully!`);
    } catch (err) {
      alert(lang === 'ar' ? 'فشل في رفع الملف' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      alert(lang === 'ar' ? 'تم تقديم طلب التأشيرة بنجاح!' : 'Visa application submitted successfully!');
      window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-column w-full align-center justify-center" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      
      {/* Header controls for language switch */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('appName')}</h2>
        <button className="lang-switch" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
          {t('langToggle')}
        </button>
      </div>

      <div className="phone-container card glass-panel" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div className="screen-content" style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="ios-step-indicator" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>{lang === 'ar' ? `الخطوة ${step} من 3` : `Step ${step} of 3`}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '24px', height: '4px', background: step >= 1 ? 'var(--primary)' : 'var(--border-color)', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', background: step >= 2 ? 'var(--primary)' : 'var(--border-color)', borderRadius: '2px' }} />
              <div style={{ width: '24px', height: '4px', background: step >= 3 ? 'var(--primary)' : 'var(--border-color)', borderRadius: '2px' }} />
            </div>
          </div>
          
          {step === 1 && (
            <div className="ios-step active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 className="ios-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('qDestination')}</h2>
              <select className="form-control" value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="">{t('inputPlaceholderDestination')}</option>
                <option value="FR">{lang === 'ar' ? 'فرنسا (France)' : 'France'}</option>
                <option value="ES">{lang === 'ar' ? 'إسبانيا (Spain)' : 'Spain'}</option>
                <option value="GB">{lang === 'ar' ? 'المملكة المتحدة (UK)' : 'United Kingdom'}</option>
              </select>

              <h2 className="ios-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('qTravelDate')}</h2>
              <input type="date" className="form-control" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />

              <h2 className="ios-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('qTravelers')}</h2>
              <input type="number" className="form-control" min={1} value={travelers} onChange={(e) => setTravelers(parseInt(e.target.value))} />
            </div>
          )}

          {step === 2 && (
            <div className="ios-step active" style={{ overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 className="ios-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{lang === 'ar' ? 'رفع المستندات المطلوبة' : 'Upload Required Documents'}</h2>
              {checklist.map((docType) => (
                <div key={docType} className="ios-option-card" style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{docType}</span>
                  <input 
                    type="file" 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(docType, e.target.files[0])} 
                    disabled={uploading}
                    style={{ fontSize: '0.8rem' }}
                  />
                  {uploadedFiles[docType] && (
                    <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ {uploadedFiles[docType]}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="ios-step active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 className="ios-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('wizardStep3Title')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div><strong>{lang === 'ar' ? 'الوجهة:' : 'Destination:'}</strong> {destination}</div>
                <div><strong>{lang === 'ar' ? 'تاريخ السفر:' : 'Travel Date:'}</strong> {travelDate}</div>
                <div><strong>{lang === 'ar' ? 'المسافرين:' : 'Travelers:'}</strong> {travelers}</div>
                <div>
                  <strong>{lang === 'ar' ? 'المستندات المرفوعة:' : 'Uploaded Files:'}</strong>
                  {Object.keys(uploadedFiles).length === 0 ? (lang === 'ar' ? ' لم يتم الرفع' : ' None') : (
                    <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      {Object.entries(uploadedFiles).map(([type, name]) => (
                        <li key={type} style={{ fontSize: '0.82rem' }}>{type}: {name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Saudi Data Privacy Compliance Consent Box */}
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '10px', marginTop: '10px' }}>
                <input 
                  type="checkbox" 
                  id="consent-check" 
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                />
                <label htmlFor="consent-check" style={{ fontSize: '0.78rem', lineHeight: 1.4, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {lang === 'ar' 
                    ? 'أوافق بموجب هذا صراحةً على جمع ومعالجة بياناتي الحساسة ووثائق السفر الخاصة بي للغرض المحدد وفقاً للائحة التنفيذية لنظام حماية البيانات الشخصية الصادر عن سدايا (SDAIA).' 
                    : 'I hereby explicitly consent to the collection and processing of my sensitive PII and travel documents for the specified purpose in compliance with Saudi PDPL regulations under SDAIA.'}
                </label>
              </div>
            </div>
          )}

          <div className="ios-button-bar" style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '12px' }}>
            {step > 1 && (
              <button className="btn btn-secondary w-full" onClick={() => setStep(step - 1)}>
                {t('back')}
              </button>
            )}
            <button 
              className="btn btn-primary w-full" 
              onClick={handleNext} 
              disabled={(step === 1 && !destination) || (step === 3 && !consentChecked)}
            >
              {step === 3 ? (lang === 'ar' ? 'تقديم الطلب النهائي' : 'Submit Application') : t('next')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
