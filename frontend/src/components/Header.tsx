import React from 'react';
import type { InventorySession } from '../types/inventory';
import { Activity, ShieldCheck, Box, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'reconciliation' | 'audit' | 'catalog';
  setActiveTab: (tab: 'dashboard' | 'reconciliation' | 'audit' | 'catalog') => void;
  sessions: InventorySession[];
  selectedSessionId: string;
  onSelectSession: (id: string) => void;
  pendingExceptionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sessions,
  selectedSessionId,
  onSelectSession,
  pendingExceptionsCount,
}) => {
  return (
    <header className="navbar">
      <div className="brand-section">
        <img 
          src="/logo-innovate.png" 
          alt="Innovate Nutrition" 
          className="brand-logo"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="brand-divider"></div>
        <div className="brand-badge">
          <span className="title">Control & Auditoría de Inventario</span>
          <span className="subtitle">Línea Solgar Colombia • IA Visual</span>
        </div>
      </div>

      <nav className="nav-links">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Activity size={18} />
          <span>Panel de Sesiones</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'reconciliation' ? 'active' : ''}`}
          onClick={() => setActiveTab('reconciliation')}
        >
          <RefreshCw size={18} />
          <span>Conciliación</span>
          {pendingExceptionsCount > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              {pendingExceptionsCount}
            </span>
          )}
        </button>

        <button 
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <ShieldCheck size={18} />
          <span>Trazabilidad Forense</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Box size={18} />
          <span>Catálogo Solgar</span>
        </button>
      </nav>

      <div className="navbar-right">
        <div className="form-group" style={{ margin: 0 }}>
          <select 
            className="form-select" 
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', fontWeight: 600 }}
            value={selectedSessionId}
            onChange={(e) => onSelectSession(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.session_code} - {s.warehouse_name.split('-')[0]}
              </option>
            ))}
          </select>
        </div>

        <div className="system-status status-live">
          <div className="pulse-dot"></div>
          <span>IA PIPELINE EN VIVO</span>
        </div>
      </div>
    </header>
  );
};
