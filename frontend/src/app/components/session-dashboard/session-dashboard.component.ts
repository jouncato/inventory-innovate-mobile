import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { InventorySession, DetectedObject } from '../../../types/inventory';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-session-dashboard',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div>
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Monitoreo de Sesión en Tiempo Real</h1>
          <p>{{ session?.warehouse_name }} • {{ session?.location_zone }}</p>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" (click)="exportReport()">
            <app-icon name="file-spreadsheet" [size]="16"></app-icon>
            <span>Exportar Acta</span>
          </button>
          <button 
            class="btn btn-primary btn-sm"
            (click)="closeSession()"
          >
            <app-icon name="lock" [size]="16"></app-icon>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <!-- Top Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span class="label">Unidades Detectadas</span>
            <div class="value">{{ session?.total_detected_units || 0 }}</div>
            <span class="subtext">En {{ session?.total_captures || 0 }} capturas fotográficas</span>
          </div>
          <div class="stat-icon icon-blue">
            <app-icon name="package" [size]="26"></app-icon>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="label">Resolución Automática</span>
            <div class="value">{{ session?.accuracy_rate || 0 }}%</div>
            <span class="subtext">{{ session?.auto_resolved_count || 0 }} unidades sin intervención</span>
          </div>
          <div class="stat-icon icon-green">
            <app-icon name="check-circle-2" [size]="26"></app-icon>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="label">Excepciones Pendientes</span>
            <div class="value" [style.color]="exceptions.length > 0 ? '#D97706' : '#10B981'">
              {{ exceptions.length }}
            </div>
            <span class="subtext">Requieren validación humana (HITL)</span>
          </div>
          <div class="stat-icon icon-amber">
            <app-icon name="alert-triangle" [size]="26"></app-icon>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="label">Referencias Únicas</span>
            <div class="value">{{ session?.total_unique_products || 0 }}</div>
            <span class="subtext">Productos Solgar identificados</span>
          </div>
          <div class="stat-icon icon-gold">
            <app-icon name="trending-up" [size]="26"></app-icon>
          </div>
        </div>
      </div>

      <!-- Main 2-Column Dashboard Layout -->
      <div class="dashboard-layout">
        <!-- Left Column: Live Visual Captures & Evidence -->
        <div class="card-panel">
          <div class="panel-header">
            <div class="panel-title">
              <app-icon name="camera" [size]="20" color="var(--color-primary)"></app-icon>
              <span>Flujo de Evidencia Fotográfica y Bounding Boxes</span>
            </div>
            <span class="badge badge-primary">
              {{ session?.total_captures || 0 }} Tomas Procesadas
            </span>
          </div>

          <div style="padding: 1.5rem;">
            <div style="background: #0F172A; border-radius: var(--radius-md); padding: 1.25rem; color: #FFFFFF; position: relative; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                  <span class="badge badge-success">Toma Reciente #14</span>
                  <span style="color: #94A3B8;">Estantería B - Nivel 2</span>
                </div>
                <span style="font-size: 0.75rem; color: #94A3B8; font-family: monospace;">
                  SHA-256: a3f8...01aa (MinIO S3)
                </span>
              </div>

              <!-- Simulated Shelf View with Bounding Boxes -->
              <div style="position: relative; height: 280px; background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%); border-radius: var(--radius-sm); border: 1px solid #334155; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <!-- Visual Shelf Line -->
                <div style="position: absolute; bottom: 40px; left: 0; right: 0; height: 8px; background: #86754D; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>

                <!-- Simulated Amber Bottles with BBoxes -->
                <div style="display: flex; gap: 2rem; align-items: flex-end; height: 180px; margin-bottom: 40px;">
                  <!-- Bottle 1 - Auto Matched -->
                  <div style="position: relative; width: 70px; height: 130px; border: 2px solid #10B981; border-radius: 4px; background: rgba(16, 185, 129, 0.15);">
                    <div style="position: absolute; top: -18px; left: -2px; background: #10B981; color: #FFF; font-size: 0.65rem; padding: 1px 4px; border-radius: 2px; font-weight: bold;">
                      SOL-01300 98%
                    </div>
                    <div style="width: 40px; height: 15px; background: #86754D; margin: 6px auto 4px; border-radius: 2px;"></div>
                    <div style="width: 56px; height: 95px; background: #58311F; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 0.55rem; color: #F3E8D0; font-weight: bold;">ESTER-C</span>
                    </div>
                  </div>

                  <!-- Bottle 2 - Auto Matched -->
                  <div style="position: relative; width: 75px; height: 145px; border: 2px solid #10B981; border-radius: 4px; background: rgba(16, 185, 129, 0.15);">
                    <div style="position: absolute; top: -18px; left: -2px; background: #10B981; color: #FFF; font-size: 0.65rem; padding: 1px 4px; border-radius: 2px; font-weight: bold;">
                      SOL-02050 96%
                    </div>
                    <div style="width: 44px; height: 16px; background: #86754D; margin: 6px auto 4px; border-radius: 2px;"></div>
                    <div style="width: 62px; height: 108px; background: #58311F; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 0.55rem; color: #F3E8D0; font-weight: bold;">OMEGA</span>
                    </div>
                  </div>

                  <!-- Bottle 3 - Exception (Amber BBox) -->
                  <div style="position: relative; width: 70px; height: 130px; border: 2px dashed #F59E0B; border-radius: 4px; background: rgba(245, 158, 11, 0.2);">
                    <div style="position: absolute; top: -18px; left: -2px; background: #F59E0B; color: #FFF; font-size: 0.65rem; padding: 1px 4px; border-radius: 2px; font-weight: bold;">
                      REVISIÓN 74%
                    </div>
                    <div style="width: 40px; height: 15px; background: #86754D; margin: 6px auto 4px; border-radius: 2px;"></div>
                    <div style="width: 56px; height: 95px; background: #58311F; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 0.5rem; color: #FCD34D; text-align: center;">¿1000mg ó 500mg?</span>
                    </div>
                  </div>

                  <!-- Bottle 4 - Auto Matched -->
                  <div style="position: relative; width: 70px; height: 130px; border: 2px solid #10B981; border-radius: 4px; background: rgba(16, 185, 129, 0.15);">
                    <div style="position: absolute; top: -18px; left: -2px; background: #10B981; color: #FFF; font-size: 0.65rem; padding: 1px 4px; border-radius: 2px; font-weight: bold;">
                      SOL-03410 99%
                    </div>
                    <div style="width: 40px; height: 15px; background: #86754D; margin: 6px auto 4px; border-radius: 2px;"></div>
                    <div style="width: 56px; height: 95px; background: #58311F; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 0.55rem; color: #F3E8D0; font-weight: bold;">VIT D3</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BBox Legend -->
              <div style="display: flex; gap: 1.5rem; margin-top: 1rem; font-size: 0.75rem; justify-content: center;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <div style="width: 12px; height: 12px; background: #10B981; border-radius: 2px;"></div>
                  <span>Resuelto Automáticamente (Conf &gt; 85%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <div style="width: 12px; height: 12px; background: #F59E0B; border-radius: 2px;"></div>
                  <span>Requiere Conciliación Humana (HITL)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <div style="width: 12px; height: 12px; background: #86754D; border-radius: 2px;"></div>
                  <span>Trazado de Homografía (Multi-toma)</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem;">
              <span style="font-size: 0.85rem; color: var(--color-text-secondary);">
                Se detectaron <strong>3 frascos con alta confianza</strong> y <strong>1 caso ambiguo</strong> en esta toma.
              </span>
              <button class="btn btn-gold btn-sm" (click)="navigateToReconciliation.emit()">
                <span>Revisar Excepciones ({{ exceptions.length }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Session Details & Activity Stream -->
        <div style="display: flex; flexDirection: column; gap: 1.5rem;">
          <!-- Metadata Card -->
          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title">
                <app-icon name="user" [size]="18" color="var(--color-primary)"></app-icon>
                <span>Detalles Operativos</span>
              </div>
              <span class="badge" [class.badge-success]="session?.status === 'OPEN'" [class.badge-primary]="session?.status !== 'OPEN'">
                {{ session?.status }}
              </span>
            </div>

            <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-secondary);">Código Sesión:</span>
                <strong style="font-family: monospace;">{{ session?.session_code }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-secondary);">Operador Asignado:</span>
                <strong>{{ session?.operator_name }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-secondary);">Ubicación:</span>
                <span>{{ session?.location_zone }}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-secondary);">Hora Inicio:</span>
                <span>{{ getFormattedStartTime() }}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-secondary);">Invariante Estado:</span>
                <span [style.color]="exceptions.length === 0 ? 'var(--color-success)' : 'var(--color-warning)'" style="font-weight: 600;">
                  @if (exceptions.length === 0) {
                    ✓ Listo para Cierre
                  } @else {
                    Bloqueado ({{ exceptions.length }} exc)
                  }
                </span>
              </div>
            </div>
          </div>

          <!-- Real-time Activity Logs Stream -->
          <div class="card-panel" style="flex: 1;">
            <div class="panel-header">
              <div class="panel-title">
                <app-icon name="wifi" [size]="18" color="var(--color-success)"></app-icon>
                <span>Registro de Eventos en Vivo (WS)</span>
              </div>
              <span class="badge badge-success">Conectado</span>
            </div>

            <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; max-height: 220px; overflow-y: auto;">
              @for (evt of liveEvents(); track $index) {
                <div style="padding: 0.5rem 0.75rem; background: var(--color-surface-alt); border-radius: var(--radius-sm); font-size: 0.75rem; font-family: monospace; color: var(--color-text-primary); border-left: 2px solid var(--color-primary);">
                  {{ evt }}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SessionDashboardComponent {
  @Input({ required: true }) session!: InventorySession;
  @Input() exceptions: DetectedObject[] = [];

  @Output() navigateToReconciliation = new EventEmitter<void>();
  @Output() navigateToAudit = new EventEmitter<string | undefined>();

  liveEvents = signal<string[]>([
    '08:34:15 - Detección automática exitosa: SOL-01300 (Ester-C 1000mg) vía OCR + Gemma (0.86)',
    '08:34:12 - Celery Worker 01 procesó captura cap-008-p4 en 214ms',
    '08:32:05 - Homografía estimada: 4 frascos enlazados con toma previa (0 doble conteo)',
    '08:30:00 - Operador Carlos Mendoza inició sesión de captura en Pasillo 04'
  ]);

  exportReport() {
    alert('Exportando acta oficial de conteo físico en formato CSV / PDF auditado...');
  }

  closeSession() {
    if (this.exceptions.length > 0) {
      alert(`Invariante de Dominio: No es posible cerrar la sesión ${this.session?.session_code}. Aún existen ${this.exceptions.length} excepciones pendientes de validación humana.`);
    } else {
      alert(`Sesión ${this.session?.session_code} cerrada con éxito y sincronizada con el ERP.`);
    }
  }

  getFormattedStartTime(): string {
    if (!this.session?.started_at) return '';
    try {
      return new Date(this.session.started_at).toLocaleTimeString('es-CO');
    } catch {
      return this.session.started_at;
    }
  }
}
