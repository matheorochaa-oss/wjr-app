// Agenda da WJR em formato de calendário (.ics) para assinar no iPhone, Mac ou Google Agenda.
// Endereço: https://<projeto>.supabase.co/functions/v1/agenda?t=<código>
// O código fica no banco (registros: colecao "config", id "calendario"), não neste arquivo.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP = "https://matheorochaa-oss.github.io/wjr-app/";

const esc = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (l: string) => {
  const out: string[] = []; let cur = ""; let bytes = 0;
  for (const ch of l) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 74) { out.push(cur); cur = " "; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur); return out.join("\r\n");
};
const dt = (s: string) => s.replace(/[-:]/g, "").slice(0, 13) + "00"; // "2026-11-10T08:00" -> 20261110T080000
const plusHour = (s: string) => {
  const [d, t] = s.split("T"); const [h, m] = t.split(":").map(Number);
  const nh = Math.min(h + 1, 23); const nm = h + 1 > 23 ? 59 : m;
  return `${d}T${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
};
const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

Deno.serve(async (req) => {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const { data: cfg } = await sb.from("registros").select("dados").eq("colecao", "config").eq("id", "calendario").maybeSingle();
  const codigo = (cfg?.dados as { codigo?: string } | null)?.codigo;
  if (!codigo || t !== codigo) return new Response("Link de agenda inválido.", { status: 401 });

  const rows: { colecao: string; id: string; dados: Record<string, any> }[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from("registros").select("colecao,id,dados").eq("apagado", false)
      .in("colecao", ["clientes", "itens", "locacoes"]).range(de, de + 999);
    if (error) return new Response("Erro ao ler a agenda.", { status: 500 });
    rows.push(...(data ?? [])); if (!data || data.length < 1000) break;
  }
  const cli = new Map(rows.filter(r => r.colecao === "clientes").map(r => [r.id, r.dados]));
  const it = new Map(rows.filter(r => r.colecao === "itens").map(r => [r.id, r.dados]));

  const L: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WJR//Locacoes//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:WJR Entregas e Retiradas", "REFRESH-INTERVAL;VALUE=DURATION:PT15M", "X-PUBLISHED-TTL:PT15M"];
  // Horários sem fuso fixo: aparecem na hora local do aparelho (a WJR lança na hora local dela).

  for (const r of rows.filter(r => r.colecao === "locacoes")) {
    const l = r.dados; const c = cli.get(l.clienteId) ?? {};
    const itens = (l.itens ?? []).filter((x: any) => +x.qtd > 0).map((x: any) => `${x.qtd} ${it.get(x.itemId)?.nome ?? "item"}`).join(", ");
    const local = [l.endereco, l.localizacao].filter(Boolean).join(" – ");
    const desc = [itens, c.telefone ? `Tel.: ${c.telefone}` : "", l.localizacao ? `Mapa: ${l.localizacao}` : "", l.obs ?? "", `Abrir no app: ${APP}`].filter(Boolean).join("\n");
    const evs: [string, string, string][] = [];
    if (l.retirada) evs.push(["entrega", l.retirada, `Entrega: ${c.nome ?? "Cliente"}`]);
    const fim = l.devolvidoEm || l.devolucao;
    if (fim) evs.push(["retirada", fim, `${l.devolvidoEm ? "Retirada feita" : "Retirada"}: ${c.nome ?? "Cliente"}`]);
    for (const [tipo, quando, titulo] of evs) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(quando)) continue;
      L.push("BEGIN:VEVENT", `UID:${r.id}-${tipo}@wjr`, `DTSTAMP:${stamp}`,
        `DTSTART:${dt(quando)}`, `DTEND:${dt(plusHour(quando))}`,
        `SUMMARY:${esc(titulo)}`, `DESCRIPTION:${esc(desc)}`, ...(local ? [`LOCATION:${esc(local)}`] : []), `URL:${APP}`, "END:VEVENT");
    }
  }
  L.push("END:VCALENDAR");
  return new Response(L.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="wjr-agenda.ics"', "Cache-Control": "no-cache" },
  });
});
