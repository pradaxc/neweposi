// Normalisasi daftar keys: pisahkan koma, hapus spasi, dan bersihkan string kosong
const rawKeys = process.env.LICENCE_KEYS || "lesbian";
const KEYS = new Set(
  rawKeys
    .split(",")
    .map(k => k.trim())
    .filter(Boolean)
);

const EXPIRED_AT = process.env.EXPIRED_AT || "2099-12-31 23:59:59";

// Helper untuk mengekstrak key dari berbagai struktur JSON yang umum
function extractKey(data) {
  if (!data || typeof data !== "object") return null;

  // Cek jika nested di dalam users[0] atau freefire
  const u = (Array.isArray(data.users) && data.users[0]) || data;
  const target = u.freefire || u;

  // Cek berbagai variasi field: username, key, licence, license
  const rawKey = target.username || target.key || target.licence || target.license || null;
  
  return rawKey ? String(rawKey).trim() : null;
}

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");

  // Handler utama untuk memproses JSON yang sudah didapat
  const handlePayload = (payload) => {
    let key = null;

    try {
      const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
      key = extractKey(parsed);
    } catch (_) {
      // Gagal parse JSON
    }

    // Validasi kecocokan key
    if (!key || !KEYS.has(key)) {
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: "FAILED",
        message: "Invalid key"
      }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "OK",
      signature: "0123456789abcdeffedcba9876543210",
      expired_at: EXPIRED_AT,
      message: "Login successful"
    }));
  };

  // 1. Jika req.body sudah diparsing otomatis oleh platform/framework
  if (req.body) {
    return handlePayload(req.body);
  }

  // 2. Fallback jika masih berupa raw stream
  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => handlePayload(body));
};
