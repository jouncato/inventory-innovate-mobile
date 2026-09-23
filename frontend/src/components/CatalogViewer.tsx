import React, { useState } from 'react';
import type { SolgarProduct } from '../types/inventory';
import { Search, Barcode } from 'lucide-react';

interface CatalogViewerProps {
  catalog: SolgarProduct[];
}

export const CatalogViewer: React.FC<CatalogViewerProps> = ({ catalog }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = catalog.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Catálogo Maestro Solgar Colombia</h1>
          <p>
            Referencias oficiales con códigos de barras UPC/EAN-13 y balance físico vs teórico
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por SKU, nombre, UPC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.8rem', width: '280px' }}
          />
        </div>
      </div>

      <div className="card-panel">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU / Producto</th>
              <th>Código de Barras</th>
              <th>Presentación / Categoría</th>
              <th style={{ textAlign: 'center' }}>Stock Teórico</th>
              <th style={{ textAlign: 'center' }}>Conteo IA</th>
              <th style={{ textAlign: 'center' }}>Discrepancia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(prod => (
              <tr key={prod.sku}>
                <td>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-navy)' }}>
                    {prod.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                    SKU: {prod.sku}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <Barcode size={16} color="var(--color-text-secondary)" />
                    <span>{prod.barcode}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>{prod.presentation}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{prod.category}</div>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {prod.theoretical_stock}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {prod.counted_stock}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`badge ${
                    prod.discrepancy === 0 ? 'badge-success' : 
                    prod.discrepancy < 0 ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {prod.discrepancy > 0 ? `+${prod.discrepancy}` : prod.discrepancy}
                  </span>
                </td>
                <td>
                  {prod.discrepancy === 0 ? (
                    <span className="badge badge-success">Conciliado</span>
                  ) : (
                    <span className="badge badge-warning">Ajuste Requerido</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
