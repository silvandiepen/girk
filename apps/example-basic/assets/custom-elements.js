class ExampleNote extends HTMLElement {
  connectedCallback() {
    const message =
      this.getAttribute("data-text") || "Custom element loaded successfully.";

    this.innerHTML = `
      <aside style="border-left: 4px solid rgb(15 119 214); padding: 1rem 1.25rem; background: rgba(15, 119, 214, 0.08);">
        <strong style="display: block; margin-bottom: 0.35rem;">Interactive block</strong>
        <span>${message}</span>
      </aside>
    `;
  }
}

customElements.define("example-note", ExampleNote);
