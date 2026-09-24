export {
  buildIdempotencyKey,
  canRetryTechnical,
  nextBackoffMs,
  MAX_RETRIES,
  type TransmissionAdapter,
  type TransmitRequest,
  type TransmitResult,
  type TransmissionFailureClass,
} from "@/features/eis/transmission/transmission-adapter";
export { defaultTransmissionAdapter } from "@/features/eis/transmission/sandbox-transmission-adapter";
export { liveTransmissionAdapter } from "@/features/eis/transmission/live-transmission-adapter";
