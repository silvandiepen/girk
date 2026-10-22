const getNavigationItems = (navigation) =>
  Array.from(
    navigation.querySelectorAll(".navigation__item--has-children")
  );

const PANEL_TRANSITION_MS = 180;
const DESKTOP_NAVIGATION_MEDIA = "(min-width: 961px)";

const clearPanelHideTimer = (submenu) => {
  if (!submenu || typeof submenu.__hideTimer !== "number") return;

  window.clearTimeout(submenu.__hideTimer);
  delete submenu.__hideTimer;
};

const setNavigationItemPanelAlignment = (item) => {
  const toggle = item.querySelector(".navigation__toggle");
  const controls = toggle?.getAttribute("aria-controls");
  const submenu = controls ? document.getElementById(controls) : null;

  item.classList.remove("navigation__item--align-end");

  if (!submenu || !window.matchMedia(DESKTOP_NAVIGATION_MEDIA).matches) return;

  const gutter = 16;
  const submenuRect = submenu.getBoundingClientRect();

  if (submenuRect.right > window.innerWidth - gutter) {
    item.classList.add("navigation__item--align-end");
  }

  if (!item.classList.contains("navigation__item--align-end")) return;

  const alignedRect = submenu.getBoundingClientRect();
  if (alignedRect.left < gutter) {
    item.classList.remove("navigation__item--align-end");
  }
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
    setNavigationItemPanelAlignment(item);

    window.requestAnimationFrame(() => {
      setNavigationItemPanelAlignment(item);
      submenu.setAttribute("data-state", "open");
    });

    return;
  }

  item.classList.remove("navigation__item--align-end");
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

/*
 * The open mobile panel covers the viewport, so everything around it is made
 * inert: Tab stays inside the menu and the page behind it cannot scroll.
 */
const setOutsideInert = (element, isInert) => {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    Array.from(node.parentElement?.children || []).forEach((sibling) => {
      if (sibling === node || sibling.tagName === "SCRIPT") return;
      sibling.inert = isInert;
    });
  }
  document.documentElement.classList.toggle("navigation-scroll-lock", isInert);
};

const setMobileNavigationOpen = (navigation, isOpen) => {
  const toggle = navigation.querySelector(".navigation__mobile-toggle");
  if (!(toggle instanceof HTMLButtonElement)) return;

  const wasOpen = navigation.classList.contains("navigation--mobile-open");
  navigation.classList.toggle("navigation--mobile-open", isOpen);
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  if (wasOpen !== isOpen) setOutsideInert(navigation, isOpen);
};

const initHeaderNavigation = (navigation) => {
  const items = getNavigationItems(navigation);

  const updateOpenPanelAlignment = () => {
    items.forEach((item) => {
      if (!item.classList.contains("navigation__item--open")) return;
      setNavigationItemPanelAlignment(item);
    });
  };

  items.forEach((item) => {
    const toggle = item.querySelector(".navigation__toggle");
    if (!(toggle instanceof HTMLButtonElement)) return;

    setNavigationItemOpen(item, toggle.getAttribute("aria-expanded") === "true");

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      closeSiblingItems(item);
      setNavigationItemOpen(item, !isOpen);
    });

    // The link navigates; only the toggle button opens the panel.
    item.addEventListener("focusout", (event) => {
      if (event.relatedTarget instanceof Node && item.contains(event.relatedTarget)) return;
      if (toggle.getAttribute("aria-expanded") === "true") setNavigationItemOpen(item, false);
    });

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

  window.addEventListener("resize", updateOpenPanelAlignment);
};

const initMobileNavigation = (navigation) => {
  const toggle = navigation.querySelector(".navigation__mobile-toggle");
  if (!(toggle instanceof HTMLButtonElement)) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setMobileNavigationOpen(navigation, !isOpen);
  });

  navigation.querySelectorAll(".navigation__link, .navigation__group-link").forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;

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

  const media = window.matchMedia(DESKTOP_NAVIGATION_MEDIA);
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
