import type {
  TransmissionAdapter,
  TransmitRequest,
  TransmitResult,
} from "@/features/eis/transmission/transmission-adapter";

/**
 * Sandbox EIS transmit — simulates accept/reject/technical failure.
 * Does not call live BIR endpoints.
 */
export const sandboxTransmissionAdapter: TransmissionAdapter = {
  async transmit(request: TransmitRequest): Promise<TransmitResult> {
    const seed = `${request.environment}:${request.idempotencyKey}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const bucket = hash % 100;

    // ~8% technical, ~12% business reject, else accept
    if (bucket < 8) {
      return {
        ok: false,
        status: "technical_failure",
        failureClass: "TECHNICAL",
        httpStatus: 503,
        message: "Sandbox EIS temporary unavailable (simulated HTTP 503)",
        responseMeta: { simulated: true, environment: request.environment },
      };
    }
    if (bucket < 20) {
      return {
        ok: false,
        status: "rejected",
        failureClass: "BUSINESS",
        httpStatus: 400,
        message: "Sandbox EIS business rejection (simulated invalid payload)",
        referenceId: `EIS-SANDBOX-REJ-${request.documentNumber}`,
        responseMeta: { simulated: true, environment: request.environment },
      };
    }

    return {
      ok: true,
      status: "accepted",
      httpStatus: 200,
      referenceId: `EIS-SANDBOX-${request.environment.toUpperCase()}-${request.documentNumber}`,
      message: `Sandbox EIS accepted (${request.environment})`,
      responseMeta: { simulated: true, environment: request.environment },
    };
  },
};

export const defaultTransmissionAdapter = sandboxTransmissionAdapter;
