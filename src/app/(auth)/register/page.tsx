import { redirect } from "next/navigation";

export const metadata = {
  title: "Register · BIR EIS",
  description: "Organization registration is managed by your platform administrator.",
};

/** Public self-serve register is disabled — workspaces are provider-provisioned. */
export default function RegisterPage() {
  redirect("/login");
}
