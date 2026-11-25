// Prueba de concurrencia contra el sitio PUBLICADO (base de datos real).
// Lanza N reservas simultáneas al MISMO horario: solo una debe confirmarse.
// Uso: BASE_URL=https://su-dominio N=10 node tests/concurrencia.mjs
// Después, cancele la cita creada desde el panel (código impreso al final).
const BASE = process.env.BASE_URL; const N = Number(process.env.N ?? 10);
if (!BASE) { console.error("Defina BASE_URL"); process.exit(1); }
const html = await (await fetch(`${BASE}/agendar`)).text();
const id = /"id":"([0-9a-f-]{36})","slug":"valoracion"/.exec(html.replace(/\\"/g, '"'))?.[1];
const { dias } = await (await fetch(`${BASE}/api/disponibilidad?servicio=${id}`)).json();
const dia = dias.filter((d) => d.libres > 0).at(-1).fecha;
const { horarios } = await (await fetch(`${BASE}/api/disponibilidad?servicio=${id}&fecha=${dia}`)).json();
const inicio = horarios.at(-1).inicio;
console.log(`Servicio ${id} · horario ${inicio} · ${N} peticiones simultáneas`);
const res = await Promise.all(Array.from({ length: N }, (_, n) => fetch(`${BASE}/api/reservas`, {
  method: "POST", headers: { "Content-Type": "application/json", Origin: BASE },
  body: JSON.stringify({ servicio_id: id, inicio, nombres: "Prueba", apellidos: `Concurrencia ${n}`, telefono: "0999999999",
    email: `concurrencia${n}.${Date.now()}@example.com`, observaciones: "PRUEBA - cancelar", consentimiento: true, sitio_web: "" }),
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))));
const creadas = res.filter((r) => r.status === 201), conflictos = res.filter((r) => r.status === 409), limitadas = res.filter((r) => r.status === 429);
console.log(`201 creadas: ${creadas.length} · 409 conflicto: ${conflictos.length} · 429 límite por IP: ${limitadas.length} · otras: ${N - creadas.length - conflictos.length - limitadas.length}`);
if (creadas.length === 1) console.log(`OK: solo una reserva obtuvo el horario (código ${creadas[0].body.codigo}). Cancélela desde el panel.`);
else { console.log(creadas.length === 0 ? "Ninguna creada (¿límite por IP? vuelva a intentar en 10 min con N=5)" : "FALLO: más de una reserva para el mismo horario"); process.exitCode = 1; }
