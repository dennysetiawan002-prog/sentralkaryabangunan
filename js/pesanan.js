/***********************
 * STATE
 ***********************/
let itemPesanan = [];
let mapHargaProduk = {};

/***********************
 * HELPER
 ***********************/
function generateIdPesanan() {
  return "PSN" + Date.now();
}

function formatRupiah(angka) {
  return Number(angka || 0).toLocaleString("id-ID");
}

/***********************
 * LOAD PRODUK (UNTUK HARGA CADANGAN)
 ***********************/
async function loadHargaProduk() {
  const data = await apiGet("getProduk");
  data.slice(1).forEach(r => {
    mapHargaProduk[r[0]] = Number(r[4]) || 0;
  });
}

/***********************
 * DROPDOWN PRODUK
 ***********************/
async function loadDropdownProduk() {
  const select = document.getElementById("produk");
  if (!select) return;

  select.innerHTML = "<option value=''>-- Pilih Produk --</option>";

  const data = await apiGet("getProduk");
  data.slice(1).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r[0];
    opt.textContent = `${r[1]} (Rp ${formatRupiah(r[4])})`;
    opt.dataset.harga = r[4];
    select.appendChild(opt);
  });
}

/***********************
 * DROPDOWN PELANGGAN
 ***********************/
async function loadDropdownPelanggan() {
  const select = document.getElementById("pelanggan");
  if (!select) return;

  select.innerHTML = "<option value=''>-- Pilih Pelanggan --</option>";

  const data = await apiGet("getPelanggan");
  data.slice(1).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r[0];
    opt.textContent = r[1];
    select.appendChild(opt);
  });
}

/***********************
 * TAMBAH ITEM
 ***********************/
function tambahItem() {
  const produkSelect = document.getElementById("produk");
  const kode_produk = produkSelect.value;
  if (!kode_produk) {
    alert("Pilih produk");
    return;
  }

  const opt = produkSelect.options[produkSelect.selectedIndex];
  const nama_produk = opt.textContent;
  const harga = Number(opt.dataset.harga || 0);
  const qty = Number(document.getElementById("qty").value || 1);

  const existing = itemPesanan.find(i => i.kode_produk === kode_produk);
  if (existing) {
    existing.qty += qty;
  } else {
    itemPesanan.push({ kode_produk, nama_produk, harga, qty });
  }

  renderItemPesanan();
  document.getElementById("qty").value = 1;
}

/***********************
 * RENDER ITEM PESANAN SEMENTARA
 ***********************/
function renderItemPesanan() {
  const ul = document.getElementById("listItemPesanan");
  if (!ul) return;

  ul.innerHTML = "";

  itemPesanan.forEach((item, i) => {
    const sub = item.qty * item.harga;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.nama_produk}</strong><br>
      Harga: Rp ${formatRupiah(item.harga)}<br>
      Qty:
      <button onclick="ubahQty(${i}, -1)">−</button>
      ${item.qty}
      <button onclick="ubahQty(${i}, 1)">+</button><br>
      Subtotal: <strong>Rp ${formatRupiah(sub)}</strong>
    `;
    ul.appendChild(li);
  });
}

/***********************
 * EDIT QTY
 ***********************/
function ubahQty(index, delta) {
  itemPesanan[index].qty += delta;
  if (itemPesanan[index].qty <= 0) {
    itemPesanan.splice(index, 1);
  }
  renderItemPesanan();
}

/***********************
 * SIMPAN PESANAN
 ***********************/
async function simpanPesananMulti() {
  const id_pesanan = generateIdPesanan();
  const pelangganSelect = document.getElementById("pelanggan");

  const id_pelanggan = pelangganSelect.value;
  const nama_pelanggan =
    pelangganSelect.options[pelangganSelect.selectedIndex]?.text || "";

  if (!id_pelanggan || itemPesanan.length === 0) {
    alert("Pilih pelanggan dan minimal 1 produk");
    return;
  }

  const nama_sales = localStorage.getItem("nama_sales") || "UNKNOWN";

  for (const item of itemPesanan) {
    await apiPost({
      action: "addPesanan",
      id_pesanan,
      id_pelanggan,
      nama_pelanggan,
      kode_produk: item.kode_produk,
      nama_produk: item.nama_produk,
      qty: item.qty,
      harga: item.harga,
      status: "PESAN",
      nama_sales
    });
  }

  itemPesanan = [];
  renderItemPesanan();
  localStorage.removeItem("cache_pesanan");

  alert("Pesanan tersimpan");
  loadPesanan();
}

/***********************
 * LOAD & LIST PESANAN
 ***********************/
async function loadPesanan() {
  const data = await apiGet("getPesanan");
  renderPesanan(data);
}

function renderPesanan(data) {
  const ul = document.getElementById("listPesanan");
  if (!ul) return;

  ul.innerHTML = "";
  const sudah = new Set();

  data.slice(1).forEach(r => {
    const id = r[0];
    const pelanggan = r[3];
    const status = r[8];

    if (status !== "PESAN") return;
    if (sudah.has(id)) return;
    sudah.add(id);

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${id}</strong> - ${pelanggan}
      <button onclick="lihatRincian('${id}')">Rincian</button>
      <button onclick="editPesanan('${id}')">Edit</button>
    `;
    ul.appendChild(li);
  });
}

/***********************
 * EDIT PESANAN (TARIK KE FORM)
 ***********************/
async function editPesanan(id_pesanan) {
  if (!confirm("Edit pesanan ini? Pesanan lama akan ditarik ke form.")) return;

  const data = await apiGet("getPesanan");
  const rows = data.slice(1).filter(r => r[0] === id_pesanan);
  if (rows.length === 0) return;

  document.getElementById("pelanggan").value = rows[0][2];

  itemPesanan = rows.map(r => ({
    kode_produk: r[4],
    nama_produk: r[5],
    qty: Number(r[7]),
    harga: Number(r[10]) || mapHargaProduk[r[4]] || 0
  }));

  renderItemPesanan();

  await apiPost({
    action: "hapusPesanan",
    id_pesanan,
    role: localStorage.getItem("role_sales")
  });

  localStorage.removeItem("cache_pesanan");
  alert("Pesanan siap diedit. Silakan ubah lalu simpan kembali.");
}

/***********************
 * RINCIAN PESANAN
 ***********************/
async function lihatRincian(id_pesanan) {
  const data = await apiGet("getPesanan");
  const rows = data.slice(1).filter(r => r[0] === id_pesanan);
  if (rows.length === 0) {
    alert("Data pesanan tidak ditemukan");
    return;
  }

  // ===== KONFIG TOKO =====
  const LOGO_URL = "https://github.com/dennysetiawan002-prog/sentralkaryabangunan/blob/main/sentral%20karya%20bangunan%20logo.jpg?raw=true"; // ganti logo toko
  const NAMA_TOKO = "SENTRAL KARYA BANGUNAN";
  const ALAMAT_TOKO = "Jl. Bukit Pesagi Lampung Utara";
  const KONTAK_TOKO = "HP/WA: 085366164414";

  // ===== DATA PESANAN =====
  const namaPelanggan = rows[0][3];
  const namaSales = rows[0][9];
  const tanggal = new Date(rows[0][1]).toLocaleString();

  let total = 0;

  let html = `
    <div style="text-align:center">
      <img src="${LOGO_URL}" style="max-width:80px"><br>
      <strong style="font-size:16px">${NAMA_TOKO}</strong><br>
      <small>${ALAMAT_TOKO}</small><br>
      <small>${KONTAK_TOKO}</small>
    </div>
    <hr>
    <strong>Pelanggan:</strong> ${namaPelanggan}<br>
    <strong>Sales:</strong> ${namaSales}<br>
    <strong>Tanggal:</strong> ${tanggal}
    <hr>
  `;

  rows.forEach(r => {
    const kode = r[4];
    const nama = r[5];
    const qty = Number(r[7]);
    const harga = Number(r[10]) || mapHargaProduk[kode] || 0;
    const sub = qty * harga;
    total += sub;

    html += `
      ${nama}<br>
      ${qty} × Rp ${formatRupiah(harga)} = 
      <strong>Rp ${formatRupiah(sub)}</strong>
      <hr>
    `;
  });

  html += `
    <h3 style="text-align:right">
      TOTAL: Rp ${formatRupiah(total)}
    </h3>
    <div style="text-align:center">
      <button onclick="window.print()">🖨️ Cetak</button>
    </div>
  `;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
    <head>
      <title>Nota Penjualan</title>
      <style>
        body {
          font-family: monospace;
          padding: 10px;
        }
        img { margin-bottom: 5px; }
        button {
          padding: 8px 14px;
          font-size: 14px;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `);
}



/***********************
 * INIT
 ***********************/
if (document.getElementById("listPesanan")) {
  loadHargaProduk();
  loadDropdownProduk();
  loadDropdownPelanggan();
  loadPesanan();
}
