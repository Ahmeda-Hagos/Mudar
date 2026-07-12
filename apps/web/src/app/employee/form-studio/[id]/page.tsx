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

export default function FormStudioPage({ params }: PageProps) {
  const { t } = useI18n();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [filledState, setFilledState] = useState<Record<string, { value: string; label: string }>>({});
  const [completionPct, setCompletionPct] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const appData: any = await ApiClient.get(`/applications/${id}`);
      setApp(appData);

      const templateList: any[] = await ApiClient.get('/form-templates');
      setTemplates(templateList);

      // Default select template matching country destination code
      const matching = templateList.find(
        (t) => t.countryCode.toUpperCase() === appData.destinationCode?.toUpperCase() || t.countryCode.toUpperCase() === 'FR',
      );
      if (matching) {
        handleSelectTemplate(matching, appData);
      }
    } catch (err) {
      console.error('Error fetching studio metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSelectTemplate = (template: any, currentApp = app) => {
    setSelectedTemplate(template);
    
    // Parse mappings configuration
    let mappings: any[] = [];
    try {
      mappings = typeof template.fieldMappings === 'string' 
        ? JSON.parse(template.fieldMappings) 
        : template.fieldMappings || [];
    } catch {
      mappings = [];
    }

    const state: Record<string, { value: string; label: string }> = {};
    let filledCount = 0;

    mappings.forEach((mapping: any) => {
      // Resolve application data key references (e.g. extractedData.passportNo)
      let resolvedValue = '';
      if (mapping.dataKey === 'extractedData.passportNo') {
        resolvedValue = currentApp?.extractedData?.passportNo || '';
      } else if (mapping.dataKey === 'customerName') {
        resolvedValue = currentApp?.customerName || '';
      } else if (mapping.dataKey === 'extractedData.fullName') {
        resolvedValue = currentApp?.extractedData?.fullName || currentApp?.customerName || '';
      } else {
        resolvedValue = mapping.manualValue || '';
      }

      state[mapping.pdfFieldName] = {
        value: resolvedValue,
        label: mapping.labelEn || mapping.pdfFieldName,
      };

      if (resolvedValue) filledCount++;
    });

    setFilledState(state);
    setCompletionPct(mappings.length > 0 ? Math.round((filledCount / mappings.length) * 100) : 0);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    const nextState = {
      ...filledState,
      [fieldName]: {
        ...filledState[fieldName],
        value,
      },
    };
    setFilledState(nextState);

    const keys = Object.keys(nextState);
    const filledCount = keys.filter((k) => nextState[k].value).length;
    setCompletionPct(keys.length > 0 ? Math.round((filledCount / keys.length) * 100) : 0);
  };

  const handleDownload = async () => {
    if (!selectedTemplate) return;
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/form-templates/${selectedTemplate.id}/fill`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mudar_token')}`,
          'x-tenant-id': localStorage.getItem('mudar_tenant_id') || '',
        },
        body: JSON.stringify({
          applicationId: id,
          filledState,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `filled-${selectedTemplate.countryCode.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('فشل في توليد وتحميل ملف الـ PDF');
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>جاري التحميل...</div>;
  }

  return (
    <div className="flex w-full h-full" style={{ minHeight: '100vh' }}>
      <Sidebar role="EMPLOYEE" />

      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header 
          title="محرك تعبئة النماذج" 
          avatarChar="أ" 
          profileName="أحمد الحربي" 
        />

        <div className="studio-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1 }}>
          
          {/* Left Sidebar */}
          <div className="studio-sidebar" style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div className="studio-sidebar-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Template selector */}
              <select 
                className="form-control" 
                value={selectedTemplate?.id || ''} 
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value);
                  if (t) handleSelectTemplate(t);
                }}
              >
                <option value="">اختر النموذج...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.formName} ({t.country})</option>
                ))}
              </select>

              {/* Completion badge */}
              <div className="completion-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '12px' }}>
                <div>
                  <div className="completion-pct">{completionPct}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>اكتمال النموذج</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleDownload} 
                  disabled={!selectedTemplate}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}
                >
                  ⬇️ تحميل النموذج المعبأ (PDF)
                </button>
              </div>
            </div>

            {/* Field list */}
            <div className="studio-field-list" style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
              {Object.keys(filledState).length === 0 ? (
                <div className="autofill-progress" style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '2.5rem' }}>📋</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    اختر نموذجاً لتعديل حقول المعاملة وتصدير المستند
                  </p>
                </div>
              ) : (
                Object.entries(filledState).map(([fieldName, data]) => (
                  <div key={fieldName} className="field-item" style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data.label} ({fieldName})</div>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={data.value} 
                      onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                      style={{ marginTop: '4px', padding: '6px' }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: PDF Preview */}
          <div className="studio-main" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <div className="studio-toolbar" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <span>معاينة المستند</span>
            </div>
            
            <div className="pdf-viewer-container" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
              <div className="studio-empty-state" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem' }}>📄</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>معاينة حية للنموذج</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  يمكنك تعديل القيم مباشرة من الحقول المجاورة ثم الضغط على زر التحميل لتنزيل الملف المكتمل.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
