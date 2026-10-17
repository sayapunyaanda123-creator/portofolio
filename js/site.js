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

  function teks(v, maks) { return typeof v === "string" ? v.slice(0, maks) : ""; }
  function tambah(induk, tag, kelas, isi) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (isi !== undefined) e.textContent = isi; // textContent: aman dari HTML/skrip
    induk.appendChild(e);
    return e;
  }
  function isiDaftar(id, daftar, buat) {
    var el = document.getElementById(id);
    if (!el || !Array.isArray(daftar)) return;
    el.textContent = "";
    daftar.slice(0, 12).forEach(function (x) {
      var n = x && typeof x === "object" ? buat(x) : null;
      if (n) el.appendChild(n);
    });
  }

  // Daftar Skill, Proyek, dan Layanan dari pengaturan
  function pasangDaftar(p) {
    isiDaftar("daftar-skill", p.skill, function (x) {
      var nama = teks(x.nama, 30);
      if (!nama) return null;
      var li = document.createElement("li");
      tambah(li, "strong", null, nama);
      var st = teks(x.status, 30);
      if (st) tambah(li, "span", null, st);
      return li;
    });
    isiDaftar("daftar-proyek", p.proyek, function (x) {
      var judul = teks(x.judul, 60);
      if (!judul) return null;
      var kartu = document.createElement("article");
      kartu.className = "kartu";
      if (SITE_CONFIG.gambarValid(x.gambar)) {
        var im = tambah(kartu, "img");
        im.src = x.gambar; im.alt = judul; im.loading = "lazy";
      }
      tambah(kartu, "span", "label", SITE_CONFIG.labelProyek.indexOf(x.label) >= 0 ? x.label : "Proyek Latihan");
      tambah(kartu, "h3", null, judul);
      var d = teks(x.deskripsi, 250);
      if (d) tambah(kartu, "p", null, d);
      var st = teks(x.status, 40);
      if (st) tambah(kartu, "p", "status", "Status: " + st);
      if (/^https:\/\/\S+$/.test(x.tautan || "")) {
        var a = tambah(kartu, "a", "tautan-proyek", "Buka proyek");
        a.href = x.tautan; a.target = "_blank"; a.rel = "noopener";
      }
      return kartu;
    });
    isiDaftar("daftar-layanan", p.layanan, function (x) {
      var judul = teks(x.judul, 50);
      if (!judul) return null;
      var li = document.createElement("li");
      tambah(li, "strong", null, judul);
      li.appendChild(document.createTextNode(teks(x.deskripsi, 200)));
      return li;
    });
    // Catatan "semua proyek adalah latihan" tidak boleh tampil jika ada Proyek Klien
    var punyaKlien = Array.isArray(p.proyek) && p.proyek.some(function (x) { return x && x.label === "Proyek Klien"; });
    var catatanSendiri = p.konten && p.konten.ket_proyek;
    var c = document.getElementById("ket-proyek");
    if (punyaKlien && !catatanSendiri && c) c.textContent = "Setiap proyek diberi label sesuai jenisnya.";
  }

  // Favicon: hanya file dari bucket "media" project ini yang diterima
  function pasangFavicon(f) {
    var u = f && f.url;
    if (typeof u !== "string" || u.indexOf(SITE_CONFIG.url + "/storage/v1/object/public/media/") !== 0) return;
    var l = document.querySelector('link[rel~="icon"]');
    if (!l) { l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); }
    l.removeAttribute("type");
    l.href = u;
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
      pasangDaftar(p);
      if (p.menu) pasangMenu(p.menu);
      if (p.favicon) pasangFavicon(p.favicon);
      if (p.tata) pasangTata(p.tata); // terakhir, agar menu ke bagian tersembunyi ikut hilang
    } catch (e) {
      console.warn("Pengaturan online tidak dimuat, memakai isi bawaan.", e);
    }
  }
  muat();
})();
