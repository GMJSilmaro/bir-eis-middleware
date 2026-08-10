import type { Prisma } from "@/lib/database/generated/prisma/client";
import { prisma } from "@/lib/database/client";
import {
  DOCUMENT_PAGE_SIZE,
  type DocumentDirection,
} from "@/features/documents/lib/document-list-shared";

export { DOCUMENT_PAGE_SIZE, type DocumentDirection };

/** Outbound submissions eligible for the EIS response inbox (Inbound). */
export const RESPONSE_INBOX_STATUSES = [
  "queued",
  "submitted",
  "accepted",
  "rejected",
] as const;

export interface ListDocumentsParams {
  tenantId: string;
  direction: DocumentDirection;
  status?: string;
  documentType?: string;
  q?: string;
  page?: number;
}

function buildListWhere(
  params: ListDocumentsParams,
): Prisma.InvoiceDocumentWhereInput {
  const q = params.q?.trim();

  const base: Prisma.InvoiceDocumentWhereInput = {
    tenantId: params.tenantId,
    deletedAt: null,
    ...(params.documentType ? { documentType: params.documentType } : {}),
    ...(q
      ? {
          OR: [
            {
              documentNumber: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              counterpartName: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  if (params.direction === "inbound") {
    return {
      ...base,
      direction: "outbound",
      status: params.status
        ? params.status
        : { in: [...RESPONSE_INBOX_STATUSES] },
    };
  }

  return {
    ...base,
    direction: "outbound",
    ...(params.status ? { status: params.status } : {}),
  };
}

export async function listDocuments(params: ListDocumentsParams) {
  const pageRaw = params.page ?? 1;
  const page =
    Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const skip = (page - 1) * DOCUMENT_PAGE_SIZE;
  const where = buildListWhere(params);

  const [total, rows] = await Promise.all([
    prisma.invoiceDocument.count({ where }),
    prisma.invoiceDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: DOCUMENT_PAGE_SIZE,
      select: {
        id: true,
        direction: true,
        documentType: true,
        status: true,
        documentNumber: true,
        issueDate: true,
        currency: true,
        counterpartName: true,
        counterpartTin: true,
        totalAmount: true,
        eisAckStatus: true,
        createdAt: true,
      },
    }),
  ]);

  // Plain JSON for Client Components (Prisma Decimal/Date are not RSC-serializable).
  const documents = rows.map((doc) => ({
    id: doc.id,
    direction: doc.direction,
    documentType: doc.documentType,
    status: doc.status,
    documentNumber: doc.documentNumber,
    issueDate: doc.issueDate.toISOString(),
    currency: doc.currency,
    counterpartName: doc.counterpartName,
    counterpartTin: doc.counterpartTin,
    totalAmount: doc.totalAmount.toString(),
    eisAckStatus: doc.eisAckStatus,
    createdAt: doc.createdAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(total / DOCUMENT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return { total, documents, page: safePage, totalPages };
}

export async function getDocumentById(tenantId: string, id: string) {
  return prisma.invoiceDocument.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function documentNumberExists(params: {
  tenantId: string;
  direction: DocumentDirection;
  documentNumber: string;
  excludeId?: string;
}): Promise<boolean> {
  const existing = await prisma.invoiceDocument.findFirst({
    where: {
      tenantId: params.tenantId,
      direction: params.direction,
      documentNumber: params.documentNumber,
      deletedAt: null,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function getDocumentDashboardStats(tenantId: string) {
  const baseWhere = { tenantId, deletedAt: null };

  const [outboundCount, inboundCount, statusGroups, counterparts] =
    await Promise.all([
      prisma.invoiceDocument.count({
        where: { ...baseWhere, direction: "outbound" },
      }),
      prisma.invoiceDocument.count({
        where: {
          ...baseWhere,
          direction: "outbound",
          eisAckStatus: { in: ["accepted", "rejected"] },
        },
      }),
      prisma.invoiceDocument.groupBy({
        by: ["status"],
        where: { ...baseWhere, direction: "outbound" },
        _count: { _all: true },
      }),
      prisma.invoiceDocument.groupBy({
        by: ["counterpartName"],
        where: { ...baseWhere, direction: "outbound" },
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { counterpartName: "desc" } },
        take: 5,
      }),
    ]);

  return {
    outboundCount,
    inboundCount,
    statusGroups,
    counterparts,
  };
}
