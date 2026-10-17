// Mengambil pengaturan dari Supabase lalu menerapkannya ke website.
// Jika gagal (misalnya project sedang dijeda), website tetap tampil dengan isi bawaan di HTML.
(function () {
  var IDS = ["tentang", "skill", "proyek", "layanan", "kontak"];

  function pasangKonten(k) {
    document.querySelectorAll("[data-konten]").forEach(function (el) {
      var nilai = k[el.dataset.konten];
      if (typeof nilai !== "string" || nilai.trim() === "") return;
      var tipe = el.dataset.tipe;
      if (tipe === "email") {
        el.textContent = nilai;
        el.href = "mailto:" + nilai;
      } else if (tipe === "tautan") {
        if (/^https:\/\//i.test(nilai)) el.href = nilai;
      } else {
        el.textContent = nilai; // textContent aman: tidak menjalankan HTML/skrip
      }
    });
    // Tujuan tombol: #bagian atau https://
    document.querySelectorAll("[data-tautan]").forEach(function (el) {
      var t = k[el.dataset.tautan];
      if (!SITE_CONFIG.tujuanValid(t)) return;
      el.href = t;
      if (t.indexOf("https://") === 0) { el.target = "_blank"; el.rel = "noopener"; }
    });
  }

  // Membuat ulang daftar menu dari pengaturan (maksimal 8)
  function pasangMenu(daftar) {
    var nav = document.getElementById("menu");
    if (!nav || !Array.isArray(daftar) || !daftar.length) return;
    nav.textContent = "";
    daftar.slice(0, 8).forEach(function (m) {
      if (!m || typeof m.label !== "string" || !m.label.trim() || !SITE_CONFIG.tujuanValid(m.tujuan)) return;
      var a = document.createElement("a");
      a.textContent = m.label.slice(0, 20);
      a.href = m.tujuan;
      if (m.tujuan.indexOf("https://") === 0) { a.target = "_blank"; a.rel = "noopener"; }
      nav.appendChild(a);
    });
  }

  // Tata letak bagian utama dan tampil/sembunyi bagian halaman
  function pasangTata(t) {
    var hero = document.getElementById("beranda");
    if (t.rata === "tengah") hero.classList.add("tengah");
    if (t.ukuran === "kecil" || t.ukuran === "besar") hero.classList.add("ukuran-" + t.ukuran);
    ["tombol1", "tombol2"].forEach(function (n) {
      if (t[n] !== false) return;
      var a = document.querySelector('[data-tautan="hero_' + n + '_tautan"]');
      if (a) a.hidden = true;
    });
    var b = t.bagian || {};
    IDS.forEach(function (id) {
      if (b[id] !== false) return;
      var s = document.getElementById(id);
      if (s) s.hidden = true;
      document.querySelectorAll('#menu a[href="#' + id + '"]').forEach(function (l) { l.remove(); });
    });
  }

  async function muat() {
    try {
      if (!window.supabase || !window.SITE_CONFIG) return;
      var db = window.supabase.createClient(SITE_CONFIG.url, SITE_CONFIG.key);
      var hasil = await db.from("site_settings").select("key,value");
      if (hasil.error || !hasil.data) return;
      var p = {};
      hasil.data.forEach(function (b) { p[b.key] = b.value; });
      if (p.tema) SITE_CONFIG.pasangTema(p.tema);
      if (p.konten) pasangKonten(p.konten);
      if (p.menu) pasangMenu(p.menu);
      if (p.tata) pasangTata(p.tata); // terakhir, agar menu ke bagian tersembunyi ikut hilang
    } catch (e) {
      console.warn("Pengaturan online tidak dimuat, memakai isi bawaan.", e);
    }
  }
  muat();
})();
