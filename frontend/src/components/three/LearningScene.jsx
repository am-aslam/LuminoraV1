import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";

// NOTE: This file intentionally builds the Three.js scene graph with
// React.createElement (aliased `h`) instead of JSX. The platform's visual-edit
// babel plugin injects source-location props (x-line-number, etc.) into JSX
// intrinsics; react-three-fiber then tries to apply those props to Object3D
// instances and throws. Using createElement avoids JSX instrumentation entirely.
const h = React.createElement;

/* ---------------- helpers ---------------- */
const Clickable = ({ children, onClick, ...props }) => {
  const [hover, setHover] = useState(false);
  return h(
    "group",
    {
      onPointerOver: (e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        setHover(false);
        document.body.style.cursor = "auto";
      },
      onClick: (e) => {
        e.stopPropagation();
        onClick && onClick();
      },
      scale: hover ? 1.12 : 1,
      ...props,
    },
    children
  );
};

const sphere = (args, mat) =>
  h("mesh", null, h("sphereGeometry", { args }), h("meshStandardMaterial", mat));

/* ---------------- ATOM ---------------- */
const ElectronShell = ({ radius, speed, color, onSelect }) => {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * speed;
  });
  return h(
    "group",
    { ref },
    h(
      "mesh",
      { rotation: [Math.PI / 2, 0, 0] },
      h("torusGeometry", { args: [radius, 0.012, 16, 100] }),
      h("meshStandardMaterial", { color, emissive: color, emissiveIntensity: 0.6 })
    ),
    h(
      Clickable,
      { position: [radius, 0, 0], onClick: () => onSelect("Electron") },
      sphere([0.12, 24, 24], { color: "#06B6D4", emissive: "#06B6D4", emissiveIntensity: 1.2 })
    )
  );
};

const Atom = ({ onSelect }) =>
  h(
    "group",
    null,
    h(
      Clickable,
      { onClick: () => onSelect("Nucleus") },
      sphere([0.55, 32, 32], { color: "#7C3AED", emissive: "#7C3AED", emissiveIntensity: 0.8, roughness: 0.3 })
    ),
    h(ElectronShell, { radius: 1.6, speed: 0.9, color: "#2563EB", onSelect }),
    h("group", { rotation: [0, 0, Math.PI / 3] }, h(ElectronShell, { radius: 2.1, speed: -0.6, color: "#7C3AED", onSelect })),
    h("group", { rotation: [Math.PI / 3, 0, 0] }, h(ElectronShell, { radius: 2.5, speed: 0.45, color: "#06B6D4", onSelect }))
  );

/* ---------------- SOLAR SYSTEM ---------------- */
const Planet = ({ orbit, size, color, speed, name, onSelect }) => {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * speed;
  });
  return h(
    "group",
    { ref },
    h(
      Clickable,
      { position: [orbit, 0, 0], onClick: () => onSelect(name) },
      sphere([size, 24, 24], { color, emissive: color, emissiveIntensity: 0.35, roughness: 0.6 })
    )
  );
};

const Orbit = ({ radius }) =>
  h(
    "mesh",
    { rotation: [Math.PI / 2, 0, 0] },
    h("torusGeometry", { args: [radius, 0.006, 12, 120] }),
    h("meshBasicMaterial", { color: "#334155", transparent: true, opacity: 0.5 })
  );

const SolarSystem = ({ onSelect }) =>
  h(
    "group",
    { scale: 0.75 },
    h(
      Clickable,
      { onClick: () => onSelect("The Sun") },
      sphere([0.7, 32, 32], { color: "#F59E0B", emissive: "#F59E0B", emissiveIntensity: 1.4 })
    ),
    ...[1.4, 2.0, 2.7, 3.4].map((r) => h(Orbit, { key: r, radius: r })),
    h(Planet, { orbit: 1.4, size: 0.12, color: "#9CA3AF", speed: 1.1, name: "Mercury", onSelect }),
    h(Planet, { orbit: 2.0, size: 0.2, color: "#06B6D4", speed: 0.8, name: "Earth", onSelect }),
    h(Planet, { orbit: 2.7, size: 0.17, color: "#EF4444", speed: 0.6, name: "Mars", onSelect }),
    h(Planet, { orbit: 3.4, size: 0.34, color: "#F59E0B", speed: 0.4, name: "Jupiter", onSelect })
  );

/* ---------------- DNA ---------------- */
const DNA = ({ onSelect }) => {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.4;
  });
  const pairs = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);
  return h(
    "group",
    { ref, scale: 0.9 },
    ...pairs.map((i) => {
      const t = i * 0.5;
      const y = i * 0.32 - 2.5;
      const x = Math.cos(t) * 1.1;
      const z = Math.sin(t) * 1.1;
      return h(
        Clickable,
        { key: i, onClick: () => onSelect("Base Pair") },
        h(
          "group",
          null,
          h("mesh", { position: [x, y, z] }, h("sphereGeometry", { args: [0.16, 20, 20] }), h("meshStandardMaterial", { color: "#2563EB", emissive: "#2563EB", emissiveIntensity: 0.6 })),
          h("mesh", { position: [-x, y, -z] }, h("sphereGeometry", { args: [0.16, 20, 20] }), h("meshStandardMaterial", { color: "#7C3AED", emissive: "#7C3AED", emissiveIntensity: 0.6 })),
          h(
            "mesh",
            { position: [0, y, 0], rotation: [0, -t, Math.PI / 2] },
            h("cylinderGeometry", { args: [0.03, 0.03, 2.2, 8] }),
            h("meshStandardMaterial", { color: "#06B6D4", emissive: "#06B6D4", emissiveIntensity: 0.3, transparent: true, opacity: 0.7 })
          )
        )
      );
    })
  );
};

/* ---------------- HEART ---------------- */
const HeartPart = ({ position, scale, color, name, onSelect }) =>
  h(
    Clickable,
    { position, onClick: () => onSelect(name) },
    h("mesh", { scale }, h("sphereGeometry", { args: [1, 32, 32] }), h("meshStandardMaterial", { color, emissive: color, emissiveIntensity: 0.4, roughness: 0.4 }))
  );

const Heart = ({ onSelect }) =>
  h(
    Float,
    { speed: 1.4, rotationIntensity: 0.4, floatIntensity: 0.6 },
    h(
      "group",
      { scale: 1.1 },
      h(HeartPart, { position: [-0.55, -0.2, 0], scale: [0.9, 1.1, 0.9], color: "#EF4444", name: "Left Ventricle", onSelect }),
      h(HeartPart, { position: [0.55, -0.2, 0], scale: [0.85, 1.0, 0.85], color: "#DC2626", name: "Right Ventricle", onSelect }),
      h(HeartPart, { position: [-0.5, 0.7, 0], scale: [0.55, 0.55, 0.55], color: "#F87171", name: "Left Atrium", onSelect }),
      h(HeartPart, { position: [0.5, 0.7, 0], scale: [0.55, 0.55, 0.55], color: "#F87171", name: "Right Atrium", onSelect }),
      h(
        Clickable,
        { position: [0, 1.2, 0], onClick: () => onSelect("Aorta") },
        h("mesh", { rotation: [0, 0, -0.3] }, h("cylinderGeometry", { args: [0.22, 0.3, 1.1, 24] }), h("meshStandardMaterial", { color: "#FBBF24", emissive: "#F59E0B", emissiveIntensity: 0.3 }))
      )
    )
  );

/* ---------------- MOLECULE (Water) ---------------- */
const Molecule = ({ onSelect }) =>
  h(
    Float,
    { speed: 1.2, rotationIntensity: 0.6, floatIntensity: 0.5 },
    h(
      "group",
      { scale: 1.1 },
      h(
        Clickable,
        { onClick: () => onSelect("Oxygen Atom") },
        sphere([0.6, 32, 32], { color: "#EF4444", emissive: "#EF4444", emissiveIntensity: 0.4, roughness: 0.3 })
      ),
      ...[[-1.1, 0.8, 0], [1.1, 0.8, 0]].map((p, i) =>
        h(
          "group",
          { key: i },
          h(
            Clickable,
            { position: p, onClick: () => onSelect("Hydrogen Atom") },
            sphere([0.34, 28, 28], { color: "#E5E7EB", emissive: "#93C5FD", emissiveIntensity: 0.2 })
          ),
          h(
            "mesh",
            { position: [p[0] / 2, p[1] / 2, 0], rotation: [0, 0, i === 0 ? 0.63 : -0.63] },
            h("cylinderGeometry", { args: [0.08, 0.08, 1.3, 12] }),
            h("meshStandardMaterial", { color: "#64748B" })
          )
        )
      )
    )
  );

/* ---------------- BRAIN ---------------- */
const Brain = ({ onSelect }) =>
  h(
    Float,
    { speed: 1.1, rotationIntensity: 0.5, floatIntensity: 0.5 },
    h(
      Clickable,
      { onClick: () => onSelect("Cerebrum") },
      h("mesh", { scale: [1.3, 1.05, 1.15] }, h("icosahedronGeometry", { args: [1.4, 4] }), h("meshStandardMaterial", { color: "#EC4899", emissive: "#7C3AED", emissiveIntensity: 0.35, wireframe: true, roughness: 0.4 }))
    )
  );

/* ---------------- EARTH ---------------- */
const Earth = ({ onSelect }) => {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.25;
  });
  return h(
    "group",
    { ref },
    h(
      Clickable,
      { onClick: () => onSelect("Earth's Surface") },
      sphere([1.6, 48, 48], { color: "#1D4ED8", emissive: "#0E7490", emissiveIntensity: 0.25, roughness: 0.6 })
    ),
    h("mesh", null, h("sphereGeometry", { args: [1.62, 24, 24] }), h("meshStandardMaterial", { color: "#34D399", emissive: "#10B981", emissiveIntensity: 0.4, wireframe: true, transparent: true, opacity: 0.25 }))
  );
};

/* ---------------- registry ---------------- */
const MODELS = {
  atom: Atom,
  solar_system: SolarSystem,
  dna: DNA,
  heart: Heart,
  molecule: Molecule,
  brain: Brain,
  earth: Earth,
};

export const LearningScene = ({ model = "atom", onSelect = () => {} }) => {
  const Model = MODELS[model] || Atom;
  return h(
    Canvas,
    {
      camera: { position: [0, 0, 6], fov: 45 },
      gl: { alpha: true, antialias: true },
      style: { background: "transparent" },
    },
    h("ambientLight", { intensity: 0.6 }),
    h("pointLight", { position: [5, 5, 5], intensity: 1.2, color: "#93c5fd" }),
    h("pointLight", { position: [-5, -3, -5], intensity: 0.8, color: "#c4b5fd" }),
    h(Suspense, { fallback: null }, h(Model, { onSelect })),
    h(OrbitControls, {
      enablePan: false,
      enableZoom: true,
      minDistance: 3,
      maxDistance: 10,
      autoRotate: true,
      autoRotateSpeed: 0.6,
    })
  );
};

export default LearningScene;
