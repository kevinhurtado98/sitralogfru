import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordFlow />
    </AuthShell>
  );
}
