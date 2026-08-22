import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = customAlphabet(alphabet, 6);

export function reference(prefix: string, date = new Date()): string {
  const year = date.getFullYear().toString().slice(-2);
  return `${prefix}-${year}${String(date.getMonth() + 1).padStart(2, "0")}-${code()}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}
