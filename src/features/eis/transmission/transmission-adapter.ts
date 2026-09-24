/**
 * EIS transmission port — sandbox first; live HTTP is out of scope this cycle.
 */

export type TransmissionFailureClass = "BUSINESS" | "TECHNICAL";

export type TransmitRequest = {
  tenantId: string;
  documentId: string;
  documentNumber: string;
  documentType: string;
  tin: string;
  branchCode: string;
  idempotencyKey: string;
  eisPayload: unknown;
  environment: "cert" | "prod";
};

export type TransmitResult = {
  ok: boolean;
  status:
    | "accepted"
    | "rejected"
    | "acknowledged"
    | "technical_failure"
    | "duplicate";
  failureClass?: TransmissionFailureClass;
  httpStatus?: number;
  referenceId?: string;
  message: string;
  responseMeta?: Record<string, unknown>;
};

export interface TransmissionAdapter {
  transmit(request: TransmitRequest): Promise<TransmitResult>;
}

/** Deterministic idempotency key for retries. */
export function buildIdempotencyKey(params: {
  tenantId: string;
  tin: string;
  branchCode: string;
  documentType: string;
  documentNumber: string;
  sourceErpId?: string | null;
}): string {
  const parts = [
    params.tenantId,
    params.tin.replace(/\D/g, ""),
    params.branchCode || "00000",
    params.documentType,
    params.documentNumber,
  ];
  if (params.sourceErpId) parts.push(params.sourceErpId);
  return parts.join(":");
}

const MAX_RETRIES = 5;

export function nextBackoffMs(attemptNo: number): number {
  const base = 5_000;
  const ms = base * Math.pow(2, Math.max(0, attemptNo - 1));
  return Math.min(ms, 15 * 60_000);
}

export function canRetryTechnical(attemptNo: number): boolean {
  return attemptNo < MAX_RETRIES;
}

export { MAX_RETRIES };
