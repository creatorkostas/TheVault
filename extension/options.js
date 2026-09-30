const init = async () => {
  const { enthymioUrl, apiToken } = await browser.storage.sync.get(["enthymioUrl", "apiToken"]);
  document.getElementById("enthymioUrl").value = enthymioUrl || "http://localhost:3000";
  document.getElementById("apiToken").value = apiToken || "";
  document.getElementById("save").addEventListener("click", async () => {
    const v = document.getElementById("enthymioUrl").value.trim().replace(/\/$/, "");
    await browser.storage.sync.set({
      enthymioUrl: v || "http://localhost:3000",
      apiToken: document.getElementById("apiToken").value.trim(),
    });
    document.getElementById("status").textContent = "Saved";
  });
};

document.addEventListener("DOMContentLoaded", init);
