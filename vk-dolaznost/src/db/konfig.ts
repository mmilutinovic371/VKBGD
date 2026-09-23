/**
 * Odakle se čita baza. Na Vercelu: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 * (hostovani libSQL). Lokalno, bez tih promenljivih: fajl ./podaci/vk.db.
 */
export function bazaKonfig() {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return { url, authToken: process.env.TURSO_AUTH_TOKEN };
  }
  const fajl = process.env.DATABASE_FILE ?? "./podaci/vk.db";
  return { url: `file:${fajl}` };
}
