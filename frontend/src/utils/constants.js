/**
 * Shared constants and utilities for the application
 */

// Status color mappings for consistent styling across components
export const STATUS_COLORS = {
  compliant: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3),0_0_20px_rgba(16,185,129,0.1)]',
    dot: 'bg-emerald-500',
  },
  'at-risk': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3),0_0_20px_rgba(245,158,11,0.1)]',
    dot: 'bg-amber-500',
  },
  'non-compliant': {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.3),0_0_20px_rgba(239,68,68,0.1)]',
    dot: 'bg-red-500',
  },
  pending: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    glow: 'shadow-[0_0_8px_rgba(148,163,184,0.3),0_0_20px_rgba(148,163,184,0.1)]',
    dot: 'bg-slate-500',
  },
  unknown: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    glow: 'shadow-[0_0_8px_rgba(107,114,128,0.3),0_0_20px_rgba(107,114,128,0.1)]',
    dot: 'bg-gray-500',
  },
}

// Get status colors by status key
export const getStatusColors = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.unknown
}

// Compliance score color mapping
export const getScoreColor = (score) => {
  if (score >= 80) return STATUS_COLORS.compliant
  if (score >= 60) return STATUS_COLORS['at-risk']
  return STATUS_COLORS['non-compliant']
}

// Animation easing presets for consistent motion
export const ANIMATION_EASINGS = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  spring: [0.68, -0.55, 0.265, 1.55],
  easeOut: [0.4, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.6, 1],
}

// Common transition durations
export const TRANSITION_DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
}

// Viewport animation settings
export const VIEWPORT_SETTINGS = {
  once: true,
  amount: 0.3,
  margin: '-50px',
}
