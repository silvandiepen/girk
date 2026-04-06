(function () {
  var manifestPromise;
  var shardCache = new Map();
  var state = {
    shell: null,
    dialog: null,
    input: null,
    results: null,
    openButtons: [],
    closeButtons: [],
    lastFocusedElement: null,
  };

  function normalize(input) {
    return String(input || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(input) {
    return normalize(input)
      .split(" ")
      .filter(function (token) {
        return token.length > 1;
      });
  }

  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function readJson(path) {
    return fetch(path).then(function (response) {
      if (!response.ok) {
        throw new Error("Search asset request failed: " + path);
      }

      return response.json();
    });
  }

  function getManifest() {
    if (!manifestPromise) {
      manifestPromise = readJson("/assets/search/manifest.json");
    }

    return manifestPromise;
  }

  function getShard(shard) {
    if (!shardCache.has(shard.path)) {
      shardCache.set(shard.path, readJson(shard.path));
    }

    return shardCache.get(shard.path);
  }

  function getLanguageShards(manifest) {
    var currentLanguage = document.documentElement.lang || "en";
    var matching = manifest.shards.filter(function (shard) {
      return shard.language === currentLanguage;
    });

    if (matching.length) return matching;

    return manifest.shards;
  }

  function getMatchingTerms(shard, token) {
    var matches = [];

    Object.keys(shard.terms).forEach(function (term) {
      if (term === token) {
        matches.push({ term: term, factor: 1 });
        return;
      }

      if (term.indexOf(token) === 0) {
        matches.push({ term: term, factor: 0.65 });
      }
    });

    return matches;
  }

  function rankResults(query, shards, limit) {
    var scores = new Map();
    var tokens = tokenize(query);
    var normalizedQuery = normalize(query);

    if (!tokens.length) return [];

    shards.forEach(function (shard) {
      tokens.forEach(function (token) {
        getMatchingTerms(shard, token).forEach(function (match) {
          shard.terms[match.term].forEach(function (posting) {
            var id = posting[0];
            var score = posting[1] * match.factor;
            scores.set(id, (scores.get(id) || 0) + score);
          });
        });
      });
    });

    return Array.from(scores.entries())
      .map(function (entry) {
        var id = entry[0];
        var score = entry[1];
        var documentRecord;

        shards.some(function (shard) {
          if (!shard.docs[id]) return false;
          documentRecord = shard.docs[id];
          return true;
        });

        if (!documentRecord) return null;

        var normalizedTitle = normalize(documentRecord.title);

        if (normalizedTitle === normalizedQuery) score += 40;
        else if (normalizedTitle.indexOf(normalizedQuery) === 0) score += 24;
        else if (normalizedTitle.indexOf(normalizedQuery) >= 0) score += 12;

        return {
          score: score,
          document: documentRecord,
        };
      })
      .filter(Boolean)
      .sort(function (left, right) {
        if (right.score !== left.score) return right.score - left.score;
        return left.document.title.localeCompare(right.document.title);
      })
      .slice(0, limit)
      .map(function (result) {
        return result.document;
      });
  }

  function getScope() {
    if (!state.dialog) return "project";
    return state.dialog.getAttribute("data-search-scope") || "project";
  }

  function getScopePredicate() {
    var scope = getScope();
    var pageId = state.dialog ? state.dialog.getAttribute("data-search-page-id") : "";
    var branch = state.dialog ? state.dialog.getAttribute("data-search-branch") : "";

    if (scope === "page" && pageId) {
      return function (documentRecord) {
        return documentRecord.id === pageId;
      };
    }

    if (scope === "archive" && branch) {
      return function (documentRecord) {
        return documentRecord.branch === branch;
      };
    }

    return function () {
      return true;
    };
  }

  function renderResults(query, results) {
    if (!state.results) return;

    if (!normalize(query)) {
      state.results.innerHTML = "";
      state.results.hidden = true;
      return;
    }

    state.results.hidden = false;

    if (!results.length) {
      state.results.innerHTML =
        '<p class="search-results__empty">No results for <strong>' +
        escapeHtml(query) +
        "</strong>.</p>";
      return;
    }

    state.results.innerHTML =
      '<ul class="search-results__list">' +
      results
        .map(function (result) {
          return (
            '<li class="search-results__item">' +
            '<a class="search-results__link" href="' +
            escapeHtml(result.link) +
            '">' +
            '<span class="search-results__title">' +
            escapeHtml(result.title) +
            "</span>" +
            (result.excerpt
              ? '<span class="search-results__excerpt">' +
                escapeHtml(result.excerpt) +
                "</span>"
              : "") +
            "</a>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>";
  }

  function debounce(callback, delay) {
    var timeout;

    return function () {
      var args = arguments;
      var context = this;

      window.clearTimeout(timeout);
      timeout = window.setTimeout(function () {
        callback.apply(context, args);
      }, delay);
    };
  }

  function setOpenState(isOpen) {
    state.openButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", String(isOpen));
    });

    if (state.shell) {
      state.shell.hidden = !isOpen;
      state.shell.classList.toggle("search-shell--open", isOpen);
    }

    document.documentElement.classList.toggle("search-open", isOpen);
    document.body.classList.toggle("search-open", isOpen);
  }

  function openSearch() {
    if (!state.shell || !state.input) return;

    state.lastFocusedElement = document.activeElement;
    setOpenState(true);
    window.requestAnimationFrame(function () {
      state.input.focus();
      state.input.select();
    });
  }

  function closeSearch() {
    if (!state.shell) return;

    setOpenState(false);

    if (
      state.lastFocusedElement &&
      typeof state.lastFocusedElement.focus === "function"
    ) {
      state.lastFocusedElement.focus();
    }
  }

  async function search(query) {
    if (!normalize(query)) {
      renderResults("", []);
      return;
    }

    var manifest = await getManifest();
    var shards = await Promise.all(
      getLanguageShards(manifest).map(function (descriptor) {
        return getShard(descriptor);
      })
    );
    var allowDocument = getScopePredicate();

    renderResults(
      query,
      rankResults(query, shards, 24)
        .filter(allowDocument)
        .slice(0, 8)
    );
  }

  function bindEvents() {
    var handleInput = debounce(function () {
      search(state.input.value || "");
    }, 120);

    state.openButtons.forEach(function (button) {
      button.addEventListener("click", openSearch);
    });

    state.closeButtons.forEach(function (button) {
      button.addEventListener("click", closeSearch);
    });

    state.shell.addEventListener("click", function (event) {
      if (event.target === state.shell) {
        closeSearch();
      }
    });

    state.dialog.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    state.input.addEventListener("input", handleInput);
    state.input.addEventListener("search", function () {
      search(state.input.value || "");
    });

    state.results.addEventListener("click", function (event) {
      var target = event.target.closest("a");
      if (!target) return;
      closeSearch();
    });

    document.addEventListener("keydown", function (event) {
      if (!state.shell || state.shell.hidden) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openSearch();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    });
  }

  function initSearch() {
    state.shell = document.querySelector("[data-search-shell]");
    state.dialog = document.querySelector("[data-search-dialog]");
    state.input = document.querySelector("[data-search-input]");
    state.results = document.querySelector("[data-search-results]");
    state.openButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-search-open]")
    );
    state.closeButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-search-close]")
    );

    if (!state.shell || !state.dialog || !state.input || !state.results) return;

    bindEvents();
  }

  window.GirkSearch = {
    open: openSearch,
    close: closeSearch,
    search: search,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearch);
  } else {
    initSearch();
  }
})();
