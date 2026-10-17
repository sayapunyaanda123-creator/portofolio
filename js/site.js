// Mengambil pengaturan dari Supabase lalu menerapkannya ke website.
// Jika gagal (misalnya project sedang dijeda), website tetap tampil dengan isi bawaan di HTML.
(function () {
  function pasangKonten(k) {
    document.querySelectorAll("[data-konten]").forEach(function (el) {
      var nilai = k[el.dataset.konten];
      if (typeof nilai !== "string" || nilai.trim() === "") return;
      var tipe = el.dataset.tipe;
      if (tipe === "email") {
        el.textContent = nilai;
        el.href = "mailto:" + nilai;
      } else if (tipe === "tautan") {
        if (/^https:\/\//i.test(nilai)) el.href = nilai; // hanya tautan https yang diterima
      } else {
        el.textContent = nilai; // textContent aman: tidak menjalankan HTML/skrip
      }
    });
  }

  async function muat() {
    try {
      if (!window.supabase || !window.SITE_CONFIG) return;
      var db = window.supabase.createClient(SITE_CONFIG.url, SITE_CONFIG.key);
      var hasil = await db.from("site_settings").select("key,value");
      if (hasil.error || !hasil.data) return;
      hasil.data.forEach(function (baris) {
        if (baris.key === "tema") SITE_CONFIG.pasangTema(baris.value);
        if (baris.key === "konten") pasangKonten(baris.value || {});
      });
    } catch (e) {
      console.warn("Pengaturan online tidak dimuat, memakai isi bawaan.", e);
    }
  }
  muat();
})();
