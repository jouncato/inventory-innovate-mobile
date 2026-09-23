import { useState, useEffect } from 'react';
import type { InventorySession, DetectedObject, SolgarProduct, AuditTrailEvent } from './types/inventory';
import { InventoryApiService } from './services/api';
import { Header } from './components/Header';
import { SessionDashboard } from './components/SessionDashboard';
import { DiscrepancyReconciliation } from './components/DiscrepancyReconciliation';
import { AuditTrailViewer } from './components/AuditTrailViewer';
import { CatalogViewer } from './components/CatalogViewer';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconciliation' | 'audit' | 'catalog'>('dashboard');
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ses-col-bgo-001');
  const [catalog, setCatalog] = useState<SolgarProduct[]>([]);
  const [exceptions, setExceptions] = useState<DetectedObject[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditTrailEvent[]>([]);
  const [selectedAuditAggregateId, setSelectedAuditAggregateId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      const loadedSessions = await InventoryApiService.getSessions();
      setSessions(loadedSessions);

      const loadedCatalog = await InventoryApiService.getCatalog();
      setCatalog(loadedCatalog);

      const loadedExceptions = await InventoryApiService.getExceptions(selectedSessionId);
      setExceptions(loadedExceptions);

      const loadedAudit = await InventoryApiService.getAuditTrail();
      setAuditEvents(loadedAudit);
    };

    loadData();
  }, [selectedSessionId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleValidate = async (
    exceptionId: string,
    validationType: 'CONFIRM' | 'CORRECT_SKU' | 'DISCARD',
    correctedSku?: string,
    notes?: string
  ) => {
    const payload = {
      physical_object_id: exceptionId,
      operator_id: 'op-supervisor-web',
      validation_type: validationType,
      corrected_sku: correctedSku,
      notes: notes
    };

    await InventoryApiService.submitValidation(payload);

    // Update local state
    setExceptions(prev => prev.filter(e => e.id !== exceptionId));

    // Append forensic audit event
    const newAuditEvent: AuditTrailEvent = {
      event_id: `ev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event_type: 'HUMAN_VALIDATION',
      aggregate_id: exceptionId,
      operator_or_system: 'Supervisor Web (Carlos Mendoza)',
      details: {
        action: validationType,
        assigned_sku: correctedSku || 'DISCARDED',
        supervisor_notes: notes || 'Validación rápida',
        channel: 'WEB_ADMIN_DASHBOARD'
      }
    };
    setAuditEvents(prev => [newAuditEvent, ...prev]);

    // Update active session counters
    setSessions(prev => prev.map(s => {
      if (s.id === selectedSessionId) {
        return {
          ...s,
          pending_exceptions_count: Math.max(0, s.pending_exceptions_count - 1),
          auto_resolved_count: s.auto_resolved_count + (validationType !== 'DISCARD' ? 1 : 0)
        };
      }
      return s;
    }));

    showToast(`✓ Decisión registrada con éxito en la cadena de auditoría inmutable.`);
  };

  const navigateToAudit = (aggregateId?: string) => {
    setSelectedAuditAggregateId(aggregateId);
    setActiveTab('audit');
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--color-navy)',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderLeft: '4px solid var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Brand Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={setSelectedSessionId}
        pendingExceptionsCount={exceptions.length}
      />

      {/* Main Container */}
      <main className="main-content">
        {currentSession ? (
          <>
            {activeTab === 'dashboard' && (
              <SessionDashboard
                session={currentSession}
                exceptions={exceptions}
                onNavigateToReconciliation={() => setActiveTab('reconciliation')}
                onNavigateToAudit={navigateToAudit}
              />
            )}

            {activeTab === 'reconciliation' && (
              <DiscrepancyReconciliation
                exceptions={exceptions}
                catalog={catalog}
                onValidate={handleValidate}
                onNavigateToAudit={navigateToAudit}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailViewer
                events={auditEvents}
                selectedAggregateId={selectedAuditAggregateId}
              />
            )}

            {activeTab === 'catalog' && (
              <CatalogViewer catalog={catalog} />
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p>Cargando sesión de inventario...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
