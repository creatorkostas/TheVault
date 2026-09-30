"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import {
  AudioIcon,
  GearIcon,
  HomeIcon,
  ImageIcon,
  LinkIcon,
  NoteIcon,
  PlayIcon,
  PlusIcon,
  VideoIcon,
} from "./icons";

export type FilterKey =
  | "all"
  | "image"
  | "video"
  | "audio"
  | "note"
  | "links"
  | "youtube";

export const FILTERS: Array<{ key: FilterKey; label: string; Icon: () => React.ReactElement }> = [
  { key: "all", label: "Home", Icon: HomeIcon },
  { key: "image", label: "Images", Icon: ImageIcon },
  { key: "video", label: "Videos", Icon: VideoIcon },
  { key: "audio", label: "Audio", Icon: AudioIcon },
  { key: "note", label: "Notes", Icon: NoteIcon },
  { key: "links", label: "Links", Icon: LinkIcon },
  { key: "youtube", label: "YouTube", Icon: PlayIcon },
];

/** API `type` param for a sidebar filter (links spans bookmark+website). */
export const apiTypeOf = (f: FilterKey): string | undefined =>
  f === "all" ? undefined : f === "links" ? "bookmark" : f;

/** Hide filters whose type(s) are all disabled by server config. */
export const visibleFilters = (
  disabled: string[],
): Array<{ key: FilterKey; label: string; Icon: () => React.ReactElement }> => {
  const off = (t: string): boolean => disabled.includes(t);
  return FILTERS.filter(({ key }) => {
    if (key === "all") return true;
    if (key === "links") return !(off("bookmark") && off("website"));
    return !off(key);
  });
};

export function Sidebar({
  active,
  disabled,
  onSelect,
  onCreate,
  onSettings,
}: {
  active: FilterKey;
  disabled: string[];
  onSelect: (f: FilterKey) => void;
  onCreate: () => void;
  onSettings: () => void;
}): React.ReactElement {
  return (
    <nav className="sticky top-0 flex h-screen w-16 flex-col items-center gap-1 border-r border-[#dac4b1] bg-[#f6f2e8] py-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="Enthymio home" title="Enthymio" className="mb-3 h-10 w-10 rounded-xl shadow" />
      {visibleFilters(disabled).map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          title={label}
          onClick={() => onSelect(key)}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
            active === key ? "bg-[#b5a79b] text-zinc-900" : "text-zinc-600 hover:bg-[#dac4b1]"
          }`}
        >
          <Icon />
        </button>
      ))}
      <button
        type="button"
        title="Create / save new"
        onClick={onCreate}
        className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#ca503d] text-white hover:brightness-90"
      >
        <PlusIcon />
      </button>
      <span className="mt-auto" />
      <Show when="signed-in">
        <button
          type="button"
          title="Settings & API tokens"
          onClick={onSettings}
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 hover:bg-[#dac4b1]"
        >
          <GearIcon />
        </button>
        <span className="flex h-11 w-11 items-center justify-center">
          <UserButton />
        </span>
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            title="Sign in"
            className="rounded-full bg-[#b5a79b] px-3 py-2 text-xs font-semibold text-zinc-900"
          >
            Sign in
          </button>
        </SignInButton>
      </Show>
    </nav>
  );
}
