import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANO_MAX = 5 * 1024 * 1024; // 5 MB

type Respuesta = { ok: true; url: string } | { ok: false; mensaje: string };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<Respuesta>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, mensaje: "No autorizado" },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "No se pudo leer el formulario" });
  }

  const archivo = formData.get("archivo") as File | null;
  if (!archivo) {
    return NextResponse.json({ ok: false, mensaje: "No se recibió ningún archivo" });
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json({ ok: false, mensaje: "Solo se aceptan imágenes (JPG, PNG, WEBP, GIF)" });
  }
  if (archivo.size > TAMANO_MAX) {
    return NextResponse.json({ ok: false, mensaje: "La imagen no debe superar 5 MB" });
  }

  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const ext = path.extname(archivo.name).toLowerCase() || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "requerimientos");
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ ok: true, url: `/uploads/requerimientos/${filename}` });
  } catch (e) {
    console.error("[upload-imagen]", e);
    return NextResponse.json({ ok: false, mensaje: "Error al guardar la imagen" });
  }
}
