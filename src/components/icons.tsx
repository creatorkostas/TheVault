const P = "none";
const svgProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: P,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const HomeIcon = (): React.ReactElement => (
  <svg {...svgProps}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
);

export const ImageIcon = (): React.ReactElement => (
  <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L6 21" /></svg>
);

export const VideoIcon = (): React.ReactElement => (
  <svg {...svgProps}><rect x="2" y="5" width="14" height="14" rx="3" /><path d="m16 10 6-3v10l-6-3" /></svg>
);

export const AudioIcon = (): React.ReactElement => (
  <svg {...svgProps}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
);

export const NoteIcon = (): React.ReactElement => (
  <svg {...svgProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);

export const LinkIcon = (): React.ReactElement => (
  <svg {...svgProps}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
);

export const PlayIcon = (): React.ReactElement => (
  <svg {...svgProps}><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4Z" /></svg>
);

export const PlusIcon = (): React.ReactElement => (
  <svg {...svgProps}><path d="M12 5v14M5 12h14" /></svg>
);

export const CloseIcon = (): React.ReactElement => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M3 3l10 10M13 3 3 13" />
  </svg>
);

export const MicIcon = (): React.ReactElement => (
  <svg {...svgProps}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 19v3" /></svg>
);

export const StopIcon = (): React.ReactElement => (
  <svg {...svgProps}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
);

export const PlayTriangle = (): React.ReactElement => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7Z" />
  </svg>
);

export const GearIcon = (): React.ReactElement => (
  <svg {...svgProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
);

export const SearchIcon = (): React.ReactElement => (
  <svg {...svgProps}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
