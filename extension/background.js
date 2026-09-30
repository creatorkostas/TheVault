/* Enthymio Clipper — background (Firefox/Zen, MV2). Uses `browser` namespace. */

const DEFAULT_ENTHYMIO_URL = "http://localhost:3000";

const getEnthymioUrl = async () => {
  const { enthymioUrl } = await browser.storage.sync.get("enthymioUrl");
  return (enthymioUrl || DEFAULT_ENTHYMIO_URL).replace(/\/$/, "");
};

const authHeaders = async () => {
  const headers = { "Content-Type": "application/json" };
  const { apiToken } = await browser.storage.sync.get("apiToken");
  if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;
  return headers;
};

const postItem = async (input) => {
  const base = await getEnthymioUrl();
  const res = await fetch(`${base}/api/items`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("not authorized — save your API token in the add-on preferences");
  if (!res.ok) throw new Error(`vault responded ${res.status}`);
  return res.json();
};

const notify = (title, message) =>
  browser.notifications
    .create({ type: "basic", iconUrl: "icons/icon.svg", title, message })
    .catch(() => {});

const isYouTube = (url) => /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(url || "");

const saveCurrentTab = async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) throw new Error("no active tab");
  return postItem({
    type: isYouTube(tab.url) ? "youtube" : "website",
    title: tab.title || tab.url,
    url: tab.url,
    tags: ["clipped"],
  });
};

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "enthymio-save-page",
    title: "Save page to Enthymio",
    contexts: ["page"],
  });
  browser.contextMenus.create({
    id: "enthymio-save-link",
    title: "Save link to Enthymio",
    contexts: ["link"],
  });
  browser.contextMenus.create({
    id: "enthymio-save-image",
    title: "Save image link to Enthymio",
    contexts: ["image"],
  });
  browser.contextMenus.create({
    id: "enthymio-save-selection",
    title: "Save selection as note",
    contexts: ["selection"],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === "enthymio-save-page") {
      await postItem({
        type: isYouTube(tab.url) ? "youtube" : "website",
        title: tab.title || tab.url,
        url: tab.url,
        tags: ["clipped"],
      });
    } else if (info.menuItemId === "enthymio-save-link") {
      await postItem({
        type: isYouTube(info.linkUrl) ? "youtube" : "bookmark",
        title: info.linkText?.trim() || info.linkUrl,
        url: info.linkUrl,
        tags: ["clipped"],
      });
    } else if (info.menuItemId === "enthymio-save-image") {
      await postItem({
        type: "image",
        title: info.srcUrl.split("/").pop() || "clipped image",
        url: tab?.url,
        thumbnail: info.srcUrl,
        content: `![image](${info.srcUrl})`,
        tags: ["clipped", "image"],
      });
    } else if (info.menuItemId === "enthymio-save-selection") {
      await postItem({
        type: "note",
        title: (info.selectionText || "").slice(0, 80) || "clipped note",
        content: info.selectionText,
        url: tab?.url,
        tags: ["clipped", "quote"],
      });
    }
    await notify("Enthymio", "Saved to vault");
  } catch (e) {
    await notify("Enthymio", `Save failed: ${e.message}`);
  }
});

// Popup calls this via runtime message so it reuses vault URL + error handling.
browser.runtime.onMessage.addListener(async (msg) => {
  if (msg?.action === "save-tab") {
    try {
      await saveCurrentTab();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  if (msg?.action === "save-item") {
    try {
      await postItem(msg.item);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  return { ok: false, error: "unknown action" };
});
