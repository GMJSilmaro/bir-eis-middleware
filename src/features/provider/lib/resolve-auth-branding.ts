import {
  DEFAULT_PLATFORM_PRODUCT_NAME,
  DEFAULT_PLATFORM_PRODUCT_TAGLINE,
  getPlatformSettings,
} from "@/features/provider/lib/get-platform-settings";
import { prisma } from "@/lib/database/client";

export type AuthBranding = {
  productName: string;
  productTagline: string;
  logo: string | null;
  /** True when an active tenant slug overlaid platform defaults. */
  tenantOverlay: boolean;
  tenantSlug: string | null;
};

/**
 * Resolve auth-shell branding: PlatformSettings first, then optional
 * active-tenant overlay when `?tenant=slug` is present.
 */
export async function resolveAuthBranding(
  tenantSlug?: string | null,
): Promise<AuthBranding> {
  const platform = await getPlatformSettings();
  const slug = tenantSlug?.trim().toLowerCase() || null;

  if (!slug) {
    return {
      productName: platform.productName || DEFAULT_PLATFORM_PRODUCT_NAME,
      productTagline:
        platform.productTagline || DEFAULT_PLATFORM_PRODUCT_TAGLINE,
      logo: platform.logo,
      tenantOverlay: false,
      tenantSlug: null,
    };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true, tagline: true, logo: true, slug: true },
  });

  if (!tenant) {
    return {
      productName: platform.productName || DEFAULT_PLATFORM_PRODUCT_NAME,
      productTagline:
        platform.productTagline || DEFAULT_PLATFORM_PRODUCT_TAGLINE,
      logo: platform.logo,
      tenantOverlay: false,
      tenantSlug: null,
    };
  }

  return {
    productName: tenant.name,
    productTagline:
      tenant.tagline?.trim() ||
      platform.productTagline ||
      DEFAULT_PLATFORM_PRODUCT_TAGLINE,
    logo: tenant.logo ?? platform.logo,
    tenantOverlay: true,
    tenantSlug: tenant.slug,
  };
}
