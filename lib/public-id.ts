import { customAlphabet } from "nanoid";

// 21 chars from a URL-safe, unguessable alphabet (no lookalikes).
const nanoid = customAlphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz", 21);

export function newPublicId(): string {
  return nanoid();
}
