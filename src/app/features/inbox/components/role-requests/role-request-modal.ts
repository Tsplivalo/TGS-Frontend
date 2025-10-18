import { Component, Input, Output, EventEmitter, OnChanges, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../models/user/user.model';
import { RoleRequestService } from '../../services/role-request';
import { ZoneService } from '../../../../services/zone/zone';
import { ProductService } from '../../../../services/product/product';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface RoleOption {
  value: Role;
  label: string;
  description: string;
  icon: string;
}

interface ZoneDTO {
  id: number;
  name: string;
}

interface ProductDTO {
  id: number;
  description: string;
}

// ✅ Estructura extendida para datos adicionales según el rol
interface RoleSpecificData {
  // Para DISTRIBUTOR
  distributorZoneId?: number;
  distributorProductsIds?: number[];
  distributorAddress?: string;
  
  // Para AUTHORITY
  authorityRank?: '0' | '1' | '2' | '3';
  authorityZoneId?: number;
}

@Component({
  selector: 'app-role-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './role-request-modal.html',
  styleUrls: ['./role-requests.scss']
})
export class RoleRequestModalComponent implements OnChanges, OnInit {
  @Input() isOpen: boolean = false;
  @Input() currentRoles: Role[] = [];
  @Input() userEmail: string = ''; // ✅ Para pre-llenar datos
  @Input() userPhone: string = '';
  @Input() userAddress: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() requestSubmitted = new EventEmitter<void>();
  
  private t = inject(TranslateService);
  private zoneService = inject(ZoneService);
  private productService = inject(ProductService);

  // Estado base
  requestedRole: Role | '' = '';
  roleToRemove: Role | '' = '';
  justification: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;
  isRoleChange: boolean = false;
  
  // ✅ NUEVO: Step control (paso 1: rol, paso 2: datos adicionales)
  currentStep: 1 | 2 = 1;
  
  // ✅ NUEVO: Datos adicionales según el rol
  roleSpecificData: RoleSpecificData = {};
  
  // ✅ NUEVO: Catálogos para selects
  zones: ZoneDTO[] = [];
  products: ProductDTO[] = [];
  loadingCatalogs = false;

  readonly REQUESTABLE_ROLES: RoleOption[] = [
    {
      value: Role.PARTNER,
      label: 'Socio',
      description: 'Participa activamente en el negocio como socio de la organización',
      icon: '🤝',
    },
    {
      value: Role.DISTRIBUTOR,
      label: 'Distribuidor',
      description: 'Gestiona la distribución de productos en tu zona',
      icon: '📦',
    },
    {
      value: Role.AUTHORITY,
      label: 'Autoridad',
      description: 'Figura de autoridad que facilita operaciones gubernamentales',
      icon: '⚖️',
    },
  ];

  readonly INCOMPATIBLE_ROLES: Record<string, Role[]> = {
    [Role.AUTHORITY]: [Role.PARTNER, Role.DISTRIBUTOR, Role.ADMIN],
    [Role.PARTNER]: [Role.AUTHORITY],
    [Role.DISTRIBUTOR]: [Role.AUTHORITY],
    [Role.ADMIN]: [Role.AUTHORITY],
  };
  
  // ✅ NUEVO: Etiquetas de rangos
  readonly AUTHORITY_RANKS = [
    { value: '0', label: 'Rango 0 - Base' },
    { value: '1', label: 'Rango 1 - Intermedio' },
    { value: '2', label: 'Rango 2 - Senior' },
    { value: '3', label: 'Rango 3 - Ejecutivo' }
  ];

  constructor(private roleRequestService: RoleRequestService) {}

  ngOnInit(): void {
    this.loadCatalogs();
  }

  ngOnChanges(): void {
    if (!this.isOpen) {
      this.resetForm();
    }
  }
  
  // ✅ NUEVO: Cargar zonas y productos
  private loadCatalogs(): void {
    this.loadingCatalogs = true;
    
    // Cargar zonas
    this.zoneService.getAllZones().subscribe({
      next: (res: any) => {
        this.zones = res?.data ?? res ?? [];
      },
      error: (err) => console.error('Error loading zones:', err)
    });
    
    // Cargar productos
    this.productService.getAllProducts().subscribe({
      next: (res: any) => {
        this.products = res?.data ?? res ?? [];
        this.loadingCatalogs = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loadingCatalogs = false;
      }
    });
  }

  get removableRoles(): Role[] {
    return this.currentRoles.filter((role) =>
      [Role.PARTNER, Role.DISTRIBUTOR, Role.AUTHORITY].includes(role)
    );
  }

  get availableRoles(): RoleOption[] {
    return this.REQUESTABLE_ROLES.filter((role) => {
      if (this.currentRoles.includes(role.value)) return false;
      if (this.isRoleChange) return true;
      return this.isRoleCompatible(role.value);
    });
  }

  get selectedRoleDescription(): string | undefined {
    if (!this.requestedRole) return undefined;
    return this.REQUESTABLE_ROLES.find((r) => r.value === this.requestedRole)?.description;
  }

  get incompatibleRolesText(): string | null {
    if (!this.requestedRole) return null;
    const incompatible = this.INCOMPATIBLE_ROLES[this.requestedRole];
    return incompatible ? incompatible.join(', ') : null;
  }
  
  // ✅ NUEVO: Determinar si el rol requiere datos adicionales
  get requiresAdditionalData(): boolean {
    return this.requestedRole === Role.DISTRIBUTOR || 
           this.requestedRole === Role.AUTHORITY;
  }
  
  // ✅ NUEVO: Validar datos adicionales según el rol
  get additionalDataValid(): boolean {
    if (!this.requiresAdditionalData) return true;
    
    if (this.requestedRole === Role.DISTRIBUTOR) {
      return !!(this.roleSpecificData.distributorZoneId && 
                this.roleSpecificData.distributorAddress?.trim());
    }
    
    if (this.requestedRole === Role.AUTHORITY) {
      return !!(this.roleSpecificData.authorityRank && 
                this.roleSpecificData.authorityZoneId);
    }
    
    return false;
  }

  isRoleCompatible(role: Role): boolean {
    const incompatibleWith = this.INCOMPATIBLE_ROLES[role] || [];
    const rolesToCheck = this.isRoleChange && this.roleToRemove
      ? this.currentRoles.filter((r) => r !== this.roleToRemove)
      : this.currentRoles;

    return !rolesToCheck.some((currentRole) =>
      incompatibleWith.includes(currentRole)
    );
  }

  onRoleChangeToggle(checked: boolean): void {
    this.isRoleChange = checked;
    this.requestedRole = '';
    this.roleToRemove = '';
    this.error = null;
  }

  getRoleInfo(role: Role | ''): RoleOption | undefined {
    if (!role) return undefined;
    return this.REQUESTABLE_ROLES.find((r) => r.value === role);
  }
  
  // ✅ NUEVO: Avanzar al paso 2 (datos adicionales)
  goToStep2(): void {
    // Validaciones del paso 1
    if (!this.requestedRole) {
      this.error = 'Por favor selecciona un rol';
      return;
    }
    
    if (this.isRoleChange && !this.roleToRemove) {
      this.error = 'Por favor selecciona el rol que deseas remover';
      return;
    }
    
    if (this.justification.trim().length > 0 && this.justification.length < 20) {
      this.error = 'Si proporcionas una justificación, debe tener al menos 20 caracteres';
      return;
    }
    
    // Si el rol no requiere datos adicionales, enviar directamente
    if (!this.requiresAdditionalData) {
      this.onSubmit();
      return;
    }
    
    // Pre-llenar datos si están disponibles
    if (this.requestedRole === Role.DISTRIBUTOR && this.userAddress) {
      this.roleSpecificData.distributorAddress = this.userAddress;
    }
    
    this.error = null;
    this.currentStep = 2;
  }
  
  // ✅ NUEVO: Volver al paso 1
  backToStep1(): void {
    this.currentStep = 1;
    this.error = null;
  }
  
  // ✅ NUEVO: Toggle de productos (checkboxes)
  toggleProduct(productId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.roleSpecificData.distributorProductsIds || [];
    
    if (checked) {
      this.roleSpecificData.distributorProductsIds = [...current, productId];
    } else {
      this.roleSpecificData.distributorProductsIds = current.filter(id => id !== productId);
    }
  }
  
  isProductSelected(productId: number): boolean {
    return (this.roleSpecificData.distributorProductsIds || []).includes(productId);
  }

  async onSubmit(): Promise<void> {
    this.error = null;

    // Validación básica
    if (!this.requestedRole) {
      this.error = 'Por favor selecciona un rol';
      return;
    }

    if (this.isRoleChange && !this.roleToRemove) {
      this.error = 'Por favor selecciona el rol que deseas remover';
      return;
    }
    
    // Validar datos adicionales si es paso 2
    if (this.currentStep === 2 && !this.additionalDataValid) {
      this.error = 'Por favor completa todos los campos requeridos';
      return;
    }

    if (this.justification.trim().length > 0) {
      if (this.justification.length < 20) {
        this.error = 'Si proporcionas una justificación, debe tener al menos 20 caracteres';
        return;
      }
      if (this.justification.length > 500) {
        this.error = 'La justificación no puede exceder 500 caracteres';
        return;
      }
    }

    if (!this.isRoleChange && !this.isRoleCompatible(this.requestedRole as Role)) {
      const incompatible = this.INCOMPATIBLE_ROLES[this.requestedRole] || [];
      const conflictingRoles = this.currentRoles.filter((r) =>
        incompatible.includes(r)
      );
      this.error = `El rol ${this.requestedRole} es incompatible con tus roles actuales: ${conflictingRoles.join(', ')}`;
      return;
    }

    this.isSubmitting = true;

    try {
      const payload: any = {
        requestedRole: this.requestedRole,
      };

      if (this.isRoleChange && this.roleToRemove) {
        payload.roleToRemove = this.roleToRemove;
      }

      if (this.justification.trim().length > 0) {
        payload.justification = this.justification.trim();
      }
      
      // ✅ NUEVO: Agregar datos adicionales según el rol
      if (this.requestedRole === Role.DISTRIBUTOR) {
        payload.additionalData = {
          zoneId: this.roleSpecificData.distributorZoneId,
          address: this.roleSpecificData.distributorAddress?.trim(),
          productsIds: this.roleSpecificData.distributorProductsIds || []
        };
      } else if (this.requestedRole === Role.AUTHORITY) {
        payload.additionalData = {
          rank: this.roleSpecificData.authorityRank,
          zoneId: this.roleSpecificData.authorityZoneId
        };
      }

      await this.roleRequestService.createRequest(payload);
      this.requestSubmitted.emit();
      this.resetForm();
    } catch (err: any) {
      console.error('Error creating role request:', err);
      
      if (err.error?.errors && Array.isArray(err.error.errors)) {
        this.error = err.error.errors.map((e: any) => e.message).join(', ');
      } else if (err.error?.message) {
        this.error = err.error.message;
      } else {
        this.error = 'Error al enviar la solicitud. Por favor intenta nuevamente.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  resetForm(): void {
    this.requestedRole = '';
    this.roleToRemove = '';
    this.justification = '';
    this.isRoleChange = false;
    this.error = null;
    this.currentStep = 1;
    this.roleSpecificData = {};
  }
}