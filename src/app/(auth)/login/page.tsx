import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell>
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--t1)",
            letterSpacing: "-0.4px",
            marginBottom: 6,
          }}
        >
          Iniciar sesión
        </h2>
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      <LoginForm />

      <p style={{ marginTop: 16, textAlign: "right" }}>
        <Link
          href="/forgot-password"
          style={{ fontSize: 12, color: "var(--blue)", textDecoration: "none" }}
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <p
        style={{
          marginTop: 24,
          fontSize: 12,
          color: "var(--t3)",
          textAlign: "center",
        }}
      >
        ¿Problemas para ingresar? Contacta al administrador del sistema.
      </p>
    </AuthShell>
  );
}
