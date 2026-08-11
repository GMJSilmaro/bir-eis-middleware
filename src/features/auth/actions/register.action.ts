"use server";

import { registerSchema } from "@/features/auth/schemas/auth.schema";
import { provisionTenantWithAdmin } from "@/features/tenants/lib/provision-tenant";

/**
 * Public self-serve register is disabled (proxy + page redirect to /login).
 * Thin wrapper kept for internal reuse of the shared provisioner only.
 */
export async function registerAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
) {
  const raw = {
    organizationName: formData.get("organizationName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { organizationName, name, email, password } = parsed.data;

  try {
    await provisionTenantWithAdmin({
      organizationName,
      adminName: name,
      adminEmail: email,
      password,
    });

    return { success: true };
  } catch {
    return { error: "Registration failed. Please try again." };
  }
}
