import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import type { DetectedObject, SolgarProduct } from '../../../types/inventory';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-discrepancy-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div>
      @if (!currentException() || exceptions.length === 0) {
        <div class="card-panel" style="padding: 3rem; text-align: center;">
          <app-icon name="check-circle" [size]="54" color="var(--color-success)" extraClass="margin-auto"></app-icon>
          <h2 style="color: var(--color-navy); margin-bottom: 0.5rem; margin-top: 1rem;">¡Sin Discrepancias Pendientes!</h2>
          <p style="color: var(--color-text-secondary); max-width: 500px; margin: 0 auto;">
            Todas las detecciones de la sesión actual han sido resueltas automáticamente por los modelos de IA o validadas por supervisión humana.
          </p>
        </div>
      } @else {
        <!-- Header -->
        <div class="page-header">
          <div class="page-title">
            <h1>Conciliación de Discrepancias y Excepciones</h1>
            <p>
              Resolución supervisada asistida por IA (Human-in-the-Loop) • {{ exceptions.length }} casos pendientes de decisión
            </p>
          </div>

          <!-- Exceptions Selector Pill Bar -->
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            @for (exc of exceptions; track exc.id; let index = $index) {
              <button
                class="btn btn-sm"
                [class.btn-primary]="exc.id === currentException()?.id"
                [class.btn-secondary]="exc.id !== currentException()?.id"
                (click)="selectException(exc.id)"
              >
                <span>Caso #{{ index + 1 }} ({{ exc.matched_product?.sku || 'Ambiguo' }})</span>
              </button>
            }
          </div>
        </div>

        <!-- Split Comparison Grid -->
        <div class="reconciliation-grid">
          <!-- Left Column: Photographic Evidence & AI Signals -->
          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title">
                <app-icon name="eye" [size]="18" color="var(--color-primary)"></app-icon>
                <span>Evidencia Física Detectada</span>
              </div>
              <span class="badge badge-warning">
                Confianza: {{ getConfidencePercent() }}%
              </span>
            </div>

            <div style="padding: 1.5rem;">
              <!-- Bottle Crop Image / Visual Representation -->
              <div class="bottle-crop-preview">
                <div 
                  [innerHTML]="sanitizedCropSvg()" 
                  style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4));"
                ></div>
              </div>

              <!-- AI Multi-Signal Synthesis -->
              <div style="margin-top: 1.25rem;">
                <h4 style="font-size: 0.85rem; color: var(--color-navy); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                  <app-icon name="brain-circuit" [size]="16" color="var(--color-gold)"></app-icon>
                  <span>Señales Extraídas por el Pipeline Multimodal:</span>
                </h4>

                <div class="signals-breakdown">
                  <!-- Barcode Signal -->
                  <div class="signal-row signal-warning">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <app-icon name="barcode" [size]="16"></app-icon>
                      <strong>Código de Barras (EAN-13 / UPC):</strong>
                    </div>
                    <span>{{ currentException()?.barcode_detected || 'No visible (Orientación frontal)' }}</span>
                  </div>

                  <!-- OCR Signal -->
                  <div class="signal-row signal-success">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <app-icon name="file-text" [size]="16"></app-icon>
                      <strong>Texto OCR (PaddleOCR v4):</strong>
                    </div>
                    <span style="font-family: monospace; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      "{{ currentException()?.ocr_extracted_text }}"
                    </span>
                  </div>

                  <!-- Vector Similarity -->
                  <div class="signal-row signal-gold">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <app-icon name="cpu" [size]="16"></app-icon>
                      <strong>Similitud Vectorial (embeddinggemma 768d):</strong>
                    </div>
                    <span>Distancia Coseno: {{ currentException()?.vector_distance || '0.142' }} (Alta similitud)</span>
                  </div>

                  <!-- VLM Arbiter Verdict -->
                  @if (currentException()?.vlm_verdict) {
                    <div style="padding: 0.85rem; background: var(--color-gold-light); border-radius: var(--radius-sm); border: 1px solid #E5DCC5; font-size: 0.8rem; color: var(--color-earth); line-height: 1.4;">
                      <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: bold; margin-bottom: 0.2rem;">
                        <app-icon name="sparkles" [size]="14" color="var(--color-gold)"></app-icon>
                        <span>Dictamen Árbitro VLM (Qwen3-VL / Gemma 4):</span>
                      </div>
                      {{ currentException()?.vlm_verdict }}
                    </div>
                  }
                </div>

                <div style="margin-top: 0.75rem; text-align: right;">
                  <button 
                    class="btn btn-secondary btn-sm"
                    (click)="navigateToAudit.emit(currentException()?.id)"
                  >
                    <span>Ver Linaje Criptográfico Completo</span>
                    <app-icon name="arrow-right" [size]="14"></app-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Catalog Candidate & Resolution Form -->
          <div class="card-panel">
            <div class="panel-header">
              <div class="panel-title">
                <app-icon name="shield-alert" [size]="18" color="var(--color-gold)"></app-icon>
                <span>Candidato Propuesto del Catálogo Solgar</span>
              </div>
              <button 
                class="btn btn-secondary btn-sm"
                (click)="toggleCatalogSearch()"
              >
                <app-icon name="search" [size]="14"></app-icon>
                <span>{{ showCatalogSearch() ? 'Ocultar Buscador' : 'Cambiar Referencia' }}</span>
              </button>
            </div>

            <div style="padding: 1.5rem;">
              <!-- Catalog Search Dropdown (if toggled) -->
              @if (showCatalogSearch()) {
                <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--color-surface-alt); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                  <label class="form-label">Buscar Referencia Oficial Solgar:</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    placeholder="Buscar por SKU, nombre o ingrediente..."
                    [ngModel]="searchFilter()"
                    (ngModelChange)="searchFilter.set($event)"
                    style="margin-bottom: 0.75rem;"
                  />

                  <div style="max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.4rem;">
                    @for (p of filteredCatalog(); track p.sku) {
                      <div 
                        (click)="selectCandidateSku(p.sku)"
                        [style.background]="p.sku === matchedSku() ? 'var(--color-primary-subtle)' : '#FFFFFF'"
                        style="padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border); cursor: pointer; display: flex; justify-content: space-between; font-size: 0.8rem;"
                      >
                        <strong>{{ p.sku }} - {{ p.name }}</strong>
                        <span style="color: var(--color-text-secondary);">{{ p.presentation }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Catalog Master Card -->
              @if (catalogProduct()) {
                <div style="background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div>
                      <span class="badge badge-gold" style="margin-bottom: 0.4rem;">
                        SKU Oficial: {{ catalogProduct()?.sku }}
                      </span>
                      <h3 style="font-size: 1.15rem; color: var(--color-navy); font-weight: 800;">
                        {{ catalogProduct()?.name }}
                      </h3>
                    </div>
                    <span style="font-family: monospace; font-size: 0.8rem; background: #FFF; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid var(--color-border);">
                      UPC: {{ catalogProduct()?.barcode }}
                    </span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.825rem;">
                    <div>
                      <span style="color: var(--color-text-secondary); display: block;">Presentación:</span>
                      <strong>{{ catalogProduct()?.presentation }}</strong>
                    </div>
                    <div>
                      <span style="color: var(--color-text-secondary); display: block;">Categoría:</span>
                      <strong>{{ catalogProduct()?.category }}</strong>
                    </div>
                    <div style="grid-column: span 2;">
                      <span style="color: var(--color-text-secondary); display: block;">Principios Activos:</span>
                      <span>{{ catalogProduct()?.active_ingredients }}</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div style="padding: 1rem; color: var(--color-danger);">
                  No se encontró producto correspondiente en catálogo.
                </div>
              }

              <!-- Decision & Action Area -->
              <div style="margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1.25rem;">
                <div class="form-group">
                  <label class="form-label" style="display: flex; justify-content: space-between;">
                    <span>Justificación de Supervisión (Obligatorio para Auditoría):</span>
                    <span style="font-size: 0.7rem; color: var(--color-text-muted);">Inmutable en Postgres 18</span>
                  </label>
                  <textarea
                    class="form-textarea"
                    rows="3"
                    placeholder="Ej: Confirmada presentación de 1000 mg 90 comprimidos según tipografía frontal y altura del frasco ámbar..."
                    [ngModel]="supervisorNotes()"
                    (ngModelChange)="supervisorNotes.set($event)"
                  ></textarea>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                  <button 
                    class="btn btn-success" 
                    style="flex: 1;"
                    (click)="handleConfirm()"
                  >
                    <app-icon name="check-circle" [size]="16"></app-icon>
                    <span>Aprobar Sugerencia</span>
                  </button>

                  @if (selectedCatalogSku()) {
                    <button 
                      class="btn btn-gold" 
                      style="flex: 1;"
                      (click)="handleReassign()"
                    >
                      <app-icon name="check-circle" [size]="16"></app-icon>
                      <span>Asignar {{ selectedCatalogSku() }}</span>
                    </button>
                  }

                  <button 
                    class="btn btn-danger"
                    (click)="handleDiscard()"
                  >
                    <app-icon name="x-circle" [size]="16"></app-icon>
                    <span>Descartar Falso Positivo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DiscrepancyReconciliationComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() exceptions: DetectedObject[] = [];
  @Input() catalog: SolgarProduct[] = [];

  @Output() validate = new EventEmitter<{
    exceptionId: string;
    validationType: 'CONFIRM' | 'CORRECT_SKU' | 'DISCARD';
    correctedSku?: string;
    notes?: string;
  }>();
  @Output() navigateToAudit = new EventEmitter<string | undefined>();

  selectedExceptionId = signal<string>('');
  supervisorNotes = signal<string>('');
  selectedCatalogSku = signal<string>('');
  showCatalogSearch = signal<boolean>(false);
  searchFilter = signal<string>('');

  currentException = computed(() => {
    if (this.exceptions.length === 0) return null;
    const selected = this.selectedExceptionId();
    if (selected) {
      const found = this.exceptions.find(e => e.id === selected);
      if (found) return found;
    }
    return this.exceptions[0];
  });

  matchedSku = computed(() => {
    const custom = this.selectedCatalogSku();
    if (custom) return custom;
    return this.currentException()?.matched_product?.sku || '';
  });

  catalogProduct = computed(() => {
    const sku = this.matchedSku();
    if (!sku) return null;
    return this.catalog.find(p => p.sku === sku) || null;
  });

  filteredCatalog = computed(() => {
    const query = this.searchFilter().toLowerCase();
    if (!query) return this.catalog;
    return this.catalog.filter(p => 
      p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
    );
  });

  sanitizedCropSvg = computed<SafeHtml>(() => {
    const current = this.currentException();
    if (!current?.crop_url) return '';
    const rawSvg = current.crop_url.replace('data:image/svg+xml;utf8,', '');
    return this.sanitizer.bypassSecurityTrustHtml(rawSvg);
  });

  selectException(id: string) {
    this.selectedExceptionId.set(id);
    this.selectedCatalogSku.set('');
  }

  toggleCatalogSearch() {
    this.showCatalogSearch.update(v => !v);
  }

  selectCandidateSku(sku: string) {
    this.selectedCatalogSku.set(sku);
    this.showCatalogSearch.set(false);
  }

  getConfidencePercent(): number {
    const conf = this.currentException()?.matched_product?.confidence || 0;
    return Math.round(conf * 100);
  }

  handleConfirm() {
    const notes = this.supervisorNotes().trim();
    if (!notes) {
      alert('Por favor ingrese una breve justificación u observación para el registro inmutable de auditoría.');
      return;
    }
    const current = this.currentException();
    if (!current) return;
    this.validate.emit({
      exceptionId: current.id,
      validationType: 'CONFIRM',
      correctedSku: current.matched_product?.sku,
      notes
    });
    this.supervisorNotes.set('');
  }

  handleReassign() {
    const sku = this.selectedCatalogSku();
    if (!sku) {
      alert('Por favor seleccione una referencia del catálogo Solgar.');
      return;
    }
    const notes = this.supervisorNotes().trim();
    if (!notes) {
      alert('Por favor ingrese la justificación del cambio de SKU para el log forense.');
      return;
    }
    const current = this.currentException();
    if (!current) return;
    this.validate.emit({
      exceptionId: current.id,
      validationType: 'CORRECT_SKU',
      correctedSku: sku,
      notes
    });
    this.supervisorNotes.set('');
    this.showCatalogSearch.set(false);
  }

  handleDiscard() {
    const notes = this.supervisorNotes().trim();
    if (!notes) {
      alert('Por favor ingrese la razón para descartar esta detección (ej. reflejo, objeto no inventariable).');
      return;
    }
    const current = this.currentException();
    if (!current) return;
    this.validate.emit({
      exceptionId: current.id,
      validationType: 'DISCARD',
      notes
    });
    this.supervisorNotes.set('');
  }
}
