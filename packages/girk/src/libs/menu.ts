import { blockLine, blockSettings, blockMid } from "cli-block";

import { makePath } from "@/libs/files";
import { isHidden } from "@/libs/helpers";
import { isSectionsArchiveParent } from "@/libs/archives";
import { Payload, MenuItem } from "@/types";

const filterHomePage = (payload: Payload, item: MenuItem) => {
  const langUrls = ["/index.html", ...payload.languages.map((l) => `/${l}/index.html`)];

  return !langUrls.includes(item.link);
};

export const generateMenu = async (payload: Payload): Promise<Payload> => {
  let menu: MenuItem[] = payload.files
    .map((file) => {
      const hidden = isHidden(file.meta);
      let active = !hidden;

      const relativePath = file.path.replace(process.cwd(), "");
      const pathGroup = relativePath.split("/");
      const depth = pathGroup.length - 2;

      // Only items from the main depth should be in the menu
      if (depth > 0) active = false;

      // Index in first depth can also be in menu
      if (depth === 1 && file.home) active = !hidden;

      let link = makePath(file);

      if (file.meta.redirect) {
        link = file.meta.redirect;
      }

      return {
        id: file.id,
        name: file.title,
        link: link,
        active,
        language: file.language,
        icon: file.icon,
        order: file.meta.order || 999,
      };
    })
    .filter((item) => filterHomePage(payload, item))
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order);

  // Get Children of Articles

  menu.forEach((item) => {
    const file = payload.files.find((f) => f.id == item.id);
    if (!file) return;

    if (!!file.meta.archive && file.meta.menuChildren && !isSectionsArchiveParent(file)) {
      const children = payload.files
        .filter((f) => f.parent == file.name)
        .map((c) => ({
          id: c.id,
          name: c.title,
          link: makePath(c),
          active: !isHidden(c.meta),
          language: c.language,
          icon: c.icon,
          order: c.meta.order || 999,
        }))
        .filter((child) => child.active)
        .sort((a, b) => a.order - b.order);

      item.children = children;
    }
  });

  blockMid("Navigation");

  const menuItems = {};

  if (menu.length > 0) {
    if (menu.length == 1 && menu[0].link == "/index.html") {
      menu = [];
      blockLine("no menu to display");
    } else {
      menu.forEach((item) => {
        menuItems[item.name] = item.link;
      });
      await blockSettings(menuItems);
    }
  }

  return { ...payload, menu };
};
