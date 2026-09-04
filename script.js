const statusElement = document.getElementById("siteStatus");
const rootElement = document.getElementById("siteRoot");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function renderStrongText(value = "") {
  return String(value)
    .split("**")
    .map((part, index) => (index % 2 ? `<strong>${escapeHtml(part)}</strong>` : escapeHtml(part)))
    .join("");
}

function resolveLink(content, item = {}) {
  const link = item.linkKey ? content.links?.[item.linkKey] : item;
  if (!link) return { href: "#", label: item.label || "Link" };
  return {
    href: link.href || item.href || "#",
    label: item.label || link.label || "Link",
    download: Boolean(item.download || link.download),
    external: /^https?:\/\//i.test(link.href || item.href || ""),
  };
}

function linkAttributes(link) {
  const attrs = [`href="${escapeHtml(link.href)}"`];
  if (link.external) attrs.push('target="_blank"', 'rel="noreferrer"');
  if (link.download) attrs.push("download");
  return attrs.join(" ");
}

function renderIcon(name) {
  const paths = {
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>',
    phone:
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"></path>',
    linkedin:
      '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path>',
  };
  if (!paths[name]) return "";
  return `<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function renderButton(content, item) {
  const link = item.target
    ? { href: `#${item.target}`, label: item.label, external: false, download: false }
    : resolveLink(content, item);
  return `<a class="button ${escapeHtml(item.style || "secondary")}" ${linkAttributes(link)}>${renderIcon(
    item.icon
  )}<span>${escapeHtml(link.label)}</span></a>`;
}

function updateHead(content) {
  document.documentElement.lang = content.site.language || "en";
  document.title = content.site.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", content.site.description);

  const headEntries = [
    ["link", { rel: "canonical", href: content.site.canonical }],
    ["meta", { property: "og:title", content: content.site.title }],
    ["meta", { property: "og:description", content: content.site.description }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:url", content: content.site.canonical }],
    ["meta", { property: "og:image", content: content.site.ogImage }],
  ];

  headEntries.forEach(([tag, attrs]) => {
    const selector = tag === "link" ? `link[rel="${attrs.rel}"]` : `meta[property="${attrs.property}"]`;
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement(tag);
      document.head.append(element);
    }
    Object.entries(attrs).forEach(([name, value]) => {
      if (value) element.setAttribute(name, value);
    });
  });
}

function renderHeader(content) {
  const links = content.navigation.links
    .map((link) => `<a href="#${escapeHtml(link.target)}">${escapeHtml(link.label)}</a>`)
    .join("");
  const cta = renderButton(content, { linkKey: content.navigation.ctaKey, style: "nav" });

  return `
    <header class="site-header" data-nav-shell>
      <a class="brand-mark" href="#hero" aria-label="${escapeHtml(content.navigation.brandAriaLabel)}">
        <span></span><strong>Pan</strong>
      </a>
      <nav class="section-nav" aria-label="${escapeHtml(content.navigation.primaryLabel)}">
        ${links}
        ${cta}
      </nav>
    </header>`;
}

function renderHero(content) {
  const actions = content.hero.actions.map((action) => renderButton(content, action)).join("");
  const description = content.hero.descriptionLines
    .map((line) => `<span>${escapeHtml(line)}</span>`)
    .join("");

  return `
    <section class="hero" id="hero" data-section="${escapeHtml(content.hero.sectionLabel)}">
      <div class="hero-inner">
        <div class="hero-copy">
          <h1 class="hero-title" aria-label="${escapeHtml(content.hero.ariaTitle)}">${escapeHtml(content.hero.name)}</h1>
          <p class="hero-role">${escapeHtml(content.hero.roleLocation)}</p>
          <p class="hero-lede">${description}</p>
          <div class="hero-actions">${actions}</div>
        </div>
        <div class="hero-visual">
          <img
            class="hero-avatar"
            src="${escapeHtml(content.hero.avatar.path)}"
            alt="${escapeHtml(content.hero.avatar.alt)}"
            width="1100"
            height="1438"
            fetchpriority="high"
          />
        </div>
      </div>
    </section>`;
}

function renderWorkPreview(content) {
  const cards = content.workPreview.items
    .map(
      (item) => `
        <a
          class="case-card glass-card"
          href="#${escapeHtml(item.target)}"
          data-preview-project="${escapeHtml(item.project || "")}"
          data-preview-module="${escapeHtml(item.module || "")}"
        >
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" width="600" height="450" />
          <span>${escapeHtml(item.title)}</span>
        </a>`
    )
    .join("");

  return `
    <section class="case-strip" aria-label="${escapeHtml(content.workPreview.ariaLabel)}">
      <div class="case-label"><span>${escapeHtml(content.workPreview.label)}</span><strong>${escapeHtml(
        content.workPreview.category
      )}</strong></div>
      <div class="case-track">${cards}</div>
    </section>`;
}

function renderAbout(content) {
  const paragraphs = content.about.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const cta = renderButton(content, { label: content.about.cta.label, target: content.about.cta.target, style: "primary" });
  return `
    <section class="about" id="about" data-section="${escapeHtml(content.about.sectionLabel)}">
      <div class="about-layout">
        <h2>${escapeHtml(content.about.title)}</h2>
        <div class="about-copy">
          ${paragraphs}
        </div>
        <div class="about-actions">${cta}</div>
      </div>
    </section>`;
}

function renderCapabilities(content) {
  const items = content.capabilities.items
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.number)}</span>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
          </div>
        </article>`
    )
    .join("");
  return `
    <section class="capabilities" id="capabilities" data-section="${escapeHtml(content.capabilities.sectionLabel)}">
      <div class="capabilities-heading">
        <h2>${escapeHtml(content.capabilities.title)}</h2>
        <p>${escapeHtml(content.capabilities.subtitle)}</p>
      </div>
      <div class="capability-list">${items}</div>
    </section>`;
}

function renderProjectTabs(tabs, placement = "top", namespace = "") {
  const idSuffix = placement === "top" ? "" : `-${placement}`;
  const idPrefix = namespace ? `${namespace}-` : "";
  return tabs
    .map(
      (tab, index) => `
        <button
          id="${idPrefix}tab-${escapeHtml(tab.id)}${idSuffix}"
          class="${index === 0 ? "active" : ""}"
          type="button"
          role="tab"
          aria-selected="${index === 0 ? "true" : "false"}"
          aria-controls="${idPrefix}panel-${escapeHtml(tab.id)}"
          tabindex="${index === 0 ? "0" : "-1"}"
          data-case-tab="${index}"
        >${escapeHtml(tab.label)}</button>`
    )
    .join("");
}

function renderProjectProgress(tabs, namespace = "", ariaLabel = "Ertha Home work module progress") {
  const total = String(tabs.length).padStart(2, "0");
  const idPrefix = namespace ? `${namespace}-` : "";
  const steps = tabs
    .map(
      (tab, index) => `
        <button
          id="${idPrefix}tab-${escapeHtml(tab.id)}-progress"
          class="case-progress-step${index === 0 ? " active" : ""}"
          type="button"
          role="tab"
          aria-label="Open ${escapeHtml(tab.label)}"
          aria-selected="${index === 0 ? "true" : "false"}"
          aria-controls="${idPrefix}panel-${escapeHtml(tab.id)}"
          tabindex="${index === 0 ? "0" : "-1"}"
          title="${escapeHtml(tab.label)}"
          data-case-tab="${index}"
        ></button>`
    )
    .join("");

  return `
    <div class="case-progress-nav" aria-label="Case study module progress">
      <button class="case-progress-arrow" type="button" data-case-shift="-1" aria-label="Previous module" title="Previous module">
        <span aria-hidden="true">‹</span>
      </button>
      <div class="case-progress-summary">
        <div class="case-progress-counter" aria-live="polite">
          <strong data-case-current>01</strong>
          <span>/</span>
          <span>${total}</span>
        </div>
        <div class="case-progress-track" role="tablist" aria-label="${escapeHtml(ariaLabel)}">
          <span class="case-progress-fill" data-case-progress aria-hidden="true"></span>
          <div class="case-progress-steps" style="--case-tab-count: ${tabs.length}">${steps}</div>
        </div>
      </div>
      <button class="case-progress-arrow" type="button" data-case-shift="1" aria-label="Next module" title="Next module">
        <span aria-hidden="true">›</span>
      </button>
    </div>`;
}

function renderProjectPanel(tab, index = 0, namespace = "") {
  const content = tab.content;
  const idPrefix = namespace ? `${namespace}-` : "";
  const isRichCase = content.overview && Array.isArray(content.metrics) && Array.isArray(content.contributions);
  const details = isRichCase
    ? `
        <div class="case-overview">
          <h4>Overview</h4>
          <p>${renderStrongText(content.overview)}</p>
        </div>
        <div class="case-metrics" aria-label="${escapeHtml(tab.label)} metrics">
          ${content.metrics
            .map(
              (metric) => `
                <div class="metric-card">
                  <strong>${escapeHtml(metric.value)}</strong>
                  <span>${escapeHtml(metric.label)}</span>
                </div>`
            )
            .join("")}
        </div>
        <div class="case-contributions">
          <div class="contribution-list">
            ${content.contributions
              .map(
                (item) => `
                  <article class="case-contribution">
                    <h5>${escapeHtml(item.title)}</h5>
                    <p>${renderStrongText(item.body)}</p>
                  </article>`
              )
              .join("")}
          </div>
        </div>`
    : `
        <div><h4>The goal</h4><p>${escapeHtml(content.goal)}</p></div>
        <div><h4>My role</h4><p>${escapeHtml(content.role)}</p></div>
        <div><h4>What I did</h4><ul>${content.did.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        <div><h4>What I reviewed next</h4><p>${escapeHtml(content.reviewed)}</p></div>`;
  return `
    <div
      id="${idPrefix}panel-${escapeHtml(tab.id)}"
      class="case-tab-panel${index === 0 ? " active" : ""}"
      role="tabpanel"
      aria-labelledby="${idPrefix}tab-${escapeHtml(tab.id)}"
      data-case-panel
      ${index === 0 ? "" : "hidden"}
    >
      <div class="case-panel-main${isRichCase ? " case-panel-main-rich" : ""}">
        <figure class="case-image">
          <img src="${escapeHtml(tab.image.path)}" alt="${escapeHtml(tab.image.alt)}" loading="lazy" width="2000" height="1500" />
        </figure>
        <div class="case-detail${isRichCase ? " case-detail-rich" : ""}">${details}</div>
      </div>
    </div>`;
}

function renderOtherProjectPanel(tab, index) {
  const hasContributions = Array.isArray(tab.content.contributions);
  const work = hasContributions
    ? `
        <div class="mei-work-list">
          ${tab.content.contributions
            .map(
              (item) => `
                <article class="mei-work-item">
                  <h5>${escapeHtml(item.title)}</h5>
                  <p>${renderStrongText(item.body)}</p>
                </article>`
            )
            .join("")}
        </div>`
    : `
        <div>
          <h4>What I did</h4>
          <p>${renderStrongText(tab.content.did)}</p>
        </div>`;
  return `
    <div
      id="mei-panel-${escapeHtml(tab.id)}"
      class="case-tab-panel${index === 0 ? " active" : ""}"
      role="tabpanel"
      aria-labelledby="mei-tab-${escapeHtml(tab.id)}"
      data-case-panel
      ${index === 0 ? "" : "hidden"}
    >
      <div class="case-panel-main mei-case-main${hasContributions ? " has-contributions" : ""}">
        <figure class="case-image">
          <img src="${escapeHtml(tab.image.path)}" alt="${escapeHtml(tab.image.alt)}" loading="lazy" width="2000" height="1500" />
        </figure>
        <div class="case-detail mei-case-detail${hasContributions ? " has-contributions" : ""}">
          <div>
            <h4>Overview</h4>
            <p>${renderStrongText(tab.content.overview)}</p>
          </div>
          ${work}
        </div>
      </div>
    </div>`;
}

function renderProjects(content) {
  const featured = content.projects.featured;
  const actions = featured.actions.map((action) => renderButton(content, action)).join("");
  const topTabs = renderProjectTabs(featured.tabs);
  const progressNav = renderProjectProgress(featured.tabs);
  const panels = featured.tabs.map((tab, index) => renderProjectPanel(tab, index)).join("");
  const other = content.projects.other;
  const otherTabs = renderProjectTabs(other.tabs, "top", "mei");
  const otherPanels = other.tabs.map(renderOtherProjectPanel).join("");
  const otherProgress = renderProjectProgress(other.tabs, "mei", "MEI PI QI project module progress");

  return `
    <section class="projects" id="projects" data-section="${escapeHtml(content.projects.sectionLabel)}">
      <div class="project-shell">
        <div class="section-heading">
          <h2>${escapeHtml(content.projects.title)}</h2>
          <p>${escapeHtml(content.projects.subtitle)}</p>
        </div>
        <article class="featured-case" data-case-study>
          <div class="featured-intro">
            <div class="featured-meta">
              <p class="eyebrow">${escapeHtml(featured.eyebrow)}</p>
              <p class="case-subtitle">${escapeHtml(featured.subtitle)}</p>
            </div>
            <div class="featured-copy">
              <h3>${escapeHtml(featured.title)}</h3>
            </div>
            <div class="external-actions">${actions}</div>
          </div>
          <div class="case-tabs case-tabs-top" style="--case-tab-count: ${featured.tabs.length}" role="tablist" aria-label="Ertha Home work modules">${topTabs}</div>
          <div class="case-panels">${panels}</div>
          ${progressNav}
        </article>
        <article class="other-work" id="${escapeHtml(other.id)}">
          <div class="other-work-card">
            <img src="${escapeHtml(other.image.path)}" alt="${escapeHtml(other.image.alt)}" loading="lazy" width="1433" height="1098" />
            <div class="other-work-copy">
              <p class="eyebrow">${escapeHtml(other.eyebrow)}</p>
              <h3>${escapeHtml(other.title)}</h3>
              <p class="case-subtitle">${escapeHtml(other.subtitle)}</p>
              <p>${escapeHtml(other.description)}</p>
              <button
                class="button secondary other-work-toggle"
                type="button"
                aria-expanded="false"
                aria-controls="${escapeHtml(other.id)}-details"
                data-other-project-toggle
                data-open-label="${escapeHtml(other.button)}"
                data-close-label="${escapeHtml(other.closeButton)}"
              >${escapeHtml(other.button)}</button>
            </div>
          </div>
          <div
            class="other-project-details"
            id="${escapeHtml(other.id)}-details"
            data-other-project-details
            data-case-study
            hidden
          >
            <div class="case-tabs case-tabs-top" style="--case-tab-count: ${other.tabs.length}" role="tablist" aria-label="MEI PI QI project modules">${otherTabs}</div>
            <div class="case-panels">${otherPanels}</div>
            ${otherProgress}
          </div>
        </article>
      </div>
    </section>`;
}

function renderContact(content) {
  const links = content.contact.links.map((link) => renderButton(content, link)).join("");
  return `
    <footer class="contact" id="contact" data-section="${escapeHtml(content.contact.sectionLabel)}">
      <div class="contact-card">
        <p class="eyebrow">${escapeHtml(content.contact.eyebrow)}</p>
        <h2>${escapeHtml(content.contact.title)}</h2>
        <p class="contact-support">${renderStrongText(content.contact.subtitle)}</p>
        <div class="contact-actions">${links}</div>
      </div>
      <p class="footer-note">${escapeHtml(content.contact.footerNote)}</p>
    </footer>`;
}

function renderSite(content) {
  updateHead(content);
  rootElement.innerHTML = `
    <a class="skip-link" href="#main">${escapeHtml(content.site.skipLink)}</a>
    ${renderHeader(content)}
    <main id="main">
      ${renderHero(content)}
      ${renderWorkPreview(content)}
      ${renderAbout(content)}
      ${renderCapabilities(content)}
      ${renderProjects(content)}
    </main>
    ${renderContact(content)}`;
}

function initNavigation() {
  const sections = [...document.querySelectorAll("[data-section]")];
  const links = [...document.querySelectorAll(".section-nav a[href^='#']")];
  const header = document.querySelector("[data-nav-shell]");

  function updateActive() {
    const sampleY = window.scrollY + Math.min(window.innerHeight * 0.34, 320);
    let active = sections[0];
    sections.forEach((section) => {
      if (sampleY >= section.offsetTop) active = section;
    });
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${active?.id}`);
    });
    header?.classList.toggle("on-light", active?.id === "capabilities");
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
  updateActive();
}

function initCaseTabs() {
  document.querySelectorAll("[data-case-study]").forEach((caseStudy) => {
    const tabs = [...caseStudy.querySelectorAll("[data-case-tab]")];
    const panels = [...caseStudy.querySelectorAll("[data-case-panel]")];
    if (!tabs.length || !panels.length) return;
    let currentIndex = 0;

    function scrollToCaseStart() {
      caseStudy.querySelector(".case-tabs-top")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }

    function show(index, focusTab = null) {
      currentIndex = index;
      tabs.forEach((tab) => {
        const active = Number(tab.dataset.caseTab) === index;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("tabindex", active ? "0" : "-1");
      });
      panels.forEach((panel, panelIndex) => {
        panel.classList.toggle("active", panelIndex === index);
        panel.hidden = panelIndex !== index;
      });
      caseStudy.querySelectorAll("[data-case-current]").forEach((counter) => {
        counter.textContent = String(index + 1).padStart(2, "0");
      });
      caseStudy.querySelectorAll("[data-case-progress]").forEach((progress) => {
        progress.style.setProperty("--case-progress", `${((index + 1) / panels.length) * 100}%`);
      });
      focusTab?.focus();
    }

    tabs.forEach((tab) => {
      const index = Number(tab.dataset.caseTab);
      tab.addEventListener("click", () => {
        show(index);
        if (tab.closest(".case-progress-nav")) scrollToCaseStart();
      });
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const groupTabs = [...tab.closest('[role="tablist"]').querySelectorAll("[data-case-tab]")];
        const groupIndex = groupTabs.indexOf(tab);
        const nextTab = groupTabs[(groupIndex + (event.key === "ArrowRight" ? 1 : -1) + groupTabs.length) % groupTabs.length];
        show(Number(nextTab.dataset.caseTab), nextTab);
      });
    });
    caseStudy.querySelectorAll("[data-case-shift]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextIndex = (currentIndex + Number(button.dataset.caseShift) + panels.length) % panels.length;
        show(nextIndex);
        scrollToCaseStart();
      });
    });
    show(0);
  });
}

function initOtherProject() {
  const toggle = document.querySelector("[data-other-project-toggle]");
  const details = document.querySelector("[data-other-project-details]");
  if (!toggle || !details) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.textContent = expanded ? toggle.dataset.openLabel : toggle.dataset.closeLabel;
    details.hidden = expanded;
  });
}

function initWorkPreviewLinks() {
  document.querySelectorAll("[data-preview-project][data-preview-module]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const project = link.dataset.previewProject;
      const module = link.dataset.previewModule;
      if (!project || !module) return;

      event.preventDefault();
      if (project === "featured") {
        document.getElementById(`tab-${module}`)?.click();
        document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (project === "other") {
        const toggle = document.querySelector("[data-other-project-toggle]");
        const details = document.querySelector("[data-other-project-details]");
        if (details?.hidden) toggle?.click();
        document.getElementById(`mei-tab-${module}`)?.click();
        document.getElementById("other-work")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function initReveal() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(
    ".hero-inner, .case-card, .about-layout, .capability-list article, .featured-case, .other-work, .contact-card"
  );
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("in-view"));
    return;
  }
  items.forEach((item) => item.classList.add("reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -48px" }
  );
  items.forEach((item) => observer.observe(item));
}

function initInteractions() {
  initNavigation();
  initCaseTabs();
  initOtherProject();
  initWorkPreviewLinks();
  initReveal();
}

async function initSite() {
  try {
    const response = await fetch("content.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    const content = await response.json();
    if (statusElement) statusElement.textContent = content.site.loadingText;
    renderSite(content);
    statusElement?.remove();
    initInteractions();
  } catch (error) {
    console.error(error);
    if (statusElement) {
      statusElement.classList.add("error");
      statusElement.textContent =
        "The portfolio content could not be loaded. Please open the site through its local preview server.";
    }
  }
}

initSite();
