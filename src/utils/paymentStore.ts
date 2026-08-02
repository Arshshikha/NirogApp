import { apiPost, apiGet } from './api';

export interface InitiatePaymentResult {
  paymentId: string;
  gatewayOrderId?: string;
  amount?: number;
  bookingId: string;
  payOnsite?: boolean;
}

export interface ConfirmPaymentResult {
  message: string;
  booking: any;
  payment: any;
}

export interface EarningsResult {
  totalGross: number;
  totalCommission: number;
  totalEarnings: number;
  payouts: Array<{
    id: string;
    amount: string | number;
    platformFee: string | number;
    netAmount: string | number;
    status: string;
    createdAt: string;
  }>;
}

export const initiatePaymentApi = async (bookingData: {
  doctorProfileId?: string;
  providerProfileId?: string;
  serviceId?: string;
  appointmentType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes?: number;
  patientNotes?: string;
  payOnsite?: boolean;
}): Promise<InitiatePaymentResult> => {
  return await apiPost('/payments/initiate', bookingData);
};

export const confirmPaymentApi = async (
  paymentId: string,
  gatewayPaymentId: string,
  status: 'SUCCESS' | 'FAILED'
): Promise<ConfirmPaymentResult> => {
  return await apiPost('/payments/confirm', {
    paymentId,
    gatewayPaymentId,
    gatewaySignature: 'mock_sig_' + Math.random().toString(36).substring(2, 10),
    status
  });
};

export const getEarningsApi = async (): Promise<EarningsResult> => {
  return await apiGet('/payments/earnings');
};

export const getPaymentStatusApi = async (paymentId: string): Promise<{ status: string }> => {
  return await apiGet(`/payments/${paymentId}/status`);
};
