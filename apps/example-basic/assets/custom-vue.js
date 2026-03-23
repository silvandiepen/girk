import { createApp } from "https://esm.sh/vue@3.5.13";

const target = document.querySelector("[data-vue-example]");

if (target) {
  const message =
    target.getAttribute("data-message") ||
    "Vue mounted this block through projectScriptModule.";

  createApp({
    data() {
      return {
        message,
      };
    },
    template: `
      <aside style="border-left: 4px solid rgb(28 83 52); padding: 1rem 1.25rem; background: rgba(28, 83, 52, 0.08);">
        <strong style="display: block; margin-bottom: 0.35rem;">Vue block</strong>
        <span>{{ message }}</span>
      </aside>
    `,
  }).mount(target);
}
