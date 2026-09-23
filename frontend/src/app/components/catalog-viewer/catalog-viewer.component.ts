import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { SolgarProduct } from '../../../types/inventory';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-catalog-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div>
      <div class="page-header">
        <div class="page-title">
          <h1>Catálogo Maestro Solgar Colombia</h1>
          <p>
            Referencias oficiales con códigos de barras UPC/EAN-13 y balance físico vs teórico
          </p>
        </div>

        <div style="position: relative;">
          <app-icon name="search" [size]="16" style="position: absolute; left: 10px; top: 10px; color: var(--color-text-muted);"></app-icon>
          <input 
            type="text" 
            class="form-input" 
            placeholder="Buscar por SKU, nombre, UPC..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            style="padding-left: 32px; font-size: 0.8rem; width: 280px;"
          />
        </div>
      </div>

      <div class="card-panel">
        <table class="custom-table">
          <thead>
            <tr>
              <th>SKU / Producto</th>
              <th>Código de Barras</th>
              <th>Presentación / Categoría</th>
              <th style="text-align: center;">Stock Teórico</th>
              <th style="text-align: center;">Conteo IA</th>
              <th style="text-align: center;">Discrepancia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (prod of filtered(); track prod.sku) {
              <tr>
                <td>
                  <div style="font-weight: bold; color: var(--color-navy);">
                    {{ prod.name }}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--color-gold); font-weight: 600;">
                    SKU: {{ prod.sku }}
                  </div>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.4rem; font-family: monospace; font-size: 0.8rem;">
                    <app-icon name="barcode" [size]="16" color="var(--color-text-secondary)"></app-icon>
                    <span>{{ prod.barcode }}</span>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.8rem;">{{ prod.presentation }}</div>
                  <div style="font-size: 0.7rem; color: var(--color-text-muted);">{{ prod.category }}</div>
                </td>
                <td style="text-align: center; font-weight: bold;">
                  {{ prod.theoretical_stock }}
                </td>
                <td style="text-align: center; font-weight: bold; color: var(--color-primary);">
                  {{ prod.counted_stock }}
                </td>
                <td style="text-align: center;">
                  <span 
                    class="badge" 
                    [class.badge-success]="prod.discrepancy === 0"
                    [class.badge-danger]="prod.discrepancy < 0"
                    [class.badge-warning]="prod.discrepancy > 0"
                  >
                    @if (prod.discrepancy > 0) {
                      +{{ prod.discrepancy }}
                    } @else {
                      {{ prod.discrepancy }}
                    }
                  </span>
                </td>
                <td>
                  @if (prod.discrepancy === 0) {
                    <span class="badge badge-success">Conciliado</span>
                  } @else {
                    <span class="badge badge-warning">Ajuste Requerido</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CatalogViewerComponent {
  @Input() catalog: SolgarProduct[] = [];

  searchTerm = signal<string>('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.catalog;
    return this.catalog.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.barcode.includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });
}
