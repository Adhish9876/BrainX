'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Research } from '@/lib/types';
import ScrollStack, { ScrollStackItem } from '@/components/ui/ScrollStack';
import TagList from './TagList';

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
    <div className="space-y-16 sm:space-y-24">
      {/* ── 1. Top Section: Research Narrative (Left) + Carousel (Right) ── */}
      <section aria-labelledby="research-hero-heading" className="w-full">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          
          {/* Left Column: Clean Apple Typography & Mission Statement */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center">
            <h1
              id="research-hero-heading"
              className="font-display text-4xl sm:text-5xl lg:text-[3.6rem] font-bold tracking-[-0.035em] text-[#1d1d1f] leading-[1.06]"
            >
              Research :
            </h1>

            <p className="mt-5 text-base sm:text-lg font-normal leading-relaxed text-[#3d3d40]">
              At BrainX Lab, we decode brain dynamics and physiological signals to pioneer non-invasive brain–computer interfaces, real-time closed-loop biofeedback, and affective neuro-technologies.
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Scroll to explore research themes</span>
              <ArrowDown className="h-3.5 w-3.5 animate-bounce text-[#0066cc]" />
            </div>
          </div>

          {/* Right Column: Carousel in an Apple Frosted Glass Stage */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div
              className="relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/90 p-5 sm:p-7 shadow-[0_14px_38px_-12px_rgba(15,23,42,0.09)] backdrop-blur-md"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Carousel Header Nav */}
              {count > 1 && (
                <div className="mb-4 flex items-center justify-end border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="Previous research diagram"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 hover:text-black focus-visible:outline-2 focus-visible:outline-[#0066cc]"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      aria-label="Next research diagram"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 hover:text-black focus-visible:outline-2 focus-visible:outline-[#0066cc]"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              )}

              {/* Diagram Stage */}
              <div className="relative mx-auto flex aspect-[16/8] min-h-[200px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50/70 p-2 sm:min-h-[260px]">
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
              </div>

              {/* Caption */}
              <div className="mt-3.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-[0.82rem]">
                  {currentSlide?.caption}
                </p>

                {/* Indicator dots */}
                <div className="mt-2 flex shrink-0 items-center gap-1.5 sm:mt-0" role="tablist" aria-label="Diagram slides">
                  {slides.map((slide, idx) => {
                    const isActive = idx === safeIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show diagram ${idx + 1}: ${slide.title}`}
                        onClick={() => setActiveIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          isActive
                            ? 'w-6 bg-[#0066cc]'
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. On Scroll: Bottom Section with <ScrollStack /> ── */}
      <section aria-labelledby="core-themes-heading" className="relative pt-4">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#0066cc]">
            Deep Dive
          </span>
          <h2
            id="core-themes-heading"
            className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#1d1d1f]"
          >
            Core Research Domains
          </h2>
          <p className="mt-2.5 max-w-xl text-sm sm:text-base text-slate-600">
            Scroll down to review the neural decoding pipelines, biosignal architectures, and clinical applications developed in our laboratory.
          </p>
        </div>

        <ScrollStack
          useWindowScroll={true}
          itemDistance={90}
          itemStackDistance={24}
          stackPosition="14%"
          itemScale={0.04}
          baseScale={0.86}
          dimAmount={0.16}
          smoothScroll={false}
          className="pb-16"
        >
          {slides.map((item, index) => {
            const description = cleanDescription(item.caption);
            const origItem = research[index];
            const tags = cleanTags(origItem?.tags ?? ['Neural Systems', 'EEG']);

            return (
              <ScrollStackItem
                key={item.id}
                itemClassName="border border-slate-200/90 bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-9 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.12)] min-h-[22rem]"
              >
                <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
                  {/* Left Column: Details */}
                  <div className="min-w-0 flex-1 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066cc]/10 font-mono text-xs font-bold text-[#0066cc]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Domain {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="mt-3 font-sans text-xl sm:text-2xl lg:text-[1.75rem] font-semibold leading-snug tracking-tight text-[#1d1d1f]">
                      {item.title}
                    </h3>

                    <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-700">
                      {description}
                    </p>

                    <div className="mt-5">
                      <TagList tags={tags} />
                    </div>
                  </div>

                  {/* Right Column: Visual Diagram Preview */}
                  <div className="lg:col-span-5">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-2xs">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ScientificPipelineSvg variant={item.diagramIndex} />
                      )}
                    </div>
                  </div>
                </div>
              </ScrollStackItem>
            );
          })}
        </ScrollStack>
      </section>
    </div>
  );
}
