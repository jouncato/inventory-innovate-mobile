import React, { useState } from 'react';
import type { DetectedObject, SolgarProduct } from '../types/inventory';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  BrainCircuit, 
  Cpu, 
  Barcode, 
  FileText, 
  Eye, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface DiscrepancyReconciliationProps {
  exceptions: DetectedObject[];
  catalog: SolgarProduct[];
  onValidate: (
    exceptionId: string,
    validationType: 'CONFIRM' | 'CORRECT_SKU' | 'DISCARD',
    correctedSku?: string,
    notes?: string
  ) => void;
  onNavigateToAudit: (aggregateId?: string) => void;
}

export const DiscrepancyReconciliation: React.FC<DiscrepancyReconciliationProps> = ({
  exceptions,
  catalog,
  onValidate,
  onNavigateToAudit,
}) => {
  const [selectedExceptionId, setSelectedExceptionId] = useState<string>(
    exceptions.length > 0 ? exceptions[0].id : ''
  );
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');
  const [selectedCatalogSku, setSelectedCatalogSku] = useState<string>('');
  const [showCatalogSearch, setShowCatalogSearch] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentException = exceptions.find(e => e.id === selectedExceptionId) || exceptions[0];

  // Resolve matching product info
  const matchedSku = selectedCatalogSku || currentException?.matched_product?.sku;
  const catalogProduct = catalog.find(p => p.sku === matchedSku);

  if (!currentException || exceptions.length === 0) {
    return (
      <div className="card-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <CheckCircle size={54} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: 'var(--color-navy)', marginBottom: '0.5rem' }}>¡Sin Discrepancias Pendientes!</h2>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          Todas las detecciones de la sesión actual han sido resueltas automáticamente por los modelos de IA o validadas por supervisión humana.
        </p>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!supervisorNotes.trim()) {
      alert('Por favor ingrese una breve justificación u observación para el registro inmutable de auditoría.');
      return;
    }
    onValidate(currentException.id, 'CONFIRM', currentException.matched_product?.sku, supervisorNotes);
    setSupervisorNotes('');
  };

  const handleReassign = () => {
    if (!selectedCatalogSku) {
      alert('Por favor seleccione una referencia del catálogo Solgar.');
      return;
    }
    if (!supervisorNotes.trim()) {
      alert('Por favor ingrese la justificación del cambio de SKU para el log forense.');
      return;
    }
    onValidate(currentException.id, 'CORRECT_SKU', selectedCatalogSku, supervisorNotes);
    setSupervisorNotes('');
    setShowCatalogSearch(false);
  };

  const handleDiscard = () => {
    if (!supervisorNotes.trim()) {
      alert('Por favor ingrese la razón para descartar esta detección (ej. reflejo, objeto no inventariable).');
      return;
    }
    onValidate(currentException.id, 'DISCARD', undefined, supervisorNotes);
    setSupervisorNotes('');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Conciliación de Discrepancias y Excepciones</h1>
          <p>
            Resolución supervisada asistida por IA (Human-in-the-Loop) • {exceptions.length} casos pendientes de decisión
          </p>
        </div>

        {/* Exceptions Selector Pill Bar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {exceptions.map((exc, index) => (
            <button
              key={exc.id}
              className={`btn btn-sm ${exc.id === currentException.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setSelectedExceptionId(exc.id);
                setSelectedCatalogSku('');
              }}
            >
              <span>Caso #{index + 1} ({exc.matched_product?.sku || 'Ambiguo'})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Split Comparison Grid */}
      <div className="reconciliation-grid">
        {/* Left Column: Photographic Evidence & AI Signals */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Eye size={18} color="var(--color-primary)" />
              <span>Evidencia Física Detectada</span>
            </div>
            <span className="badge badge-warning">
              Confianza: {Math.round((currentException.matched_product?.confidence || 0) * 100)}%
            </span>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Bottle Crop Image / Visual Representation */}
            <div className="bottle-crop-preview">
              <div 
                dangerouslySetInnerHTML={{ __html: currentException.crop_url.replace('data:image/svg+xml;utf8,', '') }} 
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}
              />
            </div>

            {/* AI Multi-Signal Synthesis */}
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BrainCircuit size={16} color="var(--color-gold)" />
                <span>Señales Extraídas por el Pipeline Multimodal:</span>
              </h4>

              <div className="signals-breakdown">
                {/* Barcode Signal */}
                <div className="signal-row signal-warning">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Barcode size={16} />
                    <strong>Código de Barras (EAN-13 / UPC):</strong>
                  </div>
                  <span>{currentException.barcode_detected || 'No visible (Orientación frontal)'}</span>
                </div>

                {/* OCR Signal */}
                <div className="signal-row signal-success">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} />
                    <strong>Texto OCR (PaddleOCR v4):</strong>
                  </div>
                  <span style={{ fontFamily: 'monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{currentException.ocr_extracted_text}"
                  </span>
                </div>

                {/* Vector Similarity */}
                <div className="signal-row signal-gold">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={16} />
                    <strong>Similitud Vectorial (embeddinggemma 768d):</strong>
                  </div>
                  <span>Distancia Coseno: {currentException.vector_distance || '0.142'} (Alta similitud)</span>
                </div>

                {/* VLM Arbiter Verdict */}
                {currentException.vlm_verdict && (
                  <div style={{
                    padding: '0.85rem',
                    background: 'var(--color-gold-light)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #E5DCC5',
                    fontSize: '0.8rem',
                    color: 'var(--color-earth)',
                    lineHeight: 1.4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                      <Sparkles size={14} color="var(--color-gold)" />
                      <span>Dictamen Árbitro VLM (Qwen3-VL / Gemma 4):</span>
                    </div>
                    {currentException.vlm_verdict}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToAudit(currentException.id)}
                >
                  <span>Ver Linaje Criptográfico Completo</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Catalog Candidate & Resolution Form */}
        <div className="card-panel">
          <div className="panel-header">
            <div className="panel-title">
              <ShieldAlert size={18} color="var(--color-gold)" />
              <span>Candidato Propuesto del Catálogo Solgar</span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCatalogSearch(!showCatalogSearch)}
            >
              <Search size={14} />
              <span>{showCatalogSearch ? 'Ocultar Buscador' : 'Cambiar Referencia'}</span>
            </button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Catalog Search Dropdown (if toggled) */}
            {showCatalogSearch && (
              <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <label className="form-label">Buscar Referencia Oficial Solgar:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Buscar por SKU, nombre o ingrediente..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ marginBottom: '0.75rem' }}
                />

                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {catalog
                    .filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.sku.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map(p => (
                      <div 
                        key={p.sku}
                        onClick={() => {
                          setSelectedCatalogSku(p.sku);
                          setShowCatalogSearch(false);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: p.sku === matchedSku ? 'var(--color-primary-subtle)' : '#FFFFFF',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem'
                        }}
                      >
                        <strong>{p.sku} - {p.name}</strong>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{p.presentation}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Catalog Master Card */}
            {catalogProduct ? (
              <div style={{
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="badge badge-gold" style={{ marginBottom: '0.4rem' }}>
                      SKU Oficial: {catalogProduct.sku}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', fontWeight: 800 }}>
                      {catalogProduct.name}
                    </h3>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#FFF', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                    UPC: {catalogProduct.barcode}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.825rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Presentación:</span>
                    <strong>{catalogProduct.presentation}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Categoría:</span>
                    <strong>{catalogProduct.category}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Principios Activos:</span>
                    <span>{catalogProduct.active_ingredients}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', color: 'var(--color-danger)' }}>
                No se encontró producto correspondiente en catálogo.
              </div>
            )}

            {/* Decision & Action Area */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Justificación de Supervisión (Obligatorio para Auditoría):</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Inmutable en Postgres 18</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Ej: Confirmada presentación de 1000 mg 90 comprimidos según tipografía frontal y altura del frasco ámbar..."
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-success" 
                  style={{ flex: 1 }}
                  onClick={handleConfirm}
                >
                  <CheckCircle size={16} />
                  <span>Aprobar Sugerencia</span>
                </button>

                {selectedCatalogSku && (
                  <button 
                    className="btn btn-gold" 
                    style={{ flex: 1 }}
                    onClick={handleReassign}
                  >
                    <CheckCircle size={16} />
                    <span>Asignar {selectedCatalogSku}</span>
                  </button>
                )}

                <button 
                  className="btn btn-danger"
                  onClick={handleDiscard}
                >
                  <XCircle size={16} />
                  <span>Descartar Falso Positivo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
