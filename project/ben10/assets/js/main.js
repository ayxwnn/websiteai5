import { ALIENS, FEATURED_ALIEN_IDS, TIMELINE } from "./data.js";

const body = document.body;
const currentPage = body.dataset.page || "";

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/**
 * Navigation
 */
const initNavigation = () => {
  const menu = qs(".nav__menu");
  const toggle = qs(".nav-toggle");
  const links = qsa(".nav__link");

  if (!menu || !toggle) return;

  const setActive = () => {
    links.forEach((link) => {
      const linkPage = link.dataset.page;
      if (linkPage === currentPage) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  setActive();

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.forEach((link) =>
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }),
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
};

/**
 * Global utility to format abilities
 */
const formatList = (items) => items.map((item) => `<li>${item}</li>`).join("");

/**
 * Featured Aliens (Home)
 */
const renderFeaturedAliens = () => {
  const container = qs("#featuredAliens");
  if (!container) return;

  const featured = FEATURED_ALIEN_IDS.map((id) => ALIENS.find((alien) => alien.id === id)).filter(Boolean);

  container.innerHTML = featured
    .map(
      (alien) => `
        <article class="featured-card glow" data-alien-id="${alien.id}">
          <div class="featured-card__image">
            <img src="${alien.img}" alt="${alien.imgAlt}" loading="lazy" />
          </div>
          <p class="tagline">${alien.species}</p>
          <h3>${alien.name}</h3>
          <div class="feature-list">
            <span><strong>Homeworld:</strong> ${alien.homePlanet}</span>
            <span><strong>Power Level:</strong> ${alien.powerLevel}/10</span>
          </div>
          <button class="btn btn--ghost glow" data-action="view-alien" data-alien="${alien.id}">
            View Profile
          </button>
        </article>
      `,
    )
    .join("");

  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='view-alien']");
    if (!button) return;
    const target = button.dataset.alien;
    const alien = ALIENS.find((entry) => entry.id === target);
    if (alien) openAlienModal(alien);
  });
};

/**
 * Particles for hero background
 */
const initParticles = () => {
  const canvas = qs("#particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const particleCount = 48;

  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };

  window.addEventListener("resize", resize);
  resize();

  for (let i = 0; i < particleCount; i += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.6,
      speed: Math.random() * 0.4 + 0.1,
      direction: Math.random() * 360,
    });
  }

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 255, 0, 0.35)";

    particles.forEach((particle) => {
      const rad = (particle.direction * Math.PI) / 180;
      particle.x += Math.cos(rad) * particle.speed;
      particle.y += Math.sin(rad) * particle.speed;

      if (particle.x < 0 || particle.x > canvas.width) {
        particle.direction = 180 - particle.direction;
      }
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.direction = 360 - particle.direction;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(tick);
  };

  tick();
};

/**
 * Alien Modal (shared)
 */
const overlay = qs("[data-modal-overlay]");
const modal = qs("#alienModal");
const modalContent = qs("#alienModalContent");
let lastFocusedElement = null;

const trapFocus = (event) => {
  if (!modal || modal.getAttribute("aria-hidden") === "true") return;
  const focusableSelectors =
    "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";
  const focusable = qsa(focusableSelectors, modal);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.key === "Tab") {
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
};

export const openAlienModal = (alien) => {
  if (!modal || !modalContent) return;
  lastFocusedElement = document.activeElement;

  modalContent.innerHTML = `
    <header>
      <p class="badge">${alien.species}</p>
      <h2 class="card__title">${alien.name}</h2>
      <p class="meta"><span>Home Planet: ${alien.homePlanet}</span> <span>Power Level: ${alien.powerLevel}/10</span></p>
    </header>
    <div class="split">
      <div>
        <img src="${alien.img}" alt="${alien.imgAlt}" loading="lazy" />
      </div>
      <div>
        <p>${alien.summary}</p>
        <h3>Abilities</h3>
        <ul class="list">${formatList(alien.abilities)}</ul>
        <p class="status"><span class="status__dot" aria-hidden="true"></span><span>First Appearance:</span> ${alien.firstAppearance}</p>
        <p class="status"><span class="status__dot" aria-hidden="true"></span><span>Unlocked By:</span> ${alien.unlockedBy}</p>
      </div>
    </div>
  `;

  modal.setAttribute("aria-hidden", "false");
  overlay?.classList.add("is-visible");
  modal.classList.add("is-open");
  modal.focus();
};

const closeAlienModal = () => {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("is-open");
  overlay?.classList.remove("is-visible");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
};

const initModal = () => {
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");

  modal.addEventListener("keydown", trapFocus);

  modal.addEventListener("click", (event) => {
    if (event.target.matches(".modal__close")) {
      closeAlienModal();
    }
  });

  overlay?.addEventListener("click", closeAlienModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAlienModal();
    }
  });
};

/**
 * Aliens Grid (Aliens page)
 */
const initAliensPage = () => {
  const grid = qs("#alienGrid");
  if (!grid) return;

  const form = qs("#alienFilters");
  const searchInput = qs("#searchInput");
  const planetSelect = qs("#planetFilter");
  const sortButton = qs("#sortPower");
  const resultCount = qs("#resultsCount");

  let sortDirection = "desc";
  let filteredAliens = [...ALIENS];

  const renderOptions = () => {
    if (!planetSelect) return;
    const planets = Array.from(new Set(ALIENS.map((alien) => alien.homePlanet))).sort();
    planetSelect.innerHTML = ['<option value="all">All Homeworlds</option>', ...planets.map((planet) => `<option value="${planet}">${planet}</option>`)].join("");
  };

  const renderGrid = () => {
    if (!grid) return;
    if (!filteredAliens.length) {
      grid.innerHTML = `<p role="status">No aliens match those filters yet. Try a different combination.</p>`;
      resultCount.textContent = "0 results";
      return;
    }

    grid.innerHTML = filteredAliens
      .map(
        (alien) => `
          <article class="card glow" data-alien-card="${alien.id}">
            <div class="card__image">
              <img src="${alien.img}" alt="${alien.imgAlt}" loading="lazy" />
            </div>
            <div class="badge">${alien.species}</div>
            <h3 class="card__title">${alien.name}</h3>
            <div class="meta">
              <span>Home Planet: ${alien.homePlanet}</span>
              <span>Unlocked By: ${alien.unlockedBy}</span>
            </div>
            <div class="power-bar" aria-hidden="true">
              <div class="power-bar__fill" style="width:${alien.powerLevel * 10}%"></div>
            </div>
            <p><strong>Power Level:</strong> ${alien.powerLevel}/10</p>
            <button class="btn btn--primary glow" data-action="view-alien" data-alien="${alien.id}">
              View details
            </button>
          </article>
        `,
      )
      .join("");

    resultCount.textContent = `${filteredAliens.length} ${filteredAliens.length === 1 ? "result" : "results"}`;
  };

  const applyFilters = () => {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const planet = planetSelect?.value ?? "all";

    filteredAliens = ALIENS.filter((alien) => {
      const matchesQuery = alien.name.toLowerCase().includes(query);
      const matchesPlanet = planet === "all" || alien.homePlanet === planet;
      return matchesQuery && matchesPlanet;
    }).sort((a, b) => (sortDirection === "desc" ? b.powerLevel - a.powerLevel : a.powerLevel - b.powerLevel));

    renderGrid();
  };

  renderOptions();
  applyFilters();

  form?.addEventListener("submit", (event) => event.preventDefault());
  searchInput?.addEventListener("input", applyFilters);
  planetSelect?.addEventListener("change", applyFilters);
  sortButton?.addEventListener("click", () => {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
    sortButton.dataset.direction = sortDirection;
    sortButton.innerHTML =
      sortDirection === "desc"
        ? '<span aria-hidden="true">▼</span> Sort: Power High→Low'
        : '<span aria-hidden="true">▲</span> Sort: Power Low→High';
    applyFilters();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='view-alien']");
    if (!button) return;
    const target = button.dataset.alien;
    const alien = ALIENS.find((entry) => entry.id === target);
    if (alien) openAlienModal(alien);
  });
};

/**
 * Omnitrix Randomizer
 */
const initOmnitrixPage = () => {
  const dial = qs("[data-omnitrix-dial]");
  if (!dial) return;

  const nameEl = qs("[data-omnitrix-name]");
  const speciesEl = qs("[data-omnitrix-species]");
  const powerEl = qs("[data-omnitrix-power]");

  const rollAlien = () => {
    const alien = ALIENS[Math.floor(Math.random() * ALIENS.length)];
    if (!alien) return;
    nameEl.textContent = alien.name;
    speciesEl.textContent = `${alien.species} · ${alien.homePlanet}`;
    powerEl.textContent = `Power Level ${alien.powerLevel}/10`;
    dial.dataset.currentAlien = alien.id;
  };

  const spin = () => {
    dial.classList.add("is-spinning");
    setTimeout(() => {
      dial.classList.remove("is-spinning");
      rollAlien();
    }, 600);
  };

  dial.addEventListener("click", spin);
  dial.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      spin();
    }
  });

  rollAlien();
};

/**
 * Timeline
 */
const initTimeline = () => {
  const container = qs("#timelineList");
  if (!container) return;

  container.innerHTML = TIMELINE.map((season) => {
    const highlights = season.highlights
      .map((id) => {
        const alien = ALIENS.find((entry) => entry.id === id);
        if (!alien) return "";
        return `
          <div class="timeline__event">
            <img src="${alien.img}" alt="${alien.imgAlt}" loading="lazy" />
            <div>
              <strong>${alien.name}</strong>
              <p>${alien.species} · Power ${alien.powerLevel}/10</p>
            </div>
          </div>
        `;
      })
      .join("");

    const milestones = season.milestones
      .map(
        (milestone) => `
          <li>
            <strong>${milestone.title}:</strong> ${milestone.description}
          </li>
        `,
      )
      .join("");

    return `
      <article class="timeline__item">
        <p class="timeline__season">${season.season} · ${season.year}</p>
        <p>${season.summary}</p>
        <div class="timeline__events">${highlights}</div>
        <ul class="list" aria-label="${season.season} milestones">
          ${milestones}
        </ul>
      </article>
    `;
  }).join("");
};

/**
 * About page enhancements
 */
const initScrollReveal = () => {
  const revealElements = qsa("[data-reveal]");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  revealElements.forEach((el) => observer.observe(el));
};

/**
 * Initialize the entire app
 */
const init = () => {
  initNavigation();
  initModal();
  initScrollReveal();

  if (currentPage === "home") {
    renderFeaturedAliens();
    initParticles();
  }

  if (currentPage === "aliens") {
    initAliensPage();
  }

  if (currentPage === "omnitrix") {
    initOmnitrixPage();
  }

  if (currentPage === "timeline") {
    initTimeline();
  }
};

init();
