import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { AuditTrailEvent } from '../../../types/inventory';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-audit-trail-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div>
      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Trazabilidad Forense e Inmutabilidad</h1>
          <p>
            Linaje verificable desde el sensor fotográfico hasta la conciliación contable • PostgreSQL 18 & MinIO S3
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="position: relative;">
            <app-icon name="search" [size]="16" style="position: absolute; left: 10px; top: 10px; color: var(--color-text-muted);"></app-icon>
            <input 
              type="text" 
              class="form-input" 
              placeholder="Filtrar por ID (ej. obj-exc-001)..."
              [ngModel]="filterAggregateId()"
              (ngModelChange)="filterAggregateId.set($event)"
              style="padding-left: 32px; font-size: 0.8rem; width: 260px;"
            />
          </div>
          @if (filterAggregateId()) {
            <button class="btn btn-secondary btn-sm" (click)="filterAggregateId.set('')">
              Limpiar
            </button>
          }
        </div>
      </div>

      <!-- Forensic Guarantee Banner -->
      <div style="background: linear-gradient(90deg, #1B2559 0%, #33499C 100%); color: #FFFFFF; border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-md);">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <app-icon name="shield-check" [size]="36" color="var(--color-gold-accent)"></app-icon>
          <div>
            <h3 style="font-size: 1rem; font-weight: 800; letter-spacing: -0.01em;">
              Garantía Criptográfica de Evidencia
            </h3>
            <p style="font-size: 0.8rem; opacity: 0.9; margin-top: 0.15rem;">
              Cada recorte de botella posee un hash SHA-256 inalterable y registros auditables no modificables en la base de datos particionada.
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; text-align: right;">
          <div>
            <div style="font-size: 0.7rem; color: #94A3B8;">ESTADO CADENA DE CUSTODIA</div>
            <div style="font-size: 0.9rem; font-weight: bold; color: #10B981;">100% ÍNTEGRA</div>
          </div>
        </div>
      </div>

      <!-- Audit Trail Timeline -->
      <div class="card-panel" style="padding: 1.5rem;">
        <div class="timeline">
          @for (evt of filteredEvents(); track evt.event_id) {
            <div class="timeline-item">
              <div 
                class="timeline-dot"
                [class.audit-human]="evt.event_type === 'HUMAN_VALIDATION'"
                [class.audit-vlm]="evt.event_type.includes('VLM')"
                [class.audit-yolo]="evt.event_type !== 'HUMAN_VALIDATION' && !evt.event_type.includes('VLM')"
              ></div>

              <div class="timeline-content">
                <div class="timeline-header">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <!-- Badge -->
                    @switch (evt.event_type) {
                      @case ('CAPTURE_UPLOADED') {
                        <span class="badge badge-primary"><app-icon name="camera" [size]="12"></app-icon> CAPTURA RAW</span>
                      }
                      @case ('YOLO_INFERENCE') {
                        <span class="badge badge-gold"><app-icon name="layers" [size]="12"></app-icon> YOLO V8x</span>
                      }
                      @case ('OCR_EMBEDDING') {
                        <span class="badge badge-gold"><app-icon name="cpu" [size]="12"></app-icon> OCR + GEMMA 768D</span>
                      }
                      @case ('VLM_ARBITRATION') {
                        <span class="badge badge-warning"><app-icon name="cpu" [size]="12"></app-icon> ÁRBITRO QWEN3-VL</span>
                      }
                      @case ('HOMOGRAPHY_DEDUP') {
                        <span class="badge badge-primary"><app-icon name="layers" [size]="12"></app-icon> HOMOGRAFÍA RANSAC</span>
                      }
                      @case ('HUMAN_VALIDATION') {
                        <span class="badge badge-success"><app-icon name="user-check" [size]="12"></app-icon> SUPERVISIÓN HUMANA</span>
                      }
                      @default {
                        <span class="badge badge-primary">{{ evt.event_type }}</span>
                      }
                    }

                    <span class="timeline-title">
                      {{ evt.operator_or_system }}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--color-text-muted); font-family: monospace;">
                      Ref: {{ evt.aggregate_id }}
                    </span>
                  </div>

                  <span class="timeline-time">
                    {{ getFormattedTime(evt.timestamp) }}
                  </span>
                </div>

                <!-- Evidence Details -->
                @if (evt.evidence_sha256) {
                  <div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: #0F172A; border-radius: var(--radius-sm); font-size: 0.75rem; color: #94A3B8; font-family: monospace; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <span style="color: #E2E8F0; font-weight: bold;">SHA-256: </span>
                      {{ evt.evidence_sha256 }}
                    </div>
                    @if (evt.evidence_s3_uri) {
                      <span style="color: var(--color-gold-accent);">
                        {{ evt.evidence_s3_uri }}
                      </span>
                    }
                  </div>
                }

                <!-- Event Key-Values -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-top: 0.75rem; font-size: 0.8rem;">
                  @for (entry of getDetailEntries(evt.details); track entry[0]) {
                    <div style="background: #FFFFFF; padding: 0.4rem 0.6rem; border-radius: 4px; border: 1px solid var(--color-border);">
                      <span style="color: var(--color-text-secondary); text-transform: capitalize;">
                        {{ formatKey(entry[0]) }}:
                      </span>{' '}
                      <strong>{{ formatVal(entry[1]) }}</strong>
                    </div>
                  }
                </div>

                <!-- JSON toggle button -->
                <div style="margin-top: 0.65rem; text-align: right;">
                  <button 
                    class="btn btn-secondary btn-sm"
                    style="font-size: 0.7rem; padding: 0.2rem 0.5rem;"
                    (click)="toggleJson(evt.event_id)"
                  >
                    <app-icon name="file-code" [size]="12"></app-icon>
                    <span>{{ showJsonRaw()[evt.event_id] ? 'Ocultar JSON' : 'Ver Payload Raw' }}</span>
                  </button>
                </div>

                @if (showJsonRaw()[evt.event_id]) {
                  <pre style="margin-top: 0.5rem; padding: 0.75rem; background: #0F172A; color: #38BDF8; border-radius: var(--radius-sm); font-size: 0.7rem; overflow-x: auto;">
{{ formatJson(evt) }}
                  </pre>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AuditTrailViewerComponent implements OnInit {
  @Input() events: AuditTrailEvent[] = [];
  @Input() selectedAggregateId?: string;

  filterAggregateId = signal<string>('');
  showJsonRaw = signal<Record<string, boolean>>({});

  ngOnInit() {
    if (this.selectedAggregateId) {
      this.filterAggregateId.set(this.selectedAggregateId);
    }
  }

  filteredEvents = computed(() => {
    const filter = this.filterAggregateId().toLowerCase();
    if (!filter) return this.events;
    return this.events.filter(e => e.aggregate_id.toLowerCase().includes(filter));
  });

  toggleJson(id: string) {
    this.showJsonRaw.update(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  getDetailEntries(details: Record<string, any>): [string, any][] {
    return details ? Object.entries(details) : [];
  }

  formatKey(key: string): string {
    return key.replace(/_/g, ' ');
  }

  formatVal(val: any): string {
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  }

  formatJson(evt: any): string {
    return JSON.stringify(evt, null, 2);
  }

  getFormattedTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleString('es-CO');
    } catch {
      return timestamp;
    }
  }
}
