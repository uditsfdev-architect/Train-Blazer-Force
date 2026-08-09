/* Train Blazer Force — UI interactions (presentation only) */
(function () {
  "use strict";

  const Lucide = window.lucide;

  function createIcon(name, attrs) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", attrs?.size || "24");
    svg.setAttribute("height", attrs?.size || "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    if (attrs?.className) svg.setAttribute("class", attrs.className);

    // Prefer Lucide CDN createIcons if available after DOM paint
    svg.dataset.lucide = name;
    return svg;
  }

  function initLucide() {
    if (Lucide && typeof Lucide.createIcons === "function") {
      Lucide.createIcons();
    }
  }

  /* Navbar scroll + drawer */
  function initNav() {
    const nav = document.querySelector(".navbar-glass");
    const toggle = document.getElementById("navToggle");
    const drawer = document.getElementById("navDrawer");
    const overlay = document.getElementById("navDrawerOverlay");
    const closeBtn = document.getElementById("navDrawerClose");

    function setScrolled() {
      if (!nav) return;
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });

    function openDrawer() {
      if (!drawer || !overlay) return;
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      document.body.classList.add("nav-open");
      toggle?.setAttribute("aria-expanded", "true");
    }

    function closeDrawer() {
      if (!drawer || !overlay) return;
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle?.setAttribute("aria-expanded", "false");
    }

    toggle?.addEventListener("click", openDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
    overlay?.addEventListener("click", closeDrawer);

    drawer?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeDrawer);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  /* Animated counters */
  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = Number(el.getAttribute("data-counter") || 0);
      const suffix = el.getAttribute("data-suffix") || "";
      const prefix = el.getAttribute("data-prefix") || "";
      const duration = 1200;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = `${prefix}${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* Reveal on scroll */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* Custom accordion */
  function initAccordion() {
    document.querySelectorAll(".tbf-accordion").forEach((accordion) => {
      accordion.querySelectorAll(".tbf-acc-trigger").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          const item = trigger.closest(".tbf-acc-item");
          const isOpen = item.classList.contains("is-open");
          accordion.querySelectorAll(".tbf-acc-item").forEach((i) => {
            i.classList.remove("is-open");
            i.querySelector(".tbf-acc-trigger")?.setAttribute("aria-expanded", "false");
          });
          if (!isOpen) {
            item.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
          }
        });
      });
    });
  }

  /* FAQ search */
  function initFaqSearch() {
    const input = document.getElementById("faqSearch");
    if (!input) return;

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      document.querySelectorAll("#faqAccordion .tbf-acc-item").forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = !q || text.includes(q) ? "" : "none";
      });
    });
  }

  /* Contact form (mailto fallback — no backend change) */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector("#contactName")?.value || "";
      const email = form.querySelector("#contactEmail")?.value || "";
      const phone = form.querySelector("#contactPhone")?.value || "";
      const message = form.querySelector("#contactMessage")?.value || "";
      const subject = encodeURIComponent(`Website inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`
      );
      window.location.href = `mailto:support@trainblazerforce.com?subject=${subject}&body=${body}`;
    });
  }

  /* Newsletter (mailto) */
  function initNewsletter() {
    const form = document.getElementById("newsletterForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("input[type='email']")?.value || "";
      const subject = encodeURIComponent("Newsletter signup");
      const body = encodeURIComponent(`Please add me to updates.\nEmail: ${email}`);
      window.location.href = `mailto:support@trainblazerforce.com?subject=${subject}&body=${body}`;
    });
  }

  /* Active bottom nav */
  function initBottomNav() {
    const path = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".bottom-nav a").forEach((link) => {
      const href = (link.getAttribute("href") || "").toLowerCase();
      const isHome = (path === "" || path === "index.html") && href.includes("index.html");
      const match = href.endsWith(path) || isHome;
      link.classList.toggle("is-active", match);
    });
  }

  /* First-visit mobile bottom-nav guide (index only) */
  function initNavGuide() {
    const STORAGE_KEY = "tbf_bottom_nav_guide_seen";
    const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const isIndex = page === "" || page === "index.html";
    const isMobile = () => window.matchMedia("(max-width: 991.98px)").matches;

    if (!isIndex || !isMobile() || localStorage.getItem(STORAGE_KEY) === "1") return;

    const nav = document.getElementById("mobileBottomNav");
    const guide = document.getElementById("navGuide");
    if (!nav || !guide) return;

    const steps = [
      {
        key: "home",
        title: "Home",
        desc: "Jump back to the homepage from anywhere.",
      },
      {
        key: "courses",
        title: "Courses",
        desc: "Browse Campus-to-Career, Career Switch, and Job Ready programs.",
      },
      {
        key: "register",
        title: "Register",
        desc: "Start your free registration in a few quick steps.",
      },
      {
        key: "guidelines",
        title: "Guidelines",
        desc: "Read the program guidelines before you submit.",
      },
      {
        key: "contact",
        title: "Contact",
        desc: "Reach the Train Blazer Force team when you need help.",
      },
    ];

    const progressEl = document.getElementById("navGuideProgress");
    const titleEl = document.getElementById("navGuideTitle");
    const descEl = document.getElementById("navGuideDesc");
    const nextBtn = document.getElementById("navGuideNext");
    const card = guide.querySelector(".nav-guide-card");
    let stepIndex = 0;
    let previousTarget = null;

    function finish() {
      localStorage.setItem(STORAGE_KEY, "1");
      guide.hidden = true;
      guide.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-guide-open");
      nav.classList.remove("nav-guide-active");
      if (previousTarget) previousTarget.classList.remove("nav-guide-target");
      document.removeEventListener("keydown", onKeydown);
    }

    function positionArrow(target) {
      if (!card || !target) return;
      const cardRect = card.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const x = targetRect.left + targetRect.width / 2 - cardRect.left;
      const clamped = Math.max(18, Math.min(cardRect.width - 18, x));
      card.style.setProperty("--guide-arrow-x", `${clamped}px`);
    }

    function showStep(index) {
      const step = steps[index];
      const target = nav.querySelector(`[data-guide="${step.key}"]`);
      if (!target) {
        finish();
        return;
      }

      if (previousTarget) previousTarget.classList.remove("nav-guide-target");
      target.classList.add("nav-guide-target");
      previousTarget = target;

      if (progressEl) progressEl.textContent = `${index + 1} / ${steps.length}`;
      if (titleEl) titleEl.textContent = step.title;
      if (descEl) descEl.textContent = step.desc;
      if (nextBtn) nextBtn.textContent = index === steps.length - 1 ? "Got it" : "Next";

      requestAnimationFrame(() => positionArrow(target));
    }

    function next() {
      if (stepIndex >= steps.length - 1) {
        finish();
        return;
      }
      stepIndex += 1;
      showStep(stepIndex);
    }

    function onKeydown(e) {
      if (e.key === "Escape") finish();
      if (e.key === "Enter" || e.key === "ArrowRight") next();
    }

    guide.hidden = false;
    guide.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-guide-open");
    nav.classList.add("nav-guide-active");

    guide.querySelectorAll("[data-guide-skip]").forEach((el) => {
      el.addEventListener("click", finish);
    });
    if (nextBtn) nextBtn.addEventListener("click", next);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", () => {
      if (!isMobile()) finish();
      else if (previousTarget) positionArrow(previousTarget);
    });

    // Slight delay so first paint + icons settle before spotlight
    window.setTimeout(() => showStep(0), 450);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initCounters();
    initReveal();
    initAccordion();
    initFaqSearch();
    initContactForm();
    initNewsletter();
    initBottomNav();
    initLucide();
    initNavGuide();
  });
})();
