export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  approverId: number | null;
  approver?: { id: number; name: string } | null;
  department: string | null;
  hireDate: string | null;
  gender: 'male' | 'female' | 'other' | null;
  status: 'active' | 'inactive';
  mustChangePassword: boolean;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'mustChangePassword'>;
}

export interface Attendance {
  id: number;
  userId: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'normal' | 'late' | 'early' | 'late_early' | 'missing_clock_in' | 'missing_clock_out' | 'absent' | 'leave';
  note: string | null;
}

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  hasQuota: boolean;
  deductPay: boolean;
  needAttachment: boolean;
  genderSpecific: 'male' | 'female' | 'all';
  isSystem: boolean;
  isActive: boolean;
  defaultDays: number | null;
}

export interface LeaveBalance {
  id: number;
  userId: number;
  typeId: number;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  LeaveType?: LeaveType;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  typeId: number;
  startDate: string;
  endDate: string;
  startPeriod: 'morning' | 'afternoon' | 'full';
  endPeriod: 'morning' | 'afternoon' | 'full';
  totalDays: number;
  reason: string | null;
  proxyUserId: number | null;
  proxyStatus: 'pending' | 'accepted' | 'rejected' | 'none';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  attachmentUrl: string | null;
  applicant?: Pick<User, 'id' | 'name' | 'department'>;
  proxyUser?: Pick<User, 'id' | 'name'> | null;
  LeaveType?: LeaveType;
  createdAt: string;
}

export interface OvertimeRequest {
  id: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string | null;
  compHours: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  User?: Pick<User, 'id' | 'name' | 'department'>;
  createdAt: string;
}

export interface ApprovalItem {
  stepId: number;
  flowId: number;
  requestType: 'leave' | 'overtime' | 'clock_amendment';
  currentLevel: number;
  totalLevels: number;
  request: LeaveRequest | OvertimeRequest;
  createdAt: string;
}

export interface SystemSettings {
  [key: string]: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
