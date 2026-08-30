import type { Clock } from "../packages/player-session";

export const systemClock: Clock = {
  get nowUnixSeconds() {
    return Math.floor(Date.now() / 1000);
  },
};
