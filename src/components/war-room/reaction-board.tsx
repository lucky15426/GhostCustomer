"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import type { Persona, SimulationResult, Verdict } from "@/lib/types";

// ---------------------------------------------------------------------------
// Reaction Board — a live "focus group" of 4 ghost personas reacting to the
// page. Every word is REAL run data: each card streams that persona's own
// simulation reasoning + objection, typed out character-by-character.
// ---------------------------------------------------------------------------

const VERDICT_ORDER: Verdict[] = ["Convert", "Maybe", "Churn Risk", "Bounce"];

interface Seat {
  persona: Persona;
  verdict: Verdict;
  messages: string[];
}

function buildSeats(personas: Persona[], sims: SimulationResult[]): Seat[] {
  const byId = new Map(personas.map((p) => [p.id, p]));
  // pair each sim with its persona, keep only those we can render
  const paired = sims
    .map((sim) => ({ sim, persona: byId.get(sim.personaId) }))
    .filter((x): x is { sim: SimulationResult; persona: Persona } => Boolean(x.persona));

  // prefer one of each verdict for a lively, contrasting debate, then fill
  const picked: typeof paired = [];
  for (const v of VERDICT_ORDER) {
    const hit = paired.find((p) => p.sim.verdict === v && !picked.includes(p));
    if (hit) picked.push(hit);
  }
  for (const p of paired) {
    if (picked.length >= 4) break;
    if (!picked.includes(p)) picked.push(p);
  }

  return picked.slice(0, 4).map(({ sim, persona }) => ({
    persona,
    verdict: sim.verdict,
    messages: [
      sim.reasoning,
      sim.topObjection ? `My biggest blocker: ${sim.topObjection}` : "",
    ].filter(Boolean),
  }));
}

const VERDICT_TINT: Record<Verdict, string> = {
  Convert: "#34d399",
  Maybe: "#fbbf24",
  "Churn Risk": "#fb7185",
  Bounce: "#9ca3af",
};

export function ReactionBoard({ personas, sims }: { personas: Persona[]; sims: SimulationResult[] }) {
  const seats = useMemo(() => buildSeats(personas, sims), [personas, sims]);

  return (
    <div className="rounded-2xl glass p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-ghost-violet" />
        <h3 className="text-sm font-bold text-slate-900">Live Reaction Board</h3>
        <span className="text-xs text-slate-800 font-semibold">— 4 ghosts react in real time</span>
      </div>

      {seats.length === 0 ? (
        <div className="grid h-40 place-items-center text-sm text-slate-800 font-semibold">
          Waiting for the first customers to react…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {seats.map((seat) => (
            <ReactionCard key={seat.persona.id} seat={seat} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReactionCard({ seat }: { seat: Seat }) {
  const { persona, verdict, messages } = seat;
  const { shown, current, allDone } = useTypewriter(messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tint = VERDICT_TINT[verdict];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, current]);

  return (
    <div className="flex h-52 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-3 py-2.5">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-base"
          style={{ background: `${persona.accent}26`, boxShadow: `0 0 16px -6px ${persona.accent}` }}
        >
          {persona.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900">{persona.name}</p>
          <p className="truncate text-[10px] text-slate-800 font-semibold">{persona.role}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${tint}1f`, color: tint }}
        >
          {verdict}
        </span>
      </div>

      {/* chat bubbles */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2.5">
        {shown.map((m, i) => (
          <Bubble key={i} accent={persona.accent}>
            {m}
          </Bubble>
        ))}
        {current && (
          <Bubble accent={persona.accent}>
            {current}
            <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-slate-500 align-middle" />
          </Bubble>
        )}
        {!current && !allDone && <TypingDots />}
      </div>
    </div>
  );
}

function Bubble({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="max-w-[92%] rounded-2xl rounded-tl-md px-3 py-2 text-xs leading-snug text-slate-900"
      style={{ background: `${accent}1a`, border: `1px solid ${accent}2e` }}
    >
      {children}
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-slate-400"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

/** Types through a fixed list of messages, char-by-char, queueing sequentially
 *  so a new message never overwrites one mid-animation. */
function useTypewriter(messages: string[], speed = 18, pause = 650) {
  const [shown, setShown] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [done, setDone] = useState(messages.length === 0);
  // stable key so we only restart when the actual content changes
  const key = messages.join("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setShown([]);
    setCurrent("");
    setDone(messages.length === 0);
    let i = 0;
    let c = 0;

    function step() {
      if (cancelled) return;
      if (i >= messages.length) {
        setDone(true);
        return;
      }
      const full = messages[i];
      if (c < full.length) {
        c += 1;
        setCurrent(full.slice(0, c));
        timer = setTimeout(step, speed);
      } else {
        const finished = full;
        setShown((s) => [...s, finished]);
        setCurrent("");
        i += 1;
        c = 0;
        timer = setTimeout(step, pause);
      }
    }
    timer = setTimeout(step, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, speed, pause]);

  return { shown, current, allDone: done };
}
