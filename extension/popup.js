/* Popup: prefill from active tab, send save via background. */
const $ = (id) => document.getElementById(id);
const isYouTube = (url) =>
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(url || "");

const vaultBase = async () => {
  const { enthymioUrl } = await browser.storage.sync.get("enthymioUrl");
  return (enthymioUrl || "http://localhost:3000").replace(/\/$/, "");
};

const init = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    $("title").value = tab.title || "";
    $("url").value = tab.url || "";
    $("type").value = "auto";
  }
  try {
    const base = await vaultBase();
    const cfg = await (await fetch(`${base}/api/config`)).json();
    for (const opt of [...$("type").options]) {
      if (opt.value !== "auto" && (cfg.disabledTypes || []).includes(opt.value)) opt.remove();
    }
  } catch {
    /* vault offline — leave all options, server will validate */
  }
  $("save").addEventListener("click", async () => {
    const url = $("url").value.trim();
    let type = $("type").value;
    if (type === "auto") type = isYouTube(url) ? "youtube" : "website";
    $("status").textContent = "Saving…";
    const res = await browser.runtime.sendMessage({
      action: "save-item",
      item: {
        type,
        title: $("title").value.trim() || url,
        url: url || null,
        content: $("content").value.trim() || null,
        tags: $("tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        collection: $("collection").value.trim() || null,
      },
    });
    $("status").textContent = res.ok ? "Saved — you can close this" : `Failed: ${res.error}`;
  });
};

document.addEventListener("DOMContentLoaded", init);
