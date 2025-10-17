// src/app/components/purchase-success-modal/purchase-success-modal.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PurchaseSuccessData {
  saleId: number;
  total: number;
  distributor?: {
    name: string;
    phone: string;
    email: string;
    zone?: {
      name: string;
      isHeadquarters: boolean;
    };
  };
}

@Component({
  selector: 'app-purchase-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal success-modal" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="success-icon">✅</div>
          <h2>¡Compra Registrada!</h2>
          <button class="close-btn" type="button" (click)="onClose()">×</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Sale Info -->
          <div class="sale-info">
            <div class="info-item">
              <span class="label">Número de Venta:</span>
              <span class="value">#{{ data.saleId }}</span>
            </div>
            <div class="info-item">
              <span class="label">Total:</span>
              <span class="value total">\${{ data.total | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Instructions -->
          <div class="instructions">
            <h3>📍 Próximos Pasos</h3>
            <p>
              Para continuar con el pago, dirígete a la sede más cercana:
            </p>
          </div>

          <!-- Location Info -->
          <div class="location-card" *ngIf="data.distributor">
            <div class="location-header">
              <span class="location-icon">🏢</span>
              <h4>{{ data.distributor.zone?.isHeadquarters ? 'Casa Central' : 'Sede' }}</h4>
            </div>
            
            <div class="location-details">
              <div class="detail-row">
                <span class="icon">📍</span>
                <span>{{ data.distributor.zone?.name || 'No especificada' }}</span>
              </div>
              <div class="detail-row">
                <span class="icon">👤</span>
                <span>{{ data.distributor.name }}</span>
              </div>
              <div class="detail-row">
                <span class="icon">📞</span>
                <a [href]="'tel:' + data.distributor.phone">{{ data.distributor.phone }}</a>
              </div>
              <div class="detail-row">
                <span class="icon">✉️</span>
                <a [href]="'mailto:' + data.distributor.email">{{ data.distributor.email }}</a>
              </div>
            </div>
          </div>

          <!-- Role Update Notification -->
          <div class="role-update-notice">
            <span class="icon">🎉</span>
            <p>
              <strong>¡Felicitaciones!</strong> Ahora eres un cliente registrado.
              Tu rol ha sido actualizado automáticamente.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-actions">
          <button class="btn btn--accent" type="button" (click)="onClose()">
            <span class="icon">👍</span>
            Entendido
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 16px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .success-modal {
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      animation: slideUp 0.3s cubic-bezier(0.25, 0.6, 0.3, 1);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.18);
      position: relative;

      .success-icon {
        font-size: 4rem;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        color: #fff;
        font-family: 'Google Sans Code', 'Montserrat', monospace;
      }

      .close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 2rem;
        color: #9ca3af;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
      }
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sale-info {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 16px;
      border-radius: 12px;
      backdrop-filter: blur(12px);

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;

        &:not(:last-child) {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .label {
          font-weight: 700;
          color: #e5e7eb;
          font-size: 0.9rem;
        }

        .value {
          font-weight: 600;
          color: #fff;
          font-size: 1rem;

          &.total {
            font-size: 1.25rem;
            color: #c3a462;
            font-weight: 800;
          }
        }
      }
    }

    .instructions {
      h3 {
        margin: 0 0 12px;
        font-size: 1.1rem;
        font-weight: 700;
        color: #fff;
      }

      p {
        margin: 0;
        color: #e5e7eb;
        line-height: 1.6;
      }
    }

    .location-card {
      background: linear-gradient(135deg, rgba(195, 164, 98, 0.12), rgba(195, 164, 98, 0.08));
      border: 1px solid rgba(195, 164, 98, 0.3);
      border-radius: 12px;
      padding: 16px;
      backdrop-filter: blur(12px);

      .location-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(195, 164, 98, 0.2);

        .location-icon {
          font-size: 1.5rem;
        }

        h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #c3a462;
        }
      }

      .location-details {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e5e7eb;
          font-size: 0.9rem;

          .icon {
            font-size: 1rem;
            width: 20px;
          }

          a {
            color: #fbbf24;
            text-decoration: none;
            font-weight: 600;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    .role-update-notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08));
      border-left: 3px solid #10b981;
      border-radius: 8px;

      .icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        color: #6ee7b7;
        font-size: 0.875rem;
        line-height: 1.5;

        strong {
          font-weight: 800;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      padding: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.18);
    }
  `]
})
export class PurchaseSuccessModalComponent {
  @Input() data!: PurchaseSuccessData;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}