import { randomBytes } from "node:crypto";

import {
  buildCasEisDraftJson,
  type CasEisDraftDocumentInput,
  type CasEisSellerInput,
} from "@/features/documents/lib/build-cas-eis-draft-json";
import type { Prisma } from "@/lib/database/generated/prisma/client";
import { prisma } from "@/lib/database/client";

/** Prefetch seller TIN + registered name from taxpayer profile (fallback: credential + tenant). */
export async function loadEisSellerForTenant(
  tenantId: string,
): Promise<CasEisSellerInput> {
  const [tenant, credential, taxpayer] = await Promise.all([
    prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { name: true },
    }),
    prisma.eisCredential.findFirst({
      where: { tenantId, deletedAt: null },
      select: { tin: true },
    }),
    prisma.taxpayerProfile.findUnique({
      where: { tenantId },
      select: {
        registeredName: true,
        tin: true,
        branchCode: true,
        businessAddress: true,
        vatMode: true,
      },
    }),
  ]);

  return {
    tin: taxpayer?.tin ?? credential?.tin ?? null,
    registeredName: taxpayer?.registeredName ?? tenant?.name ?? null,
    branchCode: taxpayer?.branchCode ?? "00000",
    address: taxpayer?.businessAddress ?? null,
    vatClassification:
      taxpayer?.vatMode === "vat"
        ? "VAT"
        : taxpayer?.vatMode === "non_vat"
          ? "NON_VAT"
          : taxpayer?.vatMode ?? null,
  };
}

export function buildEisJsonPersistFields(
  document: CasEisDraftDocumentInput,
  seller: CasEisSellerInput,
): {
  eisJsonPayload: Prisma.InputJsonValue;
  eisJsonMappedAt: Date;
  sellerBranchCode?: string | null;
} {
  const payload = buildCasEisDraftJson(document, seller);
  return {
    eisJsonPayload: payload as unknown as Prisma.InputJsonValue,
    eisJsonMappedAt: new Date(),
    sellerBranchCode: payload.Seller.BranchCode,
  };
}

/**
 * Generate a document id before insert so EisUniqueId can include it in one write.
 * Format is cuid-like (c + time + entropy); Prisma also accepts any unique string.
 */
export function newInvoiceDocumentId(): string {
  const time = Date.now().toString(36);
  const entropy = randomBytes(8).toString("hex");
  return `c${time}${entropy}`;
}
