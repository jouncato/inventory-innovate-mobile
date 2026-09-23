import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { InventorySession, DetectedObject, SolgarProduct, AuditTrailEvent } from '../types/inventory';
import { InventoryApiService } from './services/inventory-api.service';
import { HeaderComponent } from './components/header/header.component';
import { SessionDashboardComponent } from './components/session-dashboard/session-dashboard.component';
import { DiscrepancyReconciliationComponent } from './components/discrepancy-reconciliation/discrepancy-reconciliation.component';
import { AuditTrailViewerComponent } from './components/audit-trail-viewer/audit-trail-viewer.component';
import { CatalogViewerComponent } from './components/catalog-viewer/catalog-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SessionDashboardComponent,
    DiscrepancyReconciliationComponent,
    AuditTrailViewerComponent,
    CatalogViewerComponent
  ],
  template: `
    <div class="app-container">
      <!-- Toast Notification -->
      @if (toastMessage()) {
        <div style="position: fixed; top: 20px; right: 20px; z-index: 9999; background: var(--color-navy); color: #FFFFFF; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); box-shadow: var(--shadow-xl); font-size: 0.85rem; font-weight: 600; border-left: 4px solid var(--color-success); display: flex; align-items: center; gap: 0.5rem;">
          {{ toastMessage() }}
        </div>
      }

      <!-- Brand Header & Navigation -->
      <app-header
        [activeTab]="activeTab()"
        (tabChange)="activeTab.set($event)"
        [sessions]="sessions()"
        [selectedSessionId]="selectedSessionId()"
        (sessionChange)="onSessionChange($event)"
        [pendingExceptionsCount]="exceptions().length"
      ></app-header>

      <!-- Main Container -->
      <main class="main-content">
        @if (currentSession()) {
          @switch (activeTab()) {
            @case ('dashboard') {
              <app-session-dashboard
                [session]="currentSession()!"
                [exceptions]="exceptions()"
                (navigateToReconciliation)="activeTab.set('reconciliation')"
                (navigateToAudit)="navigateToAudit($event)"
              ></app-session-dashboard>
            }
            @case ('reconciliation') {
              <app-discrepancy-reconciliation
                [exceptions]="exceptions()"
                [catalog]="catalog()"
                (validate)="handleValidate($event)"
                (navigateToAudit)="navigateToAudit($event)"
              ></app-discrepancy-reconciliation>
            }
            @case ('audit') {
              <app-audit-trail-viewer
                [events]="auditEvents()"
                [selectedAggregateId]="selectedAuditAggregateId()"
              ></app-audit-trail-viewer>
            }
            @case ('catalog') {
              <app-catalog-viewer
                [catalog]="catalog()"
              ></app-catalog-viewer>
            }
          }
        } @else {
          <div style="text-align: center; padding: 4rem;">
            <p>Cargando sesión de inventario...</p>
          </div>
        }
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  private apiService = inject(InventoryApiService);

  activeTab = signal<'dashboard' | 'reconciliation' | 'audit' | 'catalog'>('dashboard');
  sessions = signal<InventorySession[]>([]);
  selectedSessionId = signal<string>('ses-col-bgo-001');
  catalog = signal<SolgarProduct[]>([]);
  exceptions = signal<DetectedObject[]>([]);
  auditEvents = signal<AuditTrailEvent[]>([]);
  selectedAuditAggregateId = signal<string | undefined>(undefined);
  toastMessage = signal<string | null>(null);

  currentSession = computed(() => {
    const list = this.sessions();
    const id = this.selectedSessionId();
    return list.find(s => s.id === id) || (list.length > 0 ? list[0] : null);
  });

  async ngOnInit() {
    await this.loadInitialData();
  }

  async loadInitialData() {
    const [loadedSessions, loadedCatalog, loadedExceptions, loadedAudit] = await Promise.all([
      this.apiService.getSessions(),
      this.apiService.getCatalog(),
      this.apiService.getExceptions(this.selectedSessionId()),
      this.apiService.getAuditTrail()
    ]);

    this.sessions.set(loadedSessions);
    this.catalog.set(loadedCatalog);
    this.exceptions.set(loadedExceptions);
    this.auditEvents.set(loadedAudit);
  }

  async onSessionChange(sessionId: string) {
    this.selectedSessionId.set(sessionId);
    const loadedExceptions = await this.apiService.getExceptions(sessionId);
    this.exceptions.set(loadedExceptions);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  async handleValidate(event: {
    exceptionId: string;
    validationType: 'CONFIRM' | 'CORRECT_SKU' | 'DISCARD';
    correctedSku?: string;
    notes?: string;
  }) {
    const payload = {
      physical_object_id: event.exceptionId,
      operator_id: 'op-supervisor-web',
      validation_type: event.validationType,
      corrected_sku: event.correctedSku,
      notes: event.notes
    };

    await this.apiService.submitValidation(payload);

    // Actualizar excepciones locales
    this.exceptions.update(prev => prev.filter(e => e.id !== event.exceptionId));

    // Agregar evento a la cadena de auditoría forense
    const newAuditEvent: AuditTrailEvent = {
      event_id: `ev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event_type: 'HUMAN_VALIDATION',
      aggregate_id: event.exceptionId,
      operator_or_system: 'Supervisor Web (Carlos Mendoza)',
      details: {
        action: event.validationType,
        assigned_sku: event.correctedSku || 'DISCARDED',
        supervisor_notes: event.notes || 'Validación rápida',
        channel: 'WEB_ADMIN_DASHBOARD'
      }
    };
    this.auditEvents.update(prev => [newAuditEvent, ...prev]);

    // Actualizar contadores de la sesión
    const activeId = this.selectedSessionId();
    this.sessions.update(prev => prev.map(s => {
      if (s.id === activeId) {
        return {
          ...s,
          pending_exceptions_count: Math.max(0, s.pending_exceptions_count - 1),
          auto_resolved_count: s.auto_resolved_count + (event.validationType !== 'DISCARD' ? 1 : 0)
        };
      }
      return s;
    }));

    this.showToast('✓ Decisión registrada con éxito en la cadena de auditoría inmutable.');
  }

  navigateToAudit(aggregateId?: string) {
    this.selectedAuditAggregateId.set(aggregateId);
    this.activeTab.set('audit');
  }
}
