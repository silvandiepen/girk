const getNavigationItems = (navigation) =>
  Array.from(
    navigation.querySelectorAll(".navigation__item--has-children")
  );

const PANEL_TRANSITION_MS = 180;

const clearPanelHideTimer = (submenu) => {
  if (!submenu || typeof submenu.__hideTimer !== "number") return;

  window.clearTimeout(submenu.__hideTimer);
  delete submenu.__hideTimer;
};

const setNavigationItemOpen = (item, isOpen) => {
  const toggle = item.querySelector(".navigation__toggle");
  const controls = toggle?.getAttribute("aria-controls");
  const submenu = controls ? document.getElementById(controls) : null;

  if (!toggle || !submenu) return;

  clearPanelHideTimer(submenu);
  item.classList.toggle("navigation__item--open", isOpen);
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

  if (isOpen) {
    submenu.hidden = false;
    submenu.setAttribute("data-state", "opening");

    window.requestAnimationFrame(() => {
      submenu.setAttribute("data-state", "open");
    });

    return;
  }

  submenu.setAttribute("data-state", "closing");
  submenu.__hideTimer = window.setTimeout(() => {
    submenu.hidden = true;
    submenu.setAttribute("data-state", "closed");
    clearPanelHideTimer(submenu);
  }, PANEL_TRANSITION_MS);
};

const closeSiblingItems = (item) => {
  const parentList = item.parentElement;
  if (!parentList) return;

  Array.from(parentList.children).forEach((sibling) => {
    if (sibling === item || !(sibling instanceof HTMLElement)) return;
    if (!sibling.classList.contains("navigation__item--has-children")) return;
    setNavigationItemOpen(sibling, false);
  });
};

const setMobileNavigationOpen = (navigation, isOpen) => {
  const toggle = navigation.querySelector(".navigation__mobile-toggle");
  if (!(toggle instanceof HTMLButtonElement)) return;

  navigation.classList.toggle("navigation--mobile-open", isOpen);
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

const initHeaderNavigation = (navigation) => {
  const items = getNavigationItems(navigation);
  items.forEach((item) => {
    const toggle = item.querySelector(".navigation__toggle");
    const link = item.querySelector(".navigation__link");
    if (!(toggle instanceof HTMLButtonElement)) return;

    setNavigationItemOpen(item, toggle.getAttribute("aria-expanded") === "true");

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      closeSiblingItems(item);
      setNavigationItemOpen(item, !isOpen);
    });

    if (link instanceof HTMLAnchorElement) {
      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (isOpen) return;

        event.preventDefault();
        closeSiblingItems(item);
        setNavigationItemOpen(item, true);
      });
    }

    item.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setNavigationItemOpen(item, false);
      toggle.focus();
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;

    items.forEach((item) => {
      if (item.contains(target)) return;
      setNavigationItemOpen(item, false);
    });
  });
};

const initMobileNavigation = (navigation) => {
  const toggle = navigation.querySelector(".navigation__mobile-toggle");
  if (!(toggle instanceof HTMLButtonElement)) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setMobileNavigationOpen(navigation, !isOpen);
  });

  navigation.querySelectorAll(".navigation__link").forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    const item = link.closest(".navigation__item");
    if (item?.classList.contains("navigation__item--has-children")) return;

    link.addEventListener("click", () => {
      setMobileNavigationOpen(navigation, false);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (navigation.contains(target)) return;
    setMobileNavigationOpen(navigation, false);
  });

  navigation.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setMobileNavigationOpen(navigation, false);
    toggle.focus();
  });

  const media = window.matchMedia("(min-width: 721px)");
  media.addEventListener("change", (event) => {
    if (event.matches) setMobileNavigationOpen(navigation, false);
  });
};

const initNavigation = () => {
  document.querySelectorAll(".navigation--header").forEach((navigation) => {
    if (!(navigation instanceof HTMLElement)) return;
    initHeaderNavigation(navigation);

    if (navigation.dataset.mobileMode === "panel") {
      initMobileNavigation(navigation);
    }
  });
};

initNavigation();
