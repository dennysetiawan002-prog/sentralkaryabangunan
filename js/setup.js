async function simpanSetup() {
  const nama = document.getElementById("nama").value;
  const role = document.querySelector('input[name="role"]:checked')?.value;
  const pass = document.getElementById("password").value;

  if (!nama || !role) {
    alert("Nama dan role wajib diisi");
    return;
  }

  // jika admin, cek password ke Google Sheets
  if (role === "admin") {
    const res = await apiGet("cekAdmin&pass=" + encodeURIComponent(pass));
    if (!res.valid) {
      alert("Password admin salah");
      return;
    }
  }

  // simpan ke device
  localStorage.setItem("nama_sales", nama);
  localStorage.setItem("role_sales", role);

  // masuk ke menu utama
  location.href = "index.html";
}

// tampilkan field password hanya jika admin dipilih
document.querySelectorAll('input[name="role"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.getElementById("password").style.display =
      radio.value === "admin" ? "block" : "none";
  });
});
