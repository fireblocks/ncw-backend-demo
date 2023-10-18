import { LRUCache } from "lru-cache";
import ms from "ms";

export const banlist = new LRUCache<string, Date>({
  max: 10000,
  ttl: ms("1 day"),
});
