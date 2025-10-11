export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'APPROVED' | 'REJECTED';

export interface MonthlyReviewDTO {
  id: number;
  year: number;
  month: number;        // 1-12
  reviewDate: string;   // ISO
  status: ReviewStatus;
  totalSalesAmount?: number;
  totalSalesCount?: number;
  reviewedBy?: { dni: string; name: string } | null;
  observations?: string | null;
  recommendations?: string | null;
}

export interface CreateMonthlyReviewDTO {
  year: number;
  month: number;
  reviewDate?: string;      // yyyy-MM-dd
  status?: ReviewStatus;
  observations?: string;
  recommendations?: string;
  reviewedByDni: string;
}

export interface PatchMonthlyReviewDTO {
  year?: number;
  month?: number;
  reviewDate?: string;
  status?: ReviewStatus;
  observations?: string;
  recommendations?: string;
  reviewedByDni?: string;
}

export interface SalesStatsQuery {
  year: number;
  month?: number;
  groupBy?: 'distributor' | 'product' | 'client' | 'day' | 'zone';
}
export interface SalesStatsItem {
  label: string;
  totalAmount: number;
  totalCount: number;
}
export interface ApiResponse<T> { data: T; message?: string; }
