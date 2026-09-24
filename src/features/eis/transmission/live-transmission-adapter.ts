import type {
  TransmissionAdapter,
  TransmitResult,
} from "@/features/eis/transmission/transmission-adapter";

/** Live BIR EIS HTTP transmit — not implemented this cycle. */
export const liveTransmissionAdapter: TransmissionAdapter = {
  async transmit(): Promise<TransmitResult> {
    return {
      ok: false,
      status: "technical_failure",
      failureClass: "TECHNICAL",
      httpStatus: 501,
      message: "Live BIR EIS transmission is not configured in this release",
    };
  },
};
