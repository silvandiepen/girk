/**
 * Render an icon (svg or img) as an HTML string.
 *
 * This was previously a pug mixin (icon.pug). Now a plain function
 * that gets passed into all EJS templates.
 */
export function renderIcon(
  icon: { svg?: string; src?: string } | undefined,
  wrapperClass: string,
  assetClass: string
): string {
  if (!icon) return "";
  let out = `<span class="${wrapperClass}" aria-hidden="true">`;
  if (icon.svg) {
    out += `<span class="${assetClass}">${icon.svg}</span>`;
  } else if (icon.src) {
    out += `<img class="${assetClass}" src="${icon.src}" alt="">`;
  }
  out += "</span>";
  return out;
}
