/** Role slugs that identify platform operators (cross-tenant console later). */
export const PLATFORM_OPERATOR_ROLE_SLUGS = new Set(["super_admin"]);

export function isPlatformOperator(roleSlugs: string[] | undefined): boolean {
  if (!roleSlugs?.length) return false;
  return roleSlugs.some((slug) => PLATFORM_OPERATOR_ROLE_SLUGS.has(slug));
}
