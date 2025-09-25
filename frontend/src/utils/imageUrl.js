// MinIO dosya servisi tabanı (bucket dahil)
const S3_BASE =
  (import.meta?.env && import.meta.env.VITE_S3_BASE) ||
  "http://46.31.79.7:9000/dershanemedia";

// İstemiyorsak HTTPS'e zorlamıyoruz (varsayılan false)
const FORCE_HTTPS = String(
  (import.meta?.env && import.meta.env.VITE_FORCE_HTTPS) || "false"
).toLowerCase() === "true";

/** MinIO görsel URL normalizasyonu
 * - :9001/browser/...  → http://HOST:9000/<bucket>/<key>
 * - Absolute URL'de :9000 varsa https→http indir (SSL hatasını önle)
 * - Relative key'i S3_BASE ile birleştir, segmentleri encode et
 * - FORCE_HTTPS true ise sadece :9000 DIŞINDAKİ hostları https'e yükselt
 */
export function normalizeImageUrl(input) {
  if (!input) return null;
  let s = String(input).trim();

  // 1) MinIO Console linkini çevir
  const m = s.match(/^https?:\/\/([^/]+):9001\/browser\/([^?#]+)/i);
  if (m) {
    const host = m[1];
    const decodedPath = decodeURIComponent(m[2]); // "bucket/key"
    // :9000 her zaman HTTP
    return encodeURI(`http://${host}:9000/${decodedPath}`);
  }

  // 2) Absolute URL
  if (/^https?:\/\//i.test(s)) {
    // :9000 ise https → http indir (aksi halde SSL hatası)
    s = s.replace(/^https:\/\/([^/]+):9000/i, "http://$1:9000");

    // İstenirse https'e yükselt; ama :9000'i ASLA yükseltme
    if (FORCE_HTTPS && !/:9000(\/|$)/.test(s)) {
      s = s.replace(/^http:\/\//i, "https://");
    }
    return encodeURI(s);
  }

  // 3) Relative key (ör. "photos/karahindiba1.jpg")
  const safeKey = s.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  let url = `${S3_BASE.replace(/\/+$/, "")}/${safeKey}`;

  // :9000 ise kesin http
  url = url.replace(/^https:\/\/([^/]+):9000/i, "http://$1:9000");
  if (FORCE_HTTPS && !/:9000(\/|$)/.test(url)) {
    url = url.replace(/^http:\/\//i, "https://");
  }
  return url;
}

export default normalizeImageUrl;
