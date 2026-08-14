(function () {
  const body = document.body;
  const root = body.dataset.root || "";
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const savedTheme = (() => { try { return localStorage.getItem("bcm-theme"); } catch (_) { return null; } })();
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bcm-theme", next); } catch (_) {}
  });

  document.querySelectorAll(".copy-code").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.closest(".terminal")?.querySelector("code")?.textContent || "";
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copiado ✓";
      } catch (_) {
        const area = document.createElement("textarea");
        area.value = code; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
        button.textContent = "Copiado ✓";
      }
      setTimeout(() => { button.textContent = "Copiar"; }, 1800);
    });
  });

  const dialog = document.querySelector(".search-dialog");
  const input = document.querySelector(".search-input");
  const results = document.querySelector(".search-results");
  const openSearch = () => { dialog?.showModal(); setTimeout(() => input?.focus(), 30); };
  document.querySelectorAll(".search-trigger").forEach((el) => el.addEventListener("click", openSearch));
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
  });
  input?.addEventListener("input", () => {
    const query = normalize(input.value.trim());
    if (query.length < 2) { results.innerHTML = '<p class="search-hint">Digite ao menos dois caracteres para pesquisar.</p>'; return; }
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = (window.RUNBOOK_SEARCH || []).map((entry) => {
      const haystack = normalize(entry.title + " " + entry.text + " " + entry.kind);
      const score = terms.reduce((sum, term) => sum + (normalize(entry.title).includes(term) ? 5 : 0) + (haystack.includes(term) ? 1 : -10), 0);
      return { entry, score };
    }).filter((item) => item.score >= 0).sort((a, b) => b.score - a.score).slice(0, 12);
    results.innerHTML = matches.length ? matches.map(({ entry }) => `<a href="${root}${entry.url}"><span>${entry.kind}</span><strong>${entry.title}</strong><small>${entry.text.slice(0, 150)}…</small></a>`).join("") : '<p class="search-hint">Nenhum procedimento encontrado. Tente outro termo.</p>';
  });

  document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".manual-index li").forEach((item) => {
      const kind = item.querySelector("small")?.textContent;
      item.hidden = filter !== "Todos" && kind !== filter;
    });
  }));
})();
