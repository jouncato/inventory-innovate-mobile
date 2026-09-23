import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { InventorySession } from '../../../types/inventory';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="navbar">
      <div class="brand-section">
        <img 
          src="/logo-innovate.png" 
          alt="Innovate Nutrition" 
          class="brand-logo"
          (error)="onLogoError($event)"
        />
        <div class="brand-divider"></div>
        <div class="brand-badge">
          <span class="title">Control & Auditoría de Inventario</span>
          <span class="subtitle">Línea Solgar Colombia • IA Visual (Angular 21)</span>
        </div>
      </div>

      <nav class="nav-links">
        <button 
          class="nav-item" 
          [class.active]="activeTab === 'dashboard'"
          (click)="onSelectTab('dashboard')"
        >
          <app-icon name="activity" [size]="18"></app-icon>
          <span>Panel de Sesiones</span>
        </button>

        <button 
          class="nav-item" 
          [class.active]="activeTab === 'reconciliation'"
          (click)="onSelectTab('reconciliation')"
        >
          <app-icon name="refresh-cw" [size]="18"></app-icon>
          <span>Conciliación</span>
          @if (pendingExceptionsCount > 0) {
            <span class="badge badge-warning" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">
              {{ pendingExceptionsCount }}
            </span>
          }
        </button>

        <button 
          class="nav-item" 
          [class.active]="activeTab === 'audit'"
          (click)="onSelectTab('audit')"
        >
          <app-icon name="shield-check" [size]="18"></app-icon>
          <span>Trazabilidad Forense</span>
        </button>

        <button 
          class="nav-item" 
          [class.active]="activeTab === 'catalog'"
          (click)="onSelectTab('catalog')"
        >
          <app-icon name="box" [size]="18"></app-icon>
          <span>Catálogo Solgar</span>
        </button>
      </nav>

      <div class="navbar-right">
        <div class="form-group" style="margin: 0;">
          <select 
            class="form-select" 
            style="font-size: 0.8rem; padding: 0.4rem 0.8rem; font-weight: 600;"
            [value]="selectedSessionId"
            (change)="onSessionSelect($event)"
          >
            @for (s of sessions; track s.id) {
              <option [value]="s.id">
                {{ s.session_code }} - {{ getWarehouseShortName(s.warehouse_name) }}
              </option>
            }
          </select>
        </div>

        <div class="system-status status-live">
          <div class="pulse-dot"></div>
          <span>IA PIPELINE EN VIVO</span>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Input({ required: true }) activeTab: 'dashboard' | 'reconciliation' | 'audit' | 'catalog' = 'dashboard';
  @Output() tabChange = new EventEmitter<'dashboard' | 'reconciliation' | 'audit' | 'catalog'>();

  @Input() sessions: InventorySession[] = [];
  @Input() selectedSessionId: string = '';
  @Output() sessionChange = new EventEmitter<string>();

  @Input() pendingExceptionsCount: number = 0;

  onSelectTab(tab: 'dashboard' | 'reconciliation' | 'audit' | 'catalog') {
    this.tabChange.emit(tab);
  }

  onSessionSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.sessionChange.emit(value);
  }

  onLogoError(event: Event) {
    (event.target as HTMLElement).style.display = 'none';
  }

  getWarehouseShortName(name: string): string {
    return name ? name.split('-')[0] : '';
  }
}
