'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import type { Research } from '@/lib/types';

interface DiagramSlide {
  id: string;
  title: string;
  caption: string;
  image?: string;
  diagramIndex: number;
}

function cleanDescription(text: string): string {
  return text.replace(/^\[Placeholder research theme\]\s*/i, '').trim();
}

function cleanTags(tags: string[]): string[] {
  const filtered = tags.filter((t) => t.toLowerCase() !== 'placeholder');
  return filtered.length > 0 ? filtered : tags;
}

/**
 * Publication-style scientific workflow block diagrams (matching the reference
 * carousel diagram style) used whenever a research entry does not have a custom
 * uploaded raster image yet.
 */
function ScientificPipelineSvg({ variant }: { variant: number }) {
  const v = variant % 4;

  if (v === 0) {
    // Variant 0: Medical / Neural Imaging & Classification Pipeline (mirrors the reference diagram)
    return (
      <svg
        viewBox="0 0 920 380"
        className="h-full w-full select-none"
        role="img"
        aria-label="Biosignal and neuroimaging preprocessing, feature extraction, classification, and deployment workflow"
      >
        <defs>
          <marker id="arrow-v0" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Input stack: EEG / CXR / CT */}
        <g transform="translate(36, 52)">
          <rect x="0" y="0" width="66" height="76" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          <rect x="10" y="10" width="66" height="76" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          <rect x="20" y="20" width="66" height="76" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          <text x="53" y="54" textAnchor="middle" className="fill-slate-800 text-[13px] font-semibold">
            EEG /
          </text>
          <text x="53" y="72" textAnchor="middle" className="fill-slate-800 text-[13px] font-semibold">
            fMRI
          </text>
        </g>

        {/* Arrow: Input -> Preprocessing */}
        <line x1="126" y1="100" x2="168" y2="100" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow-v0)" />

        {/* Preprocessing group box */}
        <g transform="translate(172, 24)">
          <rect x="0" y="0" width="380" height="148" rx="18" fill="#ffffff" stroke="#64748b" strokeWidth="1.6" />

          {/* Sub-step 1: Signal Reshape / Epoching */}
          <g transform="translate(24, 22)">
            <rect x="0" y="0" width="68" height="58" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
            <rect x="3" y="26" width="32" height="29" fill="none" stroke="#64748b" strokeWidth="1.3" strokeDasharray="3 2" />
            <line x1="56" y1="10" x2="40" y2="24" stroke="#334155" strokeWidth="1.5" />
            <polyline points="47,24 40,24 40,17" fill="none" stroke="#334155" strokeWidth="1.5" />
            <text x="34" y="78" textAnchor="middle" className="fill-slate-800 text-[12px]">
              Signal
            </text>
            <text x="34" y="94" textAnchor="middle" className="fill-slate-800 text-[12px]">
              Epoching
            </text>
          </g>

          {/* Sub-step 2: Normalization & Artifact Filtering */}
          <g transform="translate(124, 24)">
            <rect x="6" y="2" width="76" height="54" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
            <polygon points="18,38 28,20 38,38" fill="none" stroke="#84cc16" strokeWidth="1.5" />
            <circle cx="54" cy="20" r="4" fill="#84cc16" />
            <circle cx="66" cy="28" r="4" fill="#84cc16" />
            <circle cx="54" cy="36" r="4" fill="#84cc16" />
            <line x1="38" y1="29" x2="50" y2="21" stroke="#84cc16" strokeWidth="1.2" />
            <line x1="38" y1="29" x2="62" y2="28" stroke="#84cc16" strokeWidth="1.2" />
            <line x1="38" y1="29" x2="50" y2="35" stroke="#84cc16" strokeWidth="1.2" />
            <text x="44" y="78" textAnchor="middle" className="fill-slate-800 text-[12px]">
              Artifact ICA &amp;
            </text>
            <text x="44" y="94" textAnchor="middle" className="fill-slate-800 text-[12px]">
              Normalization
            </text>
          </g>

          {/* Sub-step 3: Spectral / U-Net Segmentation */}
          <g transform="translate(230, 18)">
            <rect x="0" y="0" width="128" height="72" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
            {/* Encoder-decoder bars */}
            <rect x="12" y="12" width="10" height="48" fill="#fed7aa" stroke="#fb923c" strokeWidth="1" />
            <rect x="26" y="20" width="10" height="36" fill="#fed7aa" stroke="#fb923c" strokeWidth="1" />
            <rect x="40" y="28" width="10" height="24" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
            <rect x="56" y="34" width="16" height="16" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1" />
            <rect x="78" y="28" width="10" height="24" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
            <rect x="92" y="20" width="10" height="36" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1" />
            <rect x="106" y="12" width="10" height="48" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            <line x1="22" y1="16" x2="106" y2="16" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="36" y1="26" x2="92" y2="26" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
            <text x="64" y="90" textAnchor="middle" className="fill-slate-800 text-[12px]">
              Spectral-Spatial
            </text>
            <text x="64" y="105" textAnchor="middle" className="fill-slate-800 text-[12px]">
              Decomposition
            </text>
          </g>

          <text x="190" y="168" textAnchor="middle" className="fill-slate-900 text-[13.5px] font-semibold">
            Preprocessing
          </text>
        </g>

        {/* Arrow: Preprocessing -> Feature Extraction */}
        <line x1="552" y1="98" x2="598" y2="98" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow-v0)" />

        {/* Feature Extraction box */}
        <g transform="translate(604, 24)">
          <rect x="0" y="0" width="174" height="148" rx="18" fill="#ffffff" stroke="#64748b" strokeWidth="1.6" />
          {/* 3D convolutional feature maps */}
          <polygon points="34,26 56,14 56,118 34,106" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <polygon points="68,32 88,22 88,112 68,102" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <polygon points="100,38 118,30 118,106 100,96" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <polygon points="130,44 144,38 144,98 130,90" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <text x="87" y="168" textAnchor="middle" className="fill-slate-900 text-[13.5px] font-semibold">
            Feature Extraction
          </text>
        </g>

        {/* Turn-around connector: Feature Extraction -> Classification */}
        <path
          d="M 778 98 L 812 98 Q 824 98 824 110 L 824 252 Q 824 264 812 264 L 784 264"
          fill="none"
          stroke="#64748b"
          strokeWidth="1.6"
          markerEnd="url(#arrow-v0)"
        />

        {/* Classification (Neural Decoder / OELM) box */}
        <g transform="translate(604, 200)">
          <rect x="0" y="0" width="174" height="136" rx="18" fill="#ffffff" stroke="#64748b" strokeWidth="1.6" />
          {/* Dense neural network graph */}
          {[42, 68, 94].map((y1, i) =>
            [22, 40, 58, 76, 94, 112].map((y2, j) => (
              <line key={`l1-${i}-${j}`} x1="34" y1={y1} x2="88" y2={y2} stroke="#475569" strokeWidth="0.9" opacity="0.65" />
            ))
          )}
          {[22, 40, 58, 76, 94, 112].map((y1, i) =>
            [32, 52, 72, 92, 108].map((y2, j) => (
              <line key={`l2-${i}-${j}`} x1="88" y1={y1} x2="140" y2={y2} stroke="#475569" strokeWidth="0.9" opacity="0.65" />
            ))
          )}
          {[42, 68, 94].map((y, i) => (
            <circle key={`n1-${i}`} cx="34" cy={y} r="3.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.4" />
          ))}
          {[22, 40, 58, 76, 94, 112].map((y, i) => (
            <circle key={`n2-${i}`} cx="88" cy={y} r="3.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.4" />
          ))}
          {[32, 52, 72, 92, 108].map((y, i) => (
            <circle key={`n3-${i}`} cx="140" cy={y} r="3.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.4" />
          ))}
          <text x="87" y="156" textAnchor="middle" className="fill-slate-900 text-[13.5px] font-semibold">
            Neural Classification
          </text>
        </g>

        {/* Arrow: Classification -> Deployment */}
        <line x1="604" y1="268" x2="496" y2="268" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow-v0)" />
        <text x="550" y="256" textAnchor="middle" className="fill-slate-700 text-[11.5px]">
          Decoded
        </text>
        <text x="550" y="284" textAnchor="middle" className="fill-slate-700 text-[11.5px]">
          Intent
        </text>

        {/* Deployment / User Interface box */}
        <g transform="translate(332, 200)">
          <rect x="0" y="0" width="160" height="136" rx="18" fill="#ffffff" stroke="#64748b" strokeWidth="1.6" />
          {/* Mobile + Desktop icons */}
          <rect x="30" y="26" width="32" height="56" rx="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="46" cy="75" r="2" fill="#0f172a" />
          <rect x="78" y="28" width="54" height="38" rx="3" fill="#0f172a" />
          <rect x="83" y="33" width="44" height="26" fill="#ffffff" />
          <rect x="98" y="68" width="14" height="8" fill="#0f172a" />
          <rect x="90" y="76" width="30" height="3" fill="#0f172a" />
          <text x="80" y="108" textAnchor="middle" className="fill-slate-800 text-[12px]">
            BCI Interface
          </text>
          <text x="80" y="156" textAnchor="middle" className="fill-slate-900 text-[13.5px] font-semibold">
            Deployment
          </text>
        </g>

        {/* Arrow: Deployment -> User */}
        <line x1="332" y1="268" x2="226" y2="268" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#arrow-v0)" />
        <text x="279" y="262" textAnchor="middle" className="fill-slate-700 text-[11.5px]">
          Feedback
        </text>

        {/* User / Clinician box */}
        <g transform="translate(104, 204)">
          <rect x="0" y="0" width="118" height="128" rx="18" fill="#ffffff" stroke="#64748b" strokeWidth="1.6" />
          <circle cx="42" cy="44" r="12" fill="#0f172a" />
          <path d="M 22 86 C 22 64 62 64 62 86 Z" fill="#0f172a" />
          <circle cx="82" cy="36" r="8" fill="#0f172a" />
          <rect x="68" y="48" width="28" height="24" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <line x1="76" y1="72" x2="76" y2="90" stroke="#0f172a" strokeWidth="3" />
          <line x1="88" y1="72" x2="88" y2="90" stroke="#0f172a" strokeWidth="3" />
          <text x="59" y="114" textAnchor="middle" className="fill-slate-800 text-[12px] font-medium">
            User / Subject
          </text>
        </g>
      </svg>
    );
  }

  if (v === 1) {
    // Variant 1: EEG Affective Computing & Spectral Band Analysis
    return (
      <svg
        viewBox="0 0 920 380"
        className="h-full w-full select-none"
        role="img"
        aria-label="EEG affective computing and spectral band analysis pipeline"
      >
        <defs>
          <marker id="arrow-v1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#1e96f0" />
          </marker>
        </defs>

        {/* Step 1: Multi-channel EEG Recording */}
        <g transform="translate(36, 48)">
          <rect x="0" y="0" width="166" height="270" rx="16" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="83" cy="78" r="42" fill="#ffffff" stroke="#1e96f0" strokeWidth="2" />
          {/* 10-20 electrode nodes */}
          {[
            [68, 56],
            [98, 56],
            [58, 78],
            [83, 78],
            [108, 78],
            [68, 100],
            [98, 100],
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="4.5" fill="#1e96f0" />
          ))}
          {/* Waveforms */}
          <path d="M 28 156 Q 42 142 56 156 T 84 156 T 112 156 T 140 156" fill="none" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 28 182 Q 42 194 56 182 T 84 182 T 112 182 T 140 182" fill="none" stroke="#1e96f0" strokeWidth="1.5" />
          <path d="M 28 208 Q 42 196 56 208 T 84 208 T 112 208 T 140 208" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <text x="83" y="242" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
            Multi-Channel EEG
          </text>
          <text x="83" y="258" textAnchor="middle" className="fill-slate-500 text-[11px]">
            Non-Invasive Acquisition
          </text>
        </g>

        <line x1="202" y1="184" x2="246" y2="184" stroke="#1e96f0" strokeWidth="1.8" markerEnd="url(#arrow-v1)" />

        {/* Step 2: Spectral Band Decomposition */}
        <g transform="translate(252, 48)">
          <rect x="0" y="0" width="206" height="270" rx="16" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          {[
            { label: 'Delta (0.5–4 Hz)', y: 30, color: '#93c5fd' },
            { label: 'Theta (4–8 Hz)', y: 74, color: '#60a5fa' },
            { label: 'Alpha (8–13 Hz)', y: 118, color: '#3b82f6' },
            { label: 'Beta (13–30 Hz)', y: 162, color: '#1e96f0' },
            { label: 'Gamma (>30 Hz)', y: 206, color: '#1d4ed8' },
          ].map((band) => (
            <g key={band.label} transform={`translate(20, ${band.y})`}>
              <rect x="0" y="0" width="166" height="32" rx="6" fill="#f8fafc" stroke={band.color} strokeWidth="1.4" />
              <text x="83" y="20" textAnchor="middle" className="fill-slate-800 text-[11.5px] font-medium">
                {band.label}
              </text>
            </g>
          ))}
          <text x="103" y="256" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
            Spectral Decomposition
          </text>
        </g>

        <line x1="458" y1="184" x2="502" y2="184" stroke="#1e96f0" strokeWidth="1.8" markerEnd="url(#arrow-v1)" />

        {/* Step 3: CSP-TP & Deep Representation Learning */}
        <g transform="translate(508, 48)">
          <rect x="0" y="0" width="186" height="270" rx="16" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="26" y="34" width="134" height="52" rx="8" fill="#eff6ff" stroke="#1e96f0" strokeWidth="1.4" />
          <text x="93" y="56" textAnchor="middle" className="fill-slate-800 text-[12px] font-semibold">
            CSP-TP Fusion
          </text>
          <text x="93" y="72" textAnchor="middle" className="fill-slate-500 text-[10.5px]">
            Spatial-Temporal Features
          </text>

          <rect x="26" y="106" width="134" height="52" rx="8" fill="#f8fafc" stroke="#64748b" strokeWidth="1.4" />
          <text x="93" y="128" textAnchor="middle" className="fill-slate-800 text-[12px] font-semibold">
            Attention / GNN
          </text>
          <text x="93" y="144" textAnchor="middle" className="fill-slate-500 text-[10.5px]">
            Cross-Subject Alignment
          </text>

          <rect x="26" y="178" width="134" height="44" rx="8" fill="#eff6ff" stroke="#1e96f0" strokeWidth="1.4" />
          <text x="93" y="204" textAnchor="middle" className="fill-slate-800 text-[12px] font-semibold">
            Latent Embedding
          </text>

          <text x="93" y="256" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
            Feature Fusion &amp; ML
          </text>
        </g>

        <line x1="694" y1="184" x2="738" y2="184" stroke="#1e96f0" strokeWidth="1.8" markerEnd="url(#arrow-v1)" />

        {/* Step 4: Affective State & Cognitive Output */}
        <g transform="translate(744, 48)">
          <rect x="0" y="0" width="140" height="270" rx="16" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="70" cy="86" r="36" fill="#ffffff" stroke="#1e96f0" strokeWidth="1.8" />
          <line x1="34" y1="86" x2="106" y2="86" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="70" y1="50" x2="70" y2="122" stroke="#94a3b8" strokeWidth="1.2" />
          <circle cx="84" cy="70" r="6" fill="#1e96f0" />
          <text x="70" y="144" textAnchor="middle" className="fill-slate-700 text-[11px] font-medium">
            Valence – Arousal
          </text>
          <rect x="20" y="168" width="100" height="46" rx="8" fill="#ffffff" stroke="#334155" strokeWidth="1.4" />
          <text x="70" y="188" textAnchor="middle" className="fill-slate-800 text-[11.5px] font-semibold">
            Affective &amp;
          </text>
          <text x="70" y="204" textAnchor="middle" className="fill-slate-800 text-[11.5px] font-semibold">
            Trait Profile
          </text>
          <text x="70" y="256" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
            Inference
          </text>
        </g>
      </svg>
    );
  }

  // Variant 2 & 3: Closed-Loop Immersive VR & Biofeedback Intervention Loop
  return (
    <svg
      viewBox="0 0 920 380"
      className="h-full w-full select-none"
      role="img"
      aria-label="Closed-loop immersive VR and biofeedback architecture for mental health intervention"
    >
      <defs>
        <marker id="arrow-v2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#334155" />
        </marker>
      </defs>

      {/* Top row: VR Stimulus -> Physiological Sensing -> Neural State Decoder */}
      <g transform="translate(56, 36)">
        <rect x="0" y="0" width="220" height="124" rx="16" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
        <rect x="24" y="24" width="64" height="40" rx="8" fill="#eff6ff" stroke="#1e96f0" strokeWidth="1.8" />
        <text x="56" y="49" textAnchor="middle" className="fill-[#1e96f0] text-[13px] font-bold">
          VR / XR
        </text>
        <text x="148" y="42" textAnchor="middle" className="fill-slate-800 text-[12.5px] font-semibold">
          Immersive
        </text>
        <text x="148" y="60" textAnchor="middle" className="fill-slate-800 text-[12.5px] font-semibold">
          Environment
        </text>
        <text x="110" y="102" textAnchor="middle" className="fill-slate-500 text-[11.5px]">
          Adaptive Therapeutic Stimuli
        </text>
      </g>

      <line x1="276" y1="98" x2="344" y2="98" stroke="#334155" strokeWidth="1.6" markerEnd="url(#arrow-v2)" />

      <g transform="translate(350, 36)">
        <rect x="0" y="0" width="220" height="124" rx="16" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
        <path d="M 32 52 L 58 52 L 68 30 L 80 74 L 92 42 L 102 58 L 124 52 L 188 52" fill="none" stroke="#1e96f0" strokeWidth="2" />
        <text x="110" y="96" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
          Biosignal Acquisition
        </text>
        <text x="110" y="112" textAnchor="middle" className="fill-slate-500 text-[11px]">
          EEG · HRV · EDA · Eye Tracking
        </text>
      </g>

      <line x1="570" y1="98" x2="638" y2="98" stroke="#334155" strokeWidth="1.6" markerEnd="url(#arrow-v2)" />

      <g transform="translate(644, 36)">
        <rect x="0" y="0" width="220" height="124" rx="16" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
        <rect x="28" y="24" width="164" height="44" rx="8" fill="#f8fafc" stroke="#64748b" strokeWidth="1.4" />
        <text x="110" y="51" textAnchor="middle" className="fill-slate-800 text-[12.5px] font-semibold">
          Stress &amp; Cognitive Load
        </text>
        <text x="110" y="100" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">
          Real-Time State Estimator
        </text>
      </g>

      {/* Downward arrow on right */}
      <line x1="754" y1="160" x2="754" y2="216" stroke="#334155" strokeWidth="1.6" markerEnd="url(#arrow-v2)" />

      {/* Bottom feedback loop */}
      <g transform="translate(500, 222)">
        <rect x="0" y="0" width="364" height="114" rx="16" fill="#eff6ff" stroke="#1e96f0" strokeWidth="1.6" />
        <text x="182" y="48" textAnchor="middle" className="fill-slate-900 text-[14px] font-semibold">
          Closed-Loop Biofeedback Controller
        </text>
        <text x="182" y="72" textAnchor="middle" className="fill-slate-600 text-[12px]">
          Modulates acoustic, visual, and respiratory pacing cues
        </text>
        <text x="182" y="92" textAnchor="middle" className="fill-[#1e96f0] text-[11.5px] font-medium">
          Human-Centred Neuro-Adaptive Intervention
        </text>
      </g>

      {/* Return path to VR Stimulus */}
      <path
        d="M 500 279 L 166 279 L 166 168"
        fill="none"
        stroke="#334155"
        strokeWidth="1.6"
        markerEnd="url(#arrow-v2)"
      />
      <text x="330" y="268" textAnchor="middle" className="fill-slate-700 text-[12px] font-medium">
        Real-Time Scene Adaptation
      </text>
    </svg>
  );
}

const CARD_TINTS = [
  'from-sky-100 via-sky-50 to-white',
  'from-orange-100 via-orange-50 to-white',
  'from-indigo-100 via-indigo-50 to-white',
  'from-teal-100 via-teal-50 to-white',
];

export default function ResearchShowcase({ research }: { research: Research[] }) {
  const slides: DiagramSlide[] =
    research.length > 0
      ? research.map((item, idx) => ({
          id: item.id,
          title: item.title,
          caption: cleanDescription(item.description),
          image: item.image || undefined,
          diagramIndex: idx,
        }))
      : [
          {
            id: 'default-1',
            title: 'Brain–Computer Interfaces',
            caption: 'Decoding imagined speech and motor intent from non-invasive brain signals.',
            diagramIndex: 0,
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused, count]);

  const currentSlide = slides[safeIndex];

  return (
    <div className="relative isolate bg-white">
      {/* ── 1. HERO: mission statement + live diagram carousel ───────────── */}
      <section
        aria-labelledby="research-hero-heading"
        className="relative isolate -mt-22 overflow-hidden pt-22 md:-mt-24 md:pt-24"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/leftbg.png"
            alt=""
            draggable={false}
            className="h-full w-full object-cover object-left opacity-70"
          />
          <div className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="shell pb-16 pt-8 sm:pt-12 md:pb-20 md:pt-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left: heading + mission */}
            <div className="flex flex-col justify-center lg:col-span-5">
              <Reveal>
                <h1
                  id="research-hero-heading"
                  className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#1d1d1f] sm:text-6xl lg:text-7xl"
                >
                  Research.
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-[#424245] sm:text-lg">
                  At BrainX Lab, we decode brain dynamics and physiological signals to pioneer
                  non-invasive brain–computer interfaces, real-time closed-loop biofeedback, and
                  affective neuro-technologies.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <a
                  href="#core-themes-heading"
                  className="group mt-8 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-black hover:shadow-lg"
                >
                  Explore research themes
                  <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </a>
              </Reveal>
            </div>

            {/* Right: diagram carousel */}
            <Reveal delay={0.15} className="lg:col-span-7">
              <div
                className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_2px_4px_rgba(11,16,32,0.04),0_36px_80px_-30px_rgba(11,16,32,0.35)] backdrop-blur-xl sm:p-5"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <p className="min-w-0 truncate font-display text-sm font-bold tracking-tight text-[#1d1d1f] sm:text-base">
                    {currentSlide?.title}
                  </p>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs font-bold text-slate-600">
                    {String(safeIndex + 1).padStart(2, '0')}
                    <span className="text-slate-400"> / {String(count).padStart(2, '0')}</span>
                  </span>
                </div>

                <div className="relative mx-auto flex aspect-[16/8] min-h-[200px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-2 sm:min-h-[260px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={currentSlide?.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="flex h-full w-full items-center justify-center"
                    >
                      {currentSlide?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentSlide.image}
                          alt={currentSlide.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <ScientificPipelineSvg variant={currentSlide?.diagramIndex ?? 0} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-[0.82rem]">
                    {currentSlide?.caption}
                  </p>

                  <div className="flex shrink-0 items-center gap-3">
                    {count > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={prev}
                          aria-label="Previous research diagram"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={next}
                          aria-label="Next research diagram"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5" role="tablist" aria-label="Diagram slides">
                      {slides.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          role="tab"
                          aria-selected={idx === safeIndex}
                          aria-label={`Show diagram ${idx + 1}: ${slide.title}`}
                          onClick={() => setActiveIndex(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === safeIndex ? 'w-6 bg-[#1d1d1f]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 2. CORE RESEARCH DOMAINS: editorial rows, alternating sides ───── */}
      <section aria-labelledby="core-themes-heading" className="shell scroll-mt-28 pb-16 md:pb-20">
        <Reveal>
          <div className="flex items-end justify-between gap-4 border-b border-slate-300/80 pb-5">
            <h2
              id="core-themes-heading"
              className="font-display text-3xl font-extrabold tracking-tight text-[#1d1d1f] sm:text-4xl"
            >
              Core research domains
            </h2>
            <span className="mb-1 font-mono text-xs font-bold tracking-[0.16em] text-slate-500">
              {String(slides.length).padStart(2, '0')} AREAS
            </span>
          </div>
        </Reveal>

        <ol>
          {slides.map((item, index) => {
            const description = cleanDescription(item.caption);
            const tags = cleanTags(research[index]?.tags ?? []).slice(0, 4);
            const flip = index % 2 === 1;

            return (
              <li key={item.id} className="border-b border-slate-300/80">
                <Reveal y={18}>
                  <article className="grid items-center gap-8 py-12 md:grid-cols-12 md:gap-14 md:py-16">
                    {/* Diagram, drawn straight on the page with a soft tint behind it */}
                    <div className={`relative md:col-span-6 ${flip ? 'md:order-2' : ''}`}>
                      <div
                        aria-hidden="true"
                        className={`absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br ${CARD_TINTS[index % CARD_TINTS.length]} opacity-80 blur-2xl`}
                      />
                      <div className="aspect-[16/10] w-full">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.title} className="h-full w-full object-contain" />
                        ) : (
                          <ScientificPipelineSvg variant={item.diagramIndex} />
                        )}
                      </div>
                    </div>

                    {/* Text */}
                    <div className={`relative md:col-span-6 ${flip ? 'md:order-1' : ''}`}>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-10 left-0 select-none font-display text-[7rem] font-extrabold leading-none tracking-tighter text-slate-900/[0.06] md:-top-14 md:text-[9rem]"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="relative font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-[#1d1d1f] sm:text-4xl">
                        {item.title}
                      </h3>
                      <p className="relative mt-5 max-w-xl text-base leading-relaxed text-[#424245]">
                        {description}
                      </p>
                      {tags.length > 0 ? (
                        <p className="relative mt-5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {tags.join('  ·  ')}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
