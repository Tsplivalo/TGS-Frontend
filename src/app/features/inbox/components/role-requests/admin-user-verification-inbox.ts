import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserVerificationService } from '../../services/user-verification';
import { UserVerification, UserVerificationStatus } from '../../models/user-verification.model';
import { UserVerificationCardComponent } from '../role-requests/user-verification-card.js';
import { UserVerificationReviewModalComponent } from '../role-requests/user-verification-review-modal.js';

@Component({
  selector: 'app-admin-user-verification-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserVerificationCardComponent,
    UserVerificationReviewModalComponent
  ],
  templateUrl: './admin-user-verification-inbox.html',
  styleUrls: ['./user-verification.scss']
})
export class AdminUserVerificationInboxComponent implements OnInit {
  verifications: UserVerification[] = [];
  filteredVerifications: UserVerification[] = [];
  loading: boolean = true;
  error: string | null = null;

  statusFilter: UserVerificationStatus | 'ALL' = UserVerificationStatus.PENDING;
  reviewingVerification: UserVerification | null = null;

  UserVerificationStatus = UserVerificationStatus;

  constructor(private userVerificationService: UserVerificationService) {}

  ngOnInit(): void {
    this.loadVerifications();
  }

  async loadVerifications(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      const response = await this.userVerificationService.getAllVerifications({
        page: 1,
        limit: 100,
      });

      this.verifications = response.data;
      this.applyFilters();
    } catch (err: any) {
      this.error = err.error?.message || 'Error al cargar las verificaciones';
    } finally {
      this.loading = false;
    }
  }

  applyFilters(): void {
    let filtered = [...this.verifications];

    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter((v) => v.status === this.statusFilter);
    }

    this.filteredVerifications = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openReviewModal(verification: UserVerification): void {
    this.reviewingVerification = verification;
  }

  closeReviewModal(): void {
    this.reviewingVerification = null;
  }

  async handleReviewComplete(): Promise<void> {
    this.closeReviewModal();
    await this.loadVerifications();
  }

  get pendingCount(): number {
    return this.verifications.filter((v) => v.status === UserVerificationStatus.PENDING).length;
  }
}