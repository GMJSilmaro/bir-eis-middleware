-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_tagline" TEXT NOT NULL,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
