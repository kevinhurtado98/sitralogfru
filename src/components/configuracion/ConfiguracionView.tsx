"use client";

import { IconDeviceFloppy, IconUsers, IconMapPin, IconMailbox } from "@tabler/icons-react";
import Link from "next/link";
import type { UsuarioRow } from "./GestionarUsuariosView";

interface ResponsableRow {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  areaNombre: string;
  areaColor: string;
  areaTc: string;
}

function ini(texto: string) {
  return texto
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ConfiguracionView({
  usuarios,
  responsables,
}: {
  usuarios: UsuarioRow[];
  responsables: ResponsableRow[];
}) {
  return (
    <>
      {/* Áreas y responsables */}
      <div className="dc">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            paddingBottom: 9,
            borderBottom: "1px solid var(--bl)",
          }}
        >
          <span
            className="ss"
            style={{ margin: 0, padding: 0, border: "none" }}
          >
            Áreas y responsables
          </span>
          <Link href="/configuracion/gestionar-areas" className="btn btn-sm">
            <IconMapPin size={12} /> Gestionar
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 400,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--bl)",
                  background: "var(--bg2)",
                }}
              >
                {["Área", "Responsable", "Correo"].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "8px 11px",
                      textAlign: "left",
                      color: "var(--t2)",
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responsables.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: "16px 11px",
                      color: "var(--t3)",
                      fontSize: 13,
                    }}
                  >
                    No hay responsables registrados.
                  </td>
                </tr>
              )}
              {responsables.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--bl)" }}>
                  <td style={{ padding: "8px 11px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: r.areaColor,
                        color: r.areaTc,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {r.areaNombre}
                    </span>
                  </td>
                  <td style={{ padding: "8px 11px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: r.areaColor,
                          color: r.areaTc,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {ini(`${r.nombres} ${r.apellidos}`)}
                      </div>
                      {r.nombres} {r.apellidos}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "8px 11px",
                      fontSize: 12,
                      fontFamily: "var(--fm)",
                      color: "var(--t2)",
                    }}
                  >
                    {r.correo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usuarios del sistema */}
      <div className="dc">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            paddingBottom: 9,
            borderBottom: "1px solid var(--bl)",
          }}
        >
          <span
            className="ss"
            style={{ margin: 0, padding: 0, border: "none" }}
          >
            Usuarios del sistema
          </span>
          <Link href="/configuracion/gestionar-usuarios" className="btn btn-sm">
            <IconUsers size={12} /> Gestionar
          </Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 400,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--bl)",
                  background: "var(--bg2)",
                }}
              >
                {["Usuario", "Correo", "Rol", "Notificaciones"].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "8px 11px",
                      textAlign: "left",
                      color: "var(--t2)",
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios
                .filter((u) => u.activo)
                .map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid var(--bl)" }}
                  >
                    <td style={{ padding: "8px 11px", fontWeight: 500 }}>
                      {u.nombres} {u.apellidos}
                    </td>
                    <td
                      style={{
                        padding: "8px 11px",
                        fontSize: 12,
                        fontFamily: "var(--fm)",
                        color: "var(--t2)",
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={{ padding: "8px 11px" }}>
                      <span
                        className={`badge ${u.rol === "ADMIN" ? "badge-blue" : "badge-slate"}`}
                      >
                        {u.rol === "ADMIN" ? "Admin" : "Asistente"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 11px" }}>
                      <span
                        className={`badge ${u.notificaciones ? "badge-green" : "badge-slate"}`}
                      >
                        {u.notificaciones ? "Activas" : "Inactivas"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parámetros de pagos */}
      <div className="dc">
        <div className="ss">Parámetros de programación de pagos</div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div className="fi">
            <label>Día de programación</label>
            <select>
              <option>Lunes</option>
              <option>Martes</option>
            </select>
          </div>
          <div className="fi">
            <label>Día de pago (abono)</label>
            <select>
              <option>Viernes</option>
              <option>Jueves</option>
            </select>
          </div>
        </div>
        <div
          style={{ marginTop: 13, display: "flex", justifyContent: "flex-end" }}
        >
          <button className="btn btn-p">
            <IconDeviceFloppy size={13} /> Guardar
          </button>
        </div>
      </div>

      {/* Correos de prueba */}
      <div className="dc">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span className="ss" style={{ margin: 0, padding: 0, border: "none" }}>
              Correos de prueba
            </span>
            <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>
              Envía un correo de prueba con las plantillas reales del sistema para verificar diseño, remitente y entrega.
            </p>
          </div>
          <Link href="/configuracion/correos-prueba" className="btn btn-sm">
            <IconMailbox size={12} /> Probar
          </Link>
        </div>
      </div>
    </>
  );
}
