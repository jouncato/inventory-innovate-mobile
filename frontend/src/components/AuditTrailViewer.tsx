import React, { useState } from 'react';
import type { AuditTrailEvent } from '../types/inventory';
import { 
  ShieldCheck, 
  FileCode, 
  Cpu, 
  Layers, 
  Camera, 
  UserCheck,
  Search
} from 'lucide-react';

interface AuditTrailViewerProps {
  events: AuditTrailEvent[];
  selectedAggregateId?: string;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  events,
  selectedAggregateId: initialAggregateId,
}) => {
  const [filterAggregateId, setFilterAggregateId] = useState<string>(initialAggregateId || '');
  const [showJsonRaw, setShowJsonRaw] = useState<Record<string, boolean>>({});

  const filteredEvents = filterAggregateId
    ? events.filter(e => e.aggregate_id.toLowerCase().includes(filterAggregateId.toLowerCase()))
    : events;

  const toggleJson = (id: string) => {
    setShowJsonRaw(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEventBadge = (type: AuditTrailEvent['event_type']) => {
    switch (type) {
      case 'CAPTURE_UPLOADED':
        return <span className="badge badge-primary"><Camera size={12} /> CAPTURA RAW</span>;
      case 'YOLO_INFERENCE':
        return <span className="badge badge-gold"><Layers size={12} /> YOLO V8x</span>;
      case 'OCR_EMBEDDING':
        return <span className="badge badge-gold"><Cpu size={12} /> OCR + GEMMA 768D</span>;
      case 'VLM_ARBITRATION':
        return <span className="badge badge-warning"><Cpu size={12} /> ÁRBITRO QWEN3-VL</span>;
      case 'HOMOGRAPHY_DEDUP':
        return <span className="badge badge-primary"><Layers size={12} /> HOMOGRAFÍA RANSAC</span>;
      case 'HUMAN_VALIDATION':
        return <span className="badge badge-success"><UserCheck size={12} /> SUPERVISIÓN HUMANA</span>;
      default:
        return <span className="badge badge-primary">{type}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Trazabilidad Forense e Inmutabilidad</h1>
          <p>
            Linaje verificable desde el sensor fotográfico hasta la conciliación contable • PostgreSQL 18 & MinIO S3
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Filtrar por ID (ej. obj-exc-001)..."
              value={filterAggregateId}
              onChange={(e) => setFilterAggregateId(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.8rem', width: '260px' }}
            />
          </div>
          {filterAggregateId && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilterAggregateId('')}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Forensic Guarantee Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #1B2559 0%, #33499C 100%)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={36} color="var(--color-gold-accent)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Garantía Criptográfica de Evidencia
            </h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.15rem' }}>
              Cada recorte de botella posee un hash SHA-256 inalterable y registros auditables no modificables en la base de datos particionada.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ESTADO CADENA DE CUSTODIA</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#10B981' }}>100% ÍNTEGRA</div>
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <div className="card-panel" style={{ padding: '1.5rem' }}>
        <div className="timeline">
          {filteredEvents.map(evt => (
            <div key={evt.event_id} className="timeline-item">
              <div className={`timeline-dot ${
                evt.event_type === 'HUMAN_VALIDATION' ? 'audit-human' : 
                evt.event_type.includes('VLM') ? 'audit-vlm' : 'audit-yolo'
              }`} />

              <div className="timeline-content">
                <div className="timeline-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getEventBadge(evt.event_type)}
                    <span className="timeline-title">
                      {evt.operator_or_system}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      Ref: {evt.aggregate_id}
                    </span>
                  </div>

                  <span className="timeline-time">
                    {new Date(evt.timestamp).toLocaleString('es-CO')}
                  </span>
                </div>

                {/* Evidence Details */}
                {evt.evidence_sha256 && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: '#0F172A',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <span style={{ color: '#E2E8F0', fontWeight: 'bold' }}>SHA-256: </span>
                      {evt.evidence_sha256}
                    </div>
                    {evt.evidence_s3_uri && (
                      <span style={{ color: 'var(--color-gold-accent)' }}>
                        {evt.evidence_s3_uri}
                      </span>
                    )}
                  </div>
                )}

                {/* Event Key-Values */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  fontSize: '0.8rem'
                }}>
                  {Object.entries(evt.details).map(([key, val]) => (
                    <div key={key} style={{ background: '#FFFFFF', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}:
                      </span>{' '}
                      <strong>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</strong>
                    </div>
                  ))}
                </div>

                {/* JSON toggle button */}
                <div style={{ marginTop: '0.65rem', textAlign: 'right' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => toggleJson(evt.event_id)}
                  >
                    <FileCode size={12} />
                    <span>{showJsonRaw[evt.event_id] ? 'Ocultar JSON' : 'Ver Payload Raw'}</span>
                  </button>
                </div>

                {showJsonRaw[evt.event_id] && (
                  <pre style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: '#0F172A',
                    color: '#38BDF8',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(evt, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
