const init = async () => {
  const { vaultUrl, apiToken } = await browser.storage.sync.get(["vaultUrl", "apiToken"]);
  document.getElementById("vaultUrl").value = vaultUrl || "http://localhost:3000";
  document.getElementById("apiToken").value = apiToken || "";
  document.getElementById("save").addEventListener("click", async () => {
    const v = document.getElementById("vaultUrl").value.trim().replace(/\/$/, "");
    await browser.storage.sync.set({
      vaultUrl: v || "http://localhost:3000",
      apiToken: document.getElementById("apiToken").value.trim(),
    });
    document.getElementById("status").textContent = "Saved";
  });
};

document.addEventListener("DOMContentLoaded", init);
