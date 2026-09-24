export type ComplianceNavItem = {
  href: string;
  label: string;
};

export const complianceNavigation: ComplianceNavItem[] = [
  { href: "/compliance", label: "Overview" },
  { href: "/compliance/taxpayer", label: "Taxpayer Profile" },
  { href: "/compliance/erp", label: "ERP / CAS" },
  { href: "/compliance/mapping", label: "Field Mapping" },
  { href: "/compliance/rules", label: "Validation Rules" },
  { href: "/compliance/readiness", label: "Readiness" },
  { href: "/compliance/reconciliation", label: "Reconciliation" },
  { href: "/compliance/audit", label: "Audit Trail" },
];
