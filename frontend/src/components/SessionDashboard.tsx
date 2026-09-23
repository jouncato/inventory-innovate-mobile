import React, { useState } from 'react';
import type { InventorySession, DetectedObject } from '../types/inventory';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Camera, 
  User, 
  Wifi, 
  FileSpreadsheet, 
  Lock
} from 'lucide-react';

interface SessionDashboardProps {
  session: InventorySession;
  exceptions: DetectedObject[];
  onNavigateToReconciliation: () => void;
  onNavigateToAudit: (aggregateId?: string) => void;
}

export const SessionDashboard: React.FC<SessionDashboardProps> = ({
  session,
  exceptions,
  onNavigateToReconciliation,
}) => {
  const [liveEvents] = useState<string[]>([
    '08:34:15 - Detección automática exitosa: SOL-01300 (Ester-C 1000mg) vía OCR + Gemma (0.86)',
    '08:34:12 - Celery Worker 01 procesó captura cap-008-p4 en 214ms',
    '08:32:05 - Homografía estimada: 4 frascos enlazados con toma previa (0 doble conteo)',
    '08:30:00 - Operador Carlos Mendoza inició sesión de captura en Pasillo 04'
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Monitoreo de Sesión en Tiempo Real</h1>
          <p>{session.warehouse_name} • {session.location_zone}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Exportando acta oficial de conteo físico en formato CSV / PDF auditado...')}>
            <FileSpreadsheet size={16} />
            <span>Exportar Acta</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (exceptions.length > 0) {
                alert(`Invariante de Dominio: No es posible cerrar la sesión ${session.session_code}. Aún existen ${exceptions.length} excepciones pendientes de validación humana.`);
              } else {
                alert(`Sesión ${session.session_code} cerrada con éxito y sincronizada con el ERP.`);
              }
            }}
          >
            <Lock size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Unidades Detectadas</span>
            <div className="value">{session.total_detected_units}</div>
            <span className="subtext">En {session.total_captures} capturas fotográficas</span>
          </div>
          <div className="stat-icon icon-blue">
            <Package size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Resolución Automática</span>
            <div className="value">{session.accuracy_rate}%</div>
            <span className="subtext">{session.auto_resolved_count} unidades sin intervención</span>
          </div>
          <div className="stat-icon icon-green">
            <CheckCircle2 size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Excepciones Pendientes</span>
            <div className="value" style={{ color: exceptions.length > 0 ? '#D97706' : '#10B981' }}>
              {exceptions.length}
            </div>
            <span className="subtext">Requieren validación humana (HITL)</span>
          </div>
          <div className="stat-icon icon-amber">
            <AlertTriangle size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Referencias Únicas</span>
            <div className="value">{session.total_unique_products}</div>
            <span className="subtext">Productos Solgar identificados</span>
          </div>
          <div className="stat-icon icon-gold">
            <TrendingUp size={26} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Left Column: Live Visual Captures & Evidence */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Camera size={20} color="var(--color-primary)" />
              <span>Flujo de Evidencia Fotográfica y Bounding Boxes</span>
            </div>
            <span className="badge badge-primary">
              {session.total_captures} Tomas Procesadas
            </span>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{
              background: '#0F172A',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span className="badge badge-success">Toma Reciente #14</span>
                  <span style={{ color: '#94A3B8' }}>Estantería B - Nivel 2</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                  SHA-256: a3f8...01aa (MinIO S3)
                </span>
              </div>

              {/* Simulated Shelf View with Bounding Boxes */}
              <div style={{
                position: 'relative',
                height: '280px',
                background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Visual Shelf Line */}
                <div style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: 0,
                  right: 0,
                  height: '8px',
                  background: '#86754D',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }} />

                {/* Simulated Amber Bottles with BBoxes */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', height: '180px', marginBottom: '40px' }}>
                  {/* Bottle 1 - Auto Matched */}
                  <div style={{ position: 'relative', width: '70px', height: '130px', border: '2px solid #10B981', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)' }}>
                    <div style={{ position: 'absolute', top: '-18px', left: '-2px', background: '#10B981', color: '#FFF', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' }}>
                      SOL-01300 98%
                    </div>
                    <div style={{ width: '40px', height: '15px', background: '#86754D', margin: '6px auto 4px', borderRadius: '2px' }} />
                    <div style={{ width: '56px', height: '95px', background: '#58311F', margin: '0 auto', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#F3E8D0', fontWeight: 'bold' }}>ESTER-C</span>
                    </div>
                  </div>

                  {/* Bottle 2 - Auto Matched */}
                  <div style={{ position: 'relative', width: '75px', height: '145px', border: '2px solid #10B981', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)' }}>
                    <div style={{ position: 'absolute', top: '-18px', left: '-2px', background: '#10B981', color: '#FFF', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' }}>
                      SOL-02050 96%
                    </div>
                    <div style={{ width: '44px', height: '16px', background: '#86754D', margin: '6px auto 4px', borderRadius: '2px' }} />
                    <div style={{ width: '62px', height: '108px', background: '#58311F', margin: '0 auto', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#F3E8D0', fontWeight: 'bold' }}>OMEGA</span>
                    </div>
                  </div>

                  {/* Bottle 3 - Exception (Amber BBox) */}
                  <div style={{ position: 'relative', width: '70px', height: '130px', border: '2px dashed #F59E0B', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ position: 'absolute', top: '-18px', left: '-2px', background: '#F59E0B', color: '#FFF', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' }}>
                      REVISIÓN 74%
                    </div>
                    <div style={{ width: '40px', height: '15px', background: '#86754D', margin: '6px auto 4px', borderRadius: '2px' }} />
                    <div style={{ width: '56px', height: '95px', background: '#58311F', margin: '0 auto', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.5rem', color: '#FCD34D', textAlign: 'center' }}>¿1000mg ó 500mg?</span>
                    </div>
                  </div>

                  {/* Bottle 4 - Auto Matched */}
                  <div style={{ position: 'relative', width: '70px', height: '130px', border: '2px solid #10B981', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)' }}>
                    <div style={{ position: 'absolute', top: '-18px', left: '-2px', background: '#10B981', color: '#FFF', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' }}>
                      SOL-03410 99%
                    </div>
                    <div style={{ width: '40px', height: '15px', background: '#86754D', margin: '6px auto 4px', borderRadius: '2px' }} />
                    <div style={{ width: '56px', height: '95px', background: '#58311F', margin: '0 auto', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#F3E8D0', fontWeight: 'bold' }}>VIT D3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BBox Legend */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.75rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '2px' }} />
                  <span>Resuelto Automáticamente (Conf &gt; 85%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '2px' }} />
                  <span>Requiere Conciliación Humana (HITL)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '12px', height: '12px', background: '#86754D', borderRadius: '2px' }} />
                  <span>Trazado de Homografía (Multi-toma)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Se detectaron <strong>3 frascos con alta confianza</strong> y <strong>1 caso ambiguo</strong> en esta toma.
              </span>
              <button className="btn btn-gold btn-sm" onClick={onNavigateToReconciliation}>
                <span>Revisar Excepciones ({exceptions.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Session Details & WebSocket Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metadata Card */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title">
                <User size={18} color="var(--color-primary)" />
                <span>Detalles Operativos</span>
              </div>
              <span className={`badge ${session.status === 'OPEN' ? 'badge-success' : 'badge-primary'}`}>
                {session.status}
              </span>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Código Sesión:</span>
                <strong style={{ fontFamily: 'monospace' }}>{session.session_code}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Operador Asignado:</span>
                <strong>{session.operator_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Ubicación:</span>
                <span>{session.location_zone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Hora Inicio:</span>
                <span>{new Date(session.started_at).toLocaleTimeString('es-CO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Invariante Estado:</span>
                <span style={{ color: exceptions.length === 0 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                  {exceptions.length === 0 ? '✓ Listo para Cierre' : `Bloqueado (${exceptions.length} exc)`}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Activity Logs Stream */}
          <div className="card-panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">
                <Wifi size={18} color="var(--color-success)" />
                <span>Registro de Eventos en Vivo (WS)</span>
              </div>
              <span className="badge badge-success">Conectado</span>
            </div>

            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '220px', overflowY: 'auto' }}>
              {liveEvents.map((evt, idx) => (
                <div key={idx} style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--color-surface-alt)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'var(--color-text-primary)',
                  borderLeft: '2px solid var(--color-primary)'
                }}>
                  {evt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
