"use client";

import React from "react";

/**
 * Error boundary that contains failures in decorative/heavy client subtrees
 * (e.g. WebGL/OGL auroras). If the child throws during render/effect, we render
 * the fallback (default: nothing) instead of crashing the whole page. When the
 * child works normally, this is fully transparent — nothing about the design changes.
 */
export class SafeMount extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[SafeMount] contained error:", (err as Error)?.message);
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
