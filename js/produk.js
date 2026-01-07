/***********************
 * HELPER
 ***********************/
function formatRupiah(angka) {
  return Number(angka || 0).toLocaleString("id-ID");
}

/***********************
 * ROLE CHECK
 ***********************/
const role = localStorage.getItem("role_sales");

if (role === "admin") {
  document.getElementById("formProduk").style.display = "block";
} else {
  document.getElementById("info").innerText =
    "Akses terbatas. Hanya admin yang dapat menambah atau mengubah produk.";
}

/***********************
 * SIMPAN PRODUK (ADMIN)
 ***********************/
async function simpanProduk() {
  if (role !== "admin") {
    alert("Akses ditolak");
    return;
  }

  const nama_produk = document.getElementById("nama_produk").value;
  const supplier = document.getElementById("supplier").value;
  const harga_modal = Number(document.getElementById("harga_modal").value || 0);
  const harga_jual = Number(document.getElementById("harga_jual").value || 0);
  const stok = Number(document.getElementById("stok").value || 0);
  const file = document.getElementById("foto").files[0];

  if (!nama_produk || harga_jual <= 0) {
    alert("Nama produk dan harga jual wajib diisi");
    return;
  }

  let fotoBase64 = "";
  if (file) {
    fotoBase64 = await toBase64(file);
  }

  const res = await apiPost({
    action: "addProduk",
    nama_produk,
    supplier,
    harga_modal,
    harga_jual,
    stok,
    foto: fotoBase64
  });

  if (res.status === "ok") {
    alert("Produk tersimpan: " + res.kode_produk);
    document.querySelectorAll("#formProduk input").forEach(i => i.value = "");
    localStorage.removeItem("cache_produk");
    loadProduk();
  } else {
    alert("Gagal menyimpan produk");
  }
}

/***********************
 * LOAD PRODUK
 ***********************/
async function loadProduk() {
  const CACHE_KEY = "cache_produk";
  const CACHE_AGE = 10 * 60 * 1000;

  const cached = getCache(CACHE_KEY, CACHE_AGE);
  if (cached) renderProduk(cached);

  const fresh = await apiGet("getProduk");
  setCache(CACHE_KEY, fresh);
  renderProduk(fresh);
}

/***********************
 * RENDER PRODUK
 ***********************/
function renderProduk(data) {
  const ul = document.getElementById("listProduk");
  if (!ul) return;

  ul.innerHTML = "";

  // ⬅️ SORT PRODUK BERDASARKAN NAMA (A–Z)
  const rows = data.slice(1).sort((a, b) => {
    return a[1].localeCompare(b[1], "id", { sensitivity: "base" });
  });

  rows.forEach(r => {
    const kode = r[0];
    const nama = r[1];
    const supplier = r[2];
    const harga_jual = r[4];
    const foto = r[6];

    const li = document.createElement("li");

    let tombolFoto = "";
    if (foto) {
      tombolFoto = `<button onclick="lihatFoto('${foto}')">Lihat Foto</button>`;
    }

    li.innerHTML = `
      <strong>${nama}</strong><br>
      <small>Kode: ${kode}</small><br>
      <small>Supplier: ${supplier}</small><br>
      <strong>Rp ${formatRupiah(harga_jual)}</strong><br>
      ${tombolFoto}
    `;

    ul.appendChild(li);
  });

  if (ul.children.length === 0) {
    ul.innerHTML = "<li>Belum ada produk</li>";
  }
}


/***********************
 * LIHAT FOTO PRODUK
 ***********************/
function lihatFoto(url) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Foto Produk</title>
      <style>
        body {
          margin: 0;
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        img {
          max-width: 100%;
          max-height: 100vh;
        }
      </style>
    </head>
    <body>
      <img src="${url}">
    </body>
    </html>
  `);
}

/***********************
 * BASE64 HELPER
 ***********************/
function toBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/***********************
 * INIT
 ***********************/
loadProduk();
