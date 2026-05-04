// Robots.txt generation — in-memory version

import { Payload } from "@/types";

/**
 * Build robots.txt content from payload config.
 */
export const buildRobots = (payload: Payload): string | null => {
  if (payload.project?.noRobots) return null;
  return `User-agent: *\nAllow: /`;
};

/**
 * Generate robots.txt and add to payload.
 * In SDK mode, stores the content on payload.robots instead of writing to disk.
 */
export const generateRobots = (payload: Payload): Payload => {
  const content = buildRobots(payload);
  if (content) {
    return { ...payload, robots: content };
  }
  return payload;
};
