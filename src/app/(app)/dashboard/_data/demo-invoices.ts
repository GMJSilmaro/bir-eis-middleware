export interface DemoTopCustomer {
  name: string;
  initials: string;
  invoiceCount: number;
  amount: string;
}

export const DEMO_SUMMARY = {
  outbound: 463,
  inbound: 17_163,
  companies: 1,
} as const;

/** BIR-oriented status mix for the donut (demo percentages). */
export const DEMO_STATUS_DISTRIBUTION = {
  accepted: 78,
  rejected: 12,
  pending: 10,
} as const;

export const DEMO_TOP_CUSTOMERS: DemoTopCustomer[] = [
  {
    name: "San Miguel Foods",
    initials: "SM",
    invoiceCount: 2_776,
    amount: "₱1,896,924.79",
  },
  {
    name: "Metro Retail Corp.",
    initials: "MR",
    invoiceCount: 1_842,
    amount: "₱1,124,350.00",
  },
  {
    name: "Pacific Trade PH",
    initials: "PT",
    invoiceCount: 1_205,
    amount: "₱876,210.50",
  },
];

export const DEMO_SYSTEM_STATUS = {
  environment: "Sandbox",
  queueDocuments: 0,
  lastSyncLabel: "1 hour ago",
  lastSyncTone: "recent" as const,
  activeInLastHour: 1,
} as const;
