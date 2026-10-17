// Menu ponsel: buka dan tutup saat tombol "Menu" diklik
const tombol = document.getElementById("tombol-menu");
const menu = document.getElementById("menu");

tombol.addEventListener("click", function () {
  const terbuka = menu.classList.toggle("terbuka");
  tombol.setAttribute("aria-expanded", terbuka);
});

// Tutup menu setelah salah satu tautan diklik.
// Satu pendengar di elemen menu cukup, jadi tetap berfungsi walau daftar menu diganti dari panel admin.
menu.addEventListener("click", function (e) {
  if (e.target.closest("a")) {
    menu.classList.remove("terbuka");
    tombol.setAttribute("aria-expanded", "false");
  }
});

// Isi tahun di footer otomatis
document.getElementById("tahun").textContent = new Date().getFullYear();
