"use client";

import { motion } from "framer-motion";
import type { Persona, SimulationResult } from "@/lib/types";
import { verdictColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/shared/score-bar";
import { PersonaGlyph } from "@/components/shared/persona-glyph";

export function PersonaCard({
  persona,
  sim,
  index = 0,
}: {
  persona: Persona;
  sim?: SimulationResult;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.015, 0.4) }}
      className="group relative overflow-hidden rounded-2xl glass p-4"
      style={{ boxShadow: `0 0 0 1px ${persona.accent}22, 0 18px 40px -24px ${persona.accent}` }}
    >
      <div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70"
        style={{ background: persona.accent }}
      />
      <div className="relative flex items-start gap-3">
        <PersonaGlyph name={persona.name} accent={persona.accent} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{persona.name}</p>
            {sim && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: `${verdictColor(sim.verdict)}22`, color: verdictColor(sim.verdict) }}
              >
                {sim.verdict}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {persona.emoji} {persona.role}
          </p>
        </div>
      </div>

      <p className="relative mt-3 line-clamp-2 text-xs italic text-slate-500">“{persona.quote}”</p>

      {sim ? (
        <div className="relative mt-3 space-y-2">
          <ScoreBar label="Purchase intent" value={sim.purchaseProbability} color={persona.accent} />
          <ScoreBar label="Confusion" value={sim.confusionScore} color="#6f6f77" invert />
        </div>
      ) : (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          <Badge variant="muted">{persona.budgetSensitivity} budget</Badge>
          <Badge variant="muted">{persona.technicalSkill} tech</Badge>
        </div>
      )}
    </motion.div>
  );
}
