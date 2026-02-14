export const BUTTON_THEME = {
  solid:
    "bg-linear-to-r from-teal-700 to-cyan-700 text-white transition duration-200 hover:-translate-y-0.5 hover:from-teal-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-cyan-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60",
  solidDisabled:
    "disabled:transform-none disabled:from-slate-300 disabled:to-slate-300 disabled:text-white disabled:opacity-70 disabled:shadow-none disabled:hover:translate-y-0",
  softActive: "border border-teal-100 bg-teal-50 text-teal-800",
  softActiveEmphasis: "border border-cyan-100 bg-cyan-100 text-cyan-900",
} as const;

export const HOMEPAGE_PRIMARY_BUTTON =
  "rounded-full px-7 py-3 text-sm font-semibold tracking-wide shadow-sm";

export const INPUT_THEME = {
  focus:
    "focus:border-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-100",
} as const;
