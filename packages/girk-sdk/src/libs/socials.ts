import { Payload } from "@/types";

export interface Social {
  icon?: string;
  link: string;
  name?: string;
  title: string;
}

export const generateSocials = async (payload: Payload): Promise<Payload> => {
  const socials = getSocials(payload.settings?.config);
  return { ...payload, socials };
};

export const getSocials = (config: Payload["settings"]["config"]): Social[] => {
  if (!config?.socials) return [];

  const socials: Social[] = [];
  config.socials.forEach((url: string) => {
    if (!url) return;
    const matches = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
    if (matches && matches[1])
      socials.push({
        link: url,
        name: url
          .replace(matches[1] || "", "")
          .replace(/^https?:\/\//, "")
          .replace("/", ""),
        title: (matches[1] || "").replace("www.", "").split(".")[0],
      });
  });

  return socials;
};
