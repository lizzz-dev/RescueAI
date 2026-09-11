import React, { useCallback, useMemo } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 35, density: { enable: true, area: 1200 } },
      color: { value: "#6384ff" },
      opacity: { value: { min: 0.05, max: 0.15 } },
      size: { value: { min: 1, max: 2.5 } },
      move: {
        enable: true,
        speed: 0.3,
        direction: "none",
        random: true,
        straight: false,
        outModes: "out",
      },
      links: {
        enable: true,
        distance: 160,
        color: "#6384ff",
        opacity: 0.06,
        width: 1,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "grab" },
      },
      modes: {
        grab: { distance: 140, links: { opacity: 0.12 } },
      },
    },
    detectRetina: true,
  }), []);

  return (
    <div className="particle-bg">
      <Particles id="rescue-particles" init={particlesInit} options={options} />
    </div>
  );
}
