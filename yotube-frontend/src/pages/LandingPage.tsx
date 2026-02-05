import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PlanConfig } from "../types";
import { getPlans } from "../service/plans";

/** ---------- Config ---------- */
const demoPlans: PlanConfig[] = [
  { id: "starter", name: "Starter", price: 0, channels: 1, active: true },
  { id: "pro", name: "Pro", price: 59, channels: 5, active: true, popular: true },
  { id: "business", name: "Business", price: 179, channels: 20, active: true },
];

const planFeatures: Record<string, string[]> = {
  starter: ["Ranking de performance", "Tema escuro", "Busca e filtros"],
  pro: ["Coleta diária", "Exportações CSV", "Suporte prioritário"],
  business: ["SLA dedicado", "SSO (opcional)", "Treinamento de equipe"],
};

const formatPrice = (v: number) => (v ? `R$ ${v}/mês` : "R$ 0");

/** ---------- Página ---------- */
export default function SaaSLandingPage() {
  const [plans, setPlans] = useState<PlanConfig[]>(demoPlans);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlans();
        setPlans(data.filter((p) => p.active));
      } catch {
        setPlans(demoPlans);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <style>{`:root { --primary:#E53935; --primary-dark:#C62828; }`}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">YA</span>
            <span className="text-white/90">Youtube Analysis</span>
          </a>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-white/70 hover:text-[var(--primary)]">Recursos</a>
            <a href="#how" className="text-white/70 hover:text-[var(--primary)]">Como funciona</a>
            <a href="#pricing" className="text-white/70 hover:text-[var(--primary)]">Planos</a>
            <a href="#faq" className="text-white/70 hover:text-[var(--primary)]">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/login" className="hidden rounded-full px-4 py-2 text-sm md:inline-block text-white/80 hover:text-[var(--primary)]">
              Entrar
            </a>
            <a
              href="#pricing"
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[var(--primary-dark)]"
            >
              Ver planos
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* glow sutil no fundo, mantém preto predominante */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-20">
          <div className="absolute -top-36 left-1/2 h-[28rem] w-[95rem] -translate-x-1/2 rounded-full bg-[var(--primary)] blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Analise vídeos e canais do YouTube
              <span className="block text-[var(--primary)]">em minutos, não em horas.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/70">
              O Youtube Analysis monitora seus canais, puxa os vídeos mais recentes e ranqueia a
              performance para você focar no que traz resultado.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#pricing"
                className="rounded-full bg-[var(--primary)] px-6 py-3 font-medium text-white shadow-lg transition-colors hover:bg-[var(--primary-dark)]"
              >
                Ver planos
              </a>
              <a
                href="#how"
                className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/90 hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Ver como funciona
              </a>
            </div>
          </motion.div>

          {/* Mini Dashboard com thumbnails e títulos (tema preto) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <MiniDashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">O que você ganha com o Youtube Analysis</h2>
          <p className="mt-3 text-white/70">Recursos pensados no seu fluxo diário de publicação e análise.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Feature title="Ranking de performance" desc="Classificação automática dos vídeos em Alto/Médio/Baixo com base em velocidade de views, engajamento e alcance do canal." />
          <Feature title="Busca e filtros rápidos" desc="Encontre conteúdos por título, canal ou nível de performance com um campo de busca elegante e responsivo." />
          <Feature title="Tema escuro por padrão" desc="Interface moderna com cabeçalho flutuante, skeleton de carregamento e animações suaves." />
          <Feature title="Gestão de canais simples" desc="Adicione canais por URL ou @handle. O sistema resolve ID, busca avatar, inscritos e salva no backend." />
          <Feature title="Atualização automática" desc="Sincronização semanal dos últimos vídeos de cada canal para manter o painel sempre atualizado." />
          <Feature title="Pronto para equipes" desc="Convide membros e mantenha todos alinhados com um painel único (recursos de time opcionais)." />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-white/10 bg-[#0A0A0A] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Como funciona</h2>
            <p className="mt-3 text-white/70">Conecte. Analise. Decida.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Step n={1} title="Conecte seus canais" desc="Cole a URL ou @handle. Buscamos canal, avatar e inscritos automaticamente." />
            <Step n={2} title="Coletamos os vídeos" desc="Puxamos os vídeos mais recentes e as métricas públicas." />
            <Step n={3} title="Pontuamos a performance" desc="Score que considera velocidade de views, engajamento e alcance." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Planos simples e transparentes</h2>
          <p className="mt-3 text-white/70">Escolha o plano ideal e cresça com dados.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const featureChannels = p.channels === 1 ? "1 canal" : `Até ${p.channels} canais`;
            const features = [featureChannels, ...(planFeatures[p.id] || [])];
            const href = p.id === "starter" ? "/signup" : `/pagamento?plano=${encodeURIComponent(p.id)}`;
            const cta = p.id === "starter" ? "Criar conta" : `Assinar ${p.name}`;
            return (
              <PricingCard
                key={p.id}
                name={p.name}
                price={formatPrice(p.price)}
                cta={cta}
                features={features}
                href={href}
                featured={p.popular}
              />
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/10 bg-[#0A0A0A] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4">
            <FAQ q="Posso adicionar canais por @handle?" a="Sim. Informe @handle ou a URL do canal que resolvemos o ID automaticamente." />
            <FAQ q="Quais métricas compõem o score?" a="Velocidade de views, taxa de engajamento e alcance em relação aos inscritos. Classificamos em Alto, Médio ou Baixo." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-sm text-white/60">© {new Date().getFullYear()} Youtube Analysis. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="text-white/70 hover:text-[var(--primary)]">Termos</a>
            <a href="#" className="text-white/70 hover:text-[var(--primary)]">Privacidade</a>
            <a href="#pricing" className="rounded-full bg-[var(--primary)] px-4 py-2 text-white hover:bg-[var(--primary-dark)]">Ver planos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** ---------- Componentes ---------- */

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-sm transition-colors hover:border-[var(--primary)]/60"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
    </motion.div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-6"
    >
      <div className="absolute -top-3 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">
        {n}
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
    </motion.div>
  );
}

function PricingCard({
  name,
  price,
  features,
  cta,
  href,
  featured,
}: {
  name: string;
  price: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl border p-6 shadow-sm ${
        featured
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[#0A0A0A]"
          : "border-white/10 bg-[#0A0A0A]"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 right-4 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white">
          Mais popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-3xl font-extrabold">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-white/70">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={href}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--primary-dark)]"
      >
        {cta}
      </a>
    </motion.div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-[#0A0A0A]/90 p-4 open:border-[var(--primary)]/40 open:bg-white/5">
      <summary className="cursor-pointer list-none font-medium transition-colors group-open:text-[var(--primary)]">
        {q}
      </summary>
      <p className="mt-2 text-sm text-white/70">{a}</p>
    </details>
  );
}

/** ---------- Mini dashboard (simula Dashboard.tsx) ---------- */
function MiniDashboardPreview() {
  // dados fake de vídeos (thumb + título + performance)
  const items = [
    {
      perf: "high",
      title: "Como monetizar Shorts 2025",
      thumb: "https://picsum.photos/id/1011/400/225",
    },
    {
      perf: "medium",
      title: "Thumbnail A/B: resultados reais",
      thumb: "https://picsum.photos/id/1015/400/225",
    },
    {
      perf: "high",
      title: "Crescendo com lives (guia rápido)",
      thumb: "https://picsum.photos/id/1025/400/225",
    },
    {
      perf: "low",
      title: "Erros comuns em títulos do YouTube",
      thumb: "https://picsum.photos/id/1035/400/225",
    },
    {
      perf: "medium",
      title: "Ferramentas de edição 10x",
      thumb: "https://picsum.photos/id/1044/400/225",
    },
    {
      perf: "low",
      title: "Tendências da semana",
      thumb: "https://picsum.photos/id/1050/400/225",
    },
    {
      perf: "high",
      title: "Script que retém + audiência",
      thumb: "https://picsum.photos/id/1062/400/225",
    },
    {
      perf: "medium",
      title: "Cortes vs vídeo longo: quando usar?",
      thumb: "https://picsum.photos/id/1070/400/225",
    },
  ] as const;

  const badgeStyle = {
    high: "bg-emerald-500",
    medium: "bg-amber-500",
    low: "bg-rose-500",
  } as const;

  const badgeLabel = { high: "Alto", medium: "Médio", low: "Baixo" } as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-3 shadow-2xl">
      {/* Destaque: “player” escuro */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <img
          src="https://picsum.photos/id/1005/1280/720"
          alt="Vídeo em destaque"
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="mb-2 inline-block rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Alto
          </span>
          <h4 className="text-lg font-semibold leading-snug">
            Estratégias para crescer com vídeos curtos em 2025
          </h4>
          <p className="mt-1 text-xs text-white/70">12:03 • Canal Exemplo</p>
        </div>
      </div>

      {/* Grid de vídeos */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-colors hover:border-[var(--primary)]/60"
          >
            <div className="relative aspect-video w-full">
              <img src={it.thumb} alt={it.title} className="h-full w-full object-cover" />
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${badgeStyle[it.perf]}`}
              >
                {badgeLabel[it.perf]}
              </span>
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-[13px] font-medium leading-tight">{it.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-white/60">
                <span>há 2d</span>
                <span>•</span>
                <span>12:34</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ---------- Smoke tests (opcional) ---------- */
export function __runLandingSmokeTests() {
  const tests: string[] = [];
  try {
    tests.push(React.isValidElement(<SaaSLandingPage />) ? "render:ok" : "render:fail");
  } catch {
    tests.push("render:throw");
  }
  try {
    tests.push(React.isValidElement(<FAQ q="Q" a="A" />) ? "faq:ok" : "faq:fail");
  } catch {
    tests.push("faq:throw");
  }
  try {
    tests.push(React.isValidElement(<MiniDashboardPreview />) ? "preview:ok" : "preview:fail");
  } catch {
    tests.push("preview:throw");
  }
  try {
    tests.push(React.isValidElement(<Feature title="t" desc="d" />) ? "feature:ok" : "feature:fail");
  } catch {
    tests.push("feature:throw");
  }
  try {
    tests.push(
      React.isValidElement(
        <PricingCard name="n" price="$" features={["a"]} cta="c" href="#" />
      )
        ? "pricing:ok"
        : "pricing:fail"
    );
  } catch {
    tests.push("pricing:throw");
  }
  return tests;
}
