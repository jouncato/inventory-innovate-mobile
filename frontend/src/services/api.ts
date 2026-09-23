import type { InventorySession, DetectedObject, SolgarProduct, AuditTrailEvent } from '../types/inventory';
import { MOCK_SESSIONS, MOCK_CATALOG, MOCK_DISCREPANCIES, MOCK_AUDIT_TRAIL } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class InventoryApiService {
  static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async getSessions(): Promise<InventorySession[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sessions`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return MOCK_SESSIONS;
  }

  static async getCatalog(): Promise<SolgarProduct[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/catalog`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return MOCK_CATALOG;
  }

  static async getExceptions(sessionId: string): Promise<DetectedObject[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/exceptions`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return MOCK_DISCREPANCIES.filter(d => d.session_id === sessionId);
  }

  static async submitValidation(payload: {
    physical_object_id: string;
    operator_id: string;
    validation_type: 'CONFIRM' | 'CORRECT_SKU' | 'DISCARD';
    corrected_sku?: string;
    notes?: string;
  }): Promise<{ status: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/validations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return { status: 'VALIDATION_RECORDED_LOCAL' };
  }

  static async getAuditTrail(aggregateId?: string): Promise<AuditTrailEvent[]> {
    try {
      const url = aggregateId 
        ? `${API_BASE_URL}/api/v1/audit?aggregate_id=${aggregateId}`
        : `${API_BASE_URL}/api/v1/audit`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return aggregateId ? MOCK_AUDIT_TRAIL.filter(a => a.aggregate_id === aggregateId) : MOCK_AUDIT_TRAIL;
  }

  static createSessionWebSocket(sessionId: string, onMessage: (data: any) => void): WebSocket | null {
    try {
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/sessions/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch {
          onMessage(event.data);
        }
      };
      return ws;
    } catch {
      return null;
    }
  }
}
