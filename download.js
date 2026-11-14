(() => {
  const allowedPrefix =
    "https://github.com/azzuwayed/switchboard-website/releases/download/";
  const requests = new Map();

  function resolveDmg(manifest) {
    const version = manifest?.version;
    const latest = manifest?.latest;
    const dmg = manifest?.macos?.universal?.dmg;
    const expectedUrl = `${allowedPrefix}v${version}/Switchboard-v${version}-macos-universal.dmg`;
    if (
      manifest?.schemaVersion !== 1 ||
      !/^\d+\.\d+\.\d+$/.test(version ?? "") ||
      latest !== version ||
      !/^\d+(?:\.\d+){1,2}$/.test(manifest?.minimumSystemVersion ?? "") ||
      Object.keys(dmg ?? {})
        .sort()
        .join(",") !== "sha256,sizeBytes,url" ||
      !/^[0-9a-f]{64}$/.test(dmg?.sha256 ?? "") ||
      !Number.isSafeInteger(dmg?.sizeBytes) ||
      dmg.sizeBytes <= 0 ||
      dmg?.url !== expectedUrl
    ) {
      return null;
    }
    return { url: expectedUrl, version };
  }

  async function hydrateDownload(link) {
    try {
      const url = link.dataset.updatesUrl;
      if (!requests.has(url)) {
        requests.set(
          url,
          fetch(url, { cache: "no-store" }).then(async (response) =>
            response.ok ? resolveDmg(await response.json()) : null,
          ),
        );
      }
      const resolved = await requests.get(url);
      if (!resolved) return;
      link.href = resolved.url;
      for (const chip of document.querySelectorAll("[data-version-chip]")) {
        chip.textContent = `v${resolved.version}`;
        chip.hidden = false;
      }
    } catch {
      // Keep the latest-release fallback already rendered in the page.
    }
  }

  for (const link of document.querySelectorAll("[data-switchboard-download]")) {
    void hydrateDownload(link);
  }
})();
