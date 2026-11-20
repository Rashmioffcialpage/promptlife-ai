"use client";

import type { PointerEvent } from "react";

function tilt(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
  const target = event.currentTarget;
  const bounds = target.getBoundingClientRect();
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  const x = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1);
  const y = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1);
  // Reserve room for the idle sway so the combined tilt stays within five degrees.
  target.style.setProperty("--mascot-pitch", `${-y * 4}deg`);
  target.style.setProperty("--mascot-yaw", `${x * 3}deg`);
}

function center(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty("--mascot-pitch");
  event.currentTarget.style.removeProperty("--mascot-yaw");
}

export function AuthMascot() {
  return <div className="auth-mascot" onPointerMove={tilt} onPointerLeave={center} onPointerCancel={center}>
    <span className="auth-mascot-shadow" aria-hidden="true" />
    <div className="auth-mascot-tilt">
      <picture className="auth-mascot-float">
        <source srcSet="/student-help-mascot-auth.webp" type="image/webp" />
        <img src="/student-help-mascot-3d.png" alt="PromptLife study helper with an Imagine! speech cloud" width={1254} height={1254} loading="lazy" decoding="async" />
      </picture>
    </div>
  </div>;
}
