async function simpan() {
  const nama = document.getElementById("nama").value;
  const alamat = document.getElementById("alamat").value;
  const hp = document.getElementById("hp").value;

  if (!nama) {
    alert("Nama wajib diisi");
    return;
  }

  const res = await apiPost({
    action: "addPelanggan",
    nama,
    alamat,
    hp
  });

  if (res.status === "ok") {
    localStorage.removeItem("cache_pelanggan"); // ⬅️ penting
    alert("Pelanggan tersimpan");
    loadPelanggan();
  }
}

async function loadPelanggan() {
  const CACHE_KEY = "cache_pelanggan";
  const CACHE_AGE = 10 * 60 * 1000; // 10 menit

  // 1️⃣ coba cache dulu
  const cached = getCache(CACHE_KEY, CACHE_AGE);
  if (cached) {
    console.log("Pelanggan dari cache");
    renderPelanggan(cached);
  }

  // 2️⃣ ambil data terbaru
  const fresh = await apiGet("getPelanggan");

// 🔒 CEK DOM SETELAH AWAIT
if (!document.getElementById("listPelanggan")) {
  console.warn("Skip render fresh: halaman sudah berubah");
  return;
}

setCache(CACHE_KEY, fresh);
renderPelanggan(fresh);
}

function renderPelanggan(data) {
  const ul = document.getElementById("listPelanggan");

  // 🔒 PENGAMAN UTAMA
  if (!ul) {
    console.warn("renderPelanggan dibatalkan: elemen #listPelanggan tidak ada");
    return;
  }

  ul.innerHTML = "";

  data.slice(1).forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r[0]} - ${r[1]}`;
    ul.appendChild(li);
  });
}


if (document.getElementById("listPelanggan")) {
  loadPelanggan();
}
