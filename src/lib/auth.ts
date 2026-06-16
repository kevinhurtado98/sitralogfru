// Configuración de autenticación con NextAuth usando JWT y credenciales
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Esquema de validación para los datos del formulario de login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sesión basada en JWT con duración de 8 horas
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Validar formato de credenciales antes de consultar la BD
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Buscar usuario activo en la base de datos con su rol
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { rol: { select: { nombre: true } } },
        });
        if (!user || !user.activo) return null;

        // Comparar contraseña con el hash almacenado
        const passwordOk = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );
        if (!passwordOk) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.nombres} ${user.apellidos}`.trim(),
          role: user.rol.nombre,
        };
      },
    }),
  ],
  callbacks: {
    // Incluir id y rol del usuario en el token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    // Exponer id y rol en el objeto de sesión accesible desde el cliente
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
