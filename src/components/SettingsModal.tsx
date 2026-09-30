"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { CloseIcon } from "./icons";

interface TokenRow {
  id: string;
  name: string;
  createdAt: number;
  hint: string;
}

/** API tokens connect the extension, Go helper, and scripts to your vault. */
export function SettingsModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const { user } = useUser();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    const res = await fetch("/api/tokens");
    if (res.ok) setTokens(((await res.json()) as { tokens: TokenRow[] }).tokens);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const create = async (): Promise<void> => {
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "default" }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { token: { token: string } };
    setSecret(data.token.token);
    setName("");
    await load();
  };

  const revoke = async (id: string): Promise<void> => {
    if (!confirm("Revoke this token? Connected tools will stop working.")) return;
    await fetch("/api/tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center">
          <h2 className="text-lg font-bold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          >
            <CloseIcon />
          </button>
        </div>
        <div>
          <h3 className="text-sm font-semibold">API tokens</h3>
          <p className="text-xs text-zinc-500">
            Paste a token into the extension options or use it as <code>VAULT_TOKEN</code> for the Go helper.
          </p>
          {user ? (
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">
              MCP user id (VAULT_USER_ID): {user.id}
            </p>
          ) : null}
        </div>
        {secret ? (
          <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="text-xs font-semibold text-amber-800">Copy now — shown only once:</p>
            <p className="mt-1 break-all font-mono text-xs text-zinc-900">{secret}</p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(secret).catch(() => {})}
              className="mt-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white"
            >
              Copy
            </button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name (e.g. firefox)"
            className="w-full rounded-2xl bg-zinc-100 p-2.5 text-sm outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => create().catch((e) => alert(String(e)))}
            className="shrink-0 rounded-full bg-[#e60023] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c8001e]"
          >
            New token
          </button>
        </div>
        <ul className="space-y-2">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-sm">
              <span className="font-semibold">{t.name}</span>
              <span className="font-mono text-xs text-zinc-500">{t.hint}</span>
              <button
                type="button"
                onClick={() => revoke(t.id).catch((e) => alert(String(e)))}
                className="ml-auto text-xs font-semibold text-red-600 hover:underline"
              >
                Revoke
              </button>
            </li>
          ))}
          {tokens.length === 0 ? (
            <li className="text-xs text-zinc-500">No tokens yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
