import { auth } from "@/lib/auth";
import { PerfilView } from "@/components/perfil/PerfilView";

export default async function PerfilPage() {
  const session = await auth();
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";

  return <PerfilView name={name} email={email} />;
}
