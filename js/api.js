// GANTI dengan URL /exec dari Apps Script Anda
const API_URL = "https://script.google.com/macros/s/AKfycbzSayzQPp2Wcit6USPCOLThzMentT2upI6jF304rQbXhfZPOfpVaPxrj8uet9KsWCKG/exec";

async function apiGet(action) {
  const res = await fetch(API_URL + "?action=" + action);
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}

function testAddPelanggan() {
  addPelanggan({
    nama: "TEST USER",
    alamat: "TEST ALAMAT",
    hp: "08123456789"
  });
}
// ===== CACHE HELPER =====
function setCache(key, data) {
  const payload = {
    time: Date.now(),
    data: data
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

function getCache(key, maxAgeMs) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);

    // cek umur cache
    if (Date.now() - payload.time > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }

    return payload.data;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
}
