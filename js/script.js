// Menu ponsel: buka dan tutup saat tombol "Menu" diklik
const tombol = document.getElementById("tombol-menu");
const menu = document.getElementById("menu");

tombol.addEventListener("click", function () {
  const terbuka = menu.classList.toggle("terbuka");
  tombol.setAttribute("aria-expanded", terbuka);
});

// Tutup menu otomatis setelah salah satu tautan diklik
menu.querySelectorAll("a").forEach(function (tautan) {
  tautan.addEventListener("click", function () {
    menu.classList.remove("terbuka");
    tombol.setAttribute("aria-expanded", "false");
  });
});

// Isi tahun di footer otomatis
document.getElementById("tahun").textContent = new Date().getFullYear();
