(() => {
  const installButton = document.getElementById("installAppButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const actions = document.getElementById("pwaActions");
  const status = document.getElementById("pwaStatus");

  if (!installButton || !fullscreenButton || !actions || !status) {
    return;
  }

  let installPrompt = null;

  const isInstalled = () =>
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const isFullscreen = () =>
    Boolean(document.fullscreenElement) ||
    window.matchMedia("(display-mode: fullscreen)").matches;

  function refreshControls() {
    const canFullscreen = Boolean(document.documentElement.requestFullscreen);
    installButton.hidden = isInstalled() || !installPrompt;
    fullscreenButton.hidden = !canFullscreen;
    fullscreenButton.textContent = isFullscreen() ? "離開全螢幕" : "進入全螢幕";
    actions.hidden = installButton.hidden && fullscreenButton.hidden && !status.textContent;
  }

  async function enterFullscreen() {
    if (isFullscreen()) {
      return true;
    }

    try {
      try {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      } catch {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape").catch(() => {});
      }
      status.textContent = "";
      refreshControls();
      return true;
    } catch {
      return false;
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      refreshControls();
      return;
    }

    const entered = await enterFullscreen();
    if (!entered) {
      status.textContent = "瀏覽器無法切換全螢幕，仍可繼續遊玩。";
    }
    refreshControls();
  }

  window.spellQuestEnterFullscreen = () => {
    if (!isInstalled()) {
      return Promise.resolve(false);
    }
    return enterFullscreen();
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    status.textContent = "可安裝到平板桌面，以獨立應用程式模式遊玩。";
    refreshControls();
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    status.textContent = "安裝完成，請從桌面圖示啟動。";
    refreshControls();
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    installPrompt = null;
    status.textContent = result.outcome === "accepted" ? "正在完成安裝..." : "";
    refreshControls();
  });

  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", refreshControls);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    });
  }

  refreshControls();
})();
