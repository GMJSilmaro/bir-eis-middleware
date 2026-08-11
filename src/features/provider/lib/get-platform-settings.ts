import { cache } from "react";

import { prisma } from "@/lib/database/client";

export const DEFAULT_PLATFORM_PRODUCT_NAME = "BIR EIS | Pixelcare";
export const DEFAULT_PLATFORM_PRODUCT_TAGLINE = "e-Invoice Middleware";

export type PlatformSettingsDto = {
  id: string;
  productName: string;
  productTagline: string;
  logo: string | null;
};

/** Deduped per request — auth shell and provider branding share one read. */
export const getPlatformSettings = cache(
  async (): Promise<PlatformSettingsDto> => {
    const row = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: {
        id: true,
        productName: true,
        productTagline: true,
        logo: true,
      },
    });

    if (!row) {
      return {
        id: "default",
        productName: DEFAULT_PLATFORM_PRODUCT_NAME,
        productTagline: DEFAULT_PLATFORM_PRODUCT_TAGLINE,
        logo: null,
      };
    }

    return {
      id: row.id,
      productName: row.productName || DEFAULT_PLATFORM_PRODUCT_NAME,
      productTagline: row.productTagline || DEFAULT_PLATFORM_PRODUCT_TAGLINE,
      logo: row.logo,
    };
  },
);
