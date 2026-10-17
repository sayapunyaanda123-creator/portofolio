(function () {
  var C = window.SITE_CONFIG;
  var db = window.supabase.createClient(C.url, C.key);
  var $ = function (id) { return document.getElementById(id); };
  // S menyimpan data terakhir dari database: teks (konten), tata letak (tata), dan daftar menu
  var S = { konten: {}, tata: {}, menu: [] };

  var BAGIAN = [["tentang", "Tentang saya"], ["skill", "Skill"], ["proyek", "Proyek"], ["layanan", "Layanan"], ["kontak", "Kontak"]];
  var MENU_BAWAAN = [["tentang", "Tentang"], ["skill", "Skill"], ["proyek", "Proyek"], ["layanan", "Layanan"], ["kontak", "Kontak"]];
  // Kolom: [id, label, jenis, batas karakter, contoh isi bawaan]
  var TEKS = {
    hero: [
      ["hero_nama", "Nama (judul besar)", "text", 60, "Ahmad Dery SA"],
      ["hero_peran", "Posisi", "text", 80, "Aspiring Web Developer"],
      ["hero_pengantar", "Kalimat pembuka", "area", 300, "Saya sedang belajar membuat website yang rapi, responsif, dan mudah dipakai untuk UMKM dan usaha lokal."],
      ["hero_tombol1_teks", "Tombol 1: tulisan", "text", 30, "Hubungi saya"],
      ["hero_tombol1_tautan", "Tombol 1: tujuan", "tujuan", 200, "#kontak"],
      ["hero_tombol2_teks", "Tombol 2: tulisan", "text", 30, "Lihat proyek"],
      ["hero_tombol2_tautan", "Tombol 2: tujuan", "tujuan", 200, "#proyek"]
    ],
    logo: [["logo_teks", "Teks logo (kiri atas)", "text", 30, "Dery SA"]],
    judul: BAGIAN.map(function (b) { return ["judul_" + b[0], "Judul bagian " + b[1], "text", 40, b[1]]; }),
    isi: [
      ["tentang_1", "Tentang saya, paragraf 1", "area", 500, "Saya Dery, pemula di bidang web development. ..."],
      ["tentang_2", "Tentang saya, paragraf 2", "area", 500, "Tujuan saya: mendapatkan pekerjaan di bidang web ..."],
      ["kontak_pengantar", "Kalimat di bagian Kontak", "text", 200, "Punya proyek kecil atau lowongan yang cocok? ..."],
      ["kontak_email", "Email", "email", 120, "emailanda@example.com"],
      ["kontak_github", "Tautan GitHub (https://)", "url", 200, "https://github.com/username"],
      ["kontak_linkedin", "Tautan LinkedIn (https://)", "url", 200, "https://www.linkedin.com/in/username"]
    ]
  };

  function pesan(teks, galat) { var s = $("status"); s.textContent = teks; s.className = galat ? "galat" : "ok"; }
  function terjemahkanGalat(e) {
    return /row-level security/i.test(e.message)
      ? "Ditolak oleh aturan keamanan. Pastikan email di supabase-setup.sql sama persis dengan email yang dipakai login."
      : e.message;
  }
  function tampil(login) {
    $("tampilan-login").hidden = !login;
    $("tampilan-panel").hidden = login;
    $("keluar").hidden = login;
  }

  // ----- membuat kolom dari daftar -----
  function buatKolom(f, wadah) {
    var l = document.createElement("label");
    l.htmlFor = f[0]; l.textContent = f[1];
    var el = document.createElement(f[2] === "area" ? "textarea" : "input");
    el.id = f[0]; el.maxLength = f[3]; el.placeholder = f[4];
    if (f[2] === "email") el.type = "email";
    else if (f[2] === "url") { el.type = "url"; el.pattern = "https://.*"; }
    else if (f[2] !== "area") el.type = "text";
    if (f[2] === "tujuan") el.setAttribute("list", "daftar-tujuan");
    wadah.appendChild(l); wadah.appendChild(el);
  }
  TEKS.hero.forEach(function (f) { buatKolom(f, $("kolom-hero")); });
  TEKS.logo.forEach(function (f) { buatKolom(f, $("kolom-logo")); });
  BAGIAN.forEach(function (b, i) {
    var cek = document.createElement("label");
    cek.className = "cek";
    var c = document.createElement("input");
    c.type = "checkbox"; c.id = "tampil_" + b[0];
    cek.appendChild(c);
    cek.appendChild(document.createTextNode(" Tampilkan bagian " + b[1]));
    $("kolom-bagian").appendChild(cek);
    buatKolom(TEKS.judul[i], $("kolom-bagian"));
  });
  TEKS.isi.forEach(function (f) { buatKolom(f, $("kolom-bagian")); });

  Object.keys(C.fonts).forEach(function (k) {
    var o = document.createElement("option");
    o.value = k; o.textContent = C.fonts[k].nama;
    $("font").appendChild(o);
  });

  // ----- membaca dan menyimpan -----
  function bacaTeks(daftar) {
    daftar.forEach(function (f) {
      var v = $(f[0]).value.trim();
      if (v) S.konten[f[0]] = v; else delete S.konten[f[0]];
    });
  }
  function cekTujuan(daftar) {
    for (var i = 0; i < daftar.length; i++) {
      var f = daftar[i], v = $(f[0]).value.trim();
      if (f[2] === "tujuan" && v && !C.tujuanValid(v)) {
        pesan(f[1] + " harus berupa #bagian (contoh #kontak) atau tautan yang diawali https://", true);
        $(f[0]).focus();
        return false;
      }
    }
    return true;
  }
  async function upsert(key, value) {
    var h = await db.from("site_settings").upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    if (h.error) { pesan("Gagal menyimpan: " + terjemahkanGalat(h.error), true); return false; }
    return true;
  }
  async function hapus(key) {
    var h = await db.from("site_settings").delete().eq("key", key);
    if (h.error) { pesan("Gagal mengembalikan: " + terjemahkanGalat(h.error), true); return false; }
    return true;
  }
  var TERSIMPAN = "Tersimpan. Muat ulang website untuk melihat hasilnya.";

  // ----- menampilkan data ke formulir -----
  function isiFormulir() {
    [TEKS.hero, TEKS.logo, TEKS.judul, TEKS.isi].forEach(function (d) {
      d.forEach(function (f) { $(f[0]).value = S.konten[f[0]] || ""; });
    });
    $("rata").value = S.tata.rata === "tengah" ? "tengah" : "kiri";
    $("ukuran").value = S.tata.ukuran === "kecil" || S.tata.ukuran === "besar" ? S.tata.ukuran : "sedang";
    $("tombol1").checked = S.tata.tombol1 !== false;
    $("tombol2").checked = S.tata.tombol2 !== false;
    BAGIAN.forEach(function (b) { $("tampil_" + b[0]).checked = (S.tata.bagian || {})[b[0]] !== false; });
  }
  function menuBawaan() {
    return MENU_BAWAAN.map(function (m) { return { label: S.konten["menu_" + m[0]] || m[1], tujuan: "#" + m[0] }; });
  }

  // ----- daftar menu: tambah, ubah, urutkan, hapus -----
  function tombolKecil(teks, label) {
    var k = document.createElement("button");
    k.type = "button"; k.className = "sekunder kecil"; k.textContent = teks; k.setAttribute("aria-label", label);
    return k;
  }
  function gambarMenu() {
    var w = $("daftar-menu");
    w.textContent = "";
    S.menu.forEach(function (m, i) {
      var baris = document.createElement("div");
      baris.className = "menu-baris";
      var a = document.createElement("input");
      a.type = "text"; a.maxLength = 20; a.value = m.label; a.setAttribute("aria-label", "Tulisan menu " + (i + 1));
      a.addEventListener("input", function () { m.label = a.value; });
      var t = document.createElement("input");
      t.type = "text"; t.value = m.tujuan; t.setAttribute("list", "daftar-tujuan"); t.setAttribute("aria-label", "Tujuan menu " + (i + 1));
      t.addEventListener("input", function () { m.tujuan = t.value; });
      baris.appendChild(a); baris.appendChild(t);
      [["Naik", -1], ["Turun", 1]].forEach(function (x) {
        var k = tombolKecil(x[0], x[0] + "kan menu " + (i + 1));
        k.disabled = i + x[1] < 0 || i + x[1] >= S.menu.length;
        k.addEventListener("click", function () {
          var j = i + x[1], tmp = S.menu[i];
          S.menu[i] = S.menu[j]; S.menu[j] = tmp;
          gambarMenu();
        });
        baris.appendChild(k);
      });
      var h = tombolKecil("Hapus", "Hapus menu " + (i + 1));
      h.addEventListener("click", function () { S.menu.splice(i, 1); gambarMenu(); });
      baris.appendChild(h);
      w.appendChild(baris);
    });
  }
  $("tambah-menu").addEventListener("click", function () {
    if (S.menu.length >= 8) { pesan("Maksimal 8 menu.", true); return; }
    S.menu.push({ label: "Menu baru", tujuan: "#beranda" });
    gambarMenu();
  });

  async function muatPengaturan() {
    var h = await db.from("site_settings").select("key,value");
    if (h.error) { pesan("Gagal memuat pengaturan: " + terjemahkanGalat(h.error), true); return; }
    var p = {};
    h.data.forEach(function (b) { p[b.key] = b.value; });
    S.konten = p.konten || {};
    S.tata = p.tata || {};
    S.menu = Array.isArray(p.menu) && p.menu.length
      ? p.menu.map(function (m) { return { label: String(m.label || ""), tujuan: String(m.tujuan || "") }; })
      : menuBawaan();
    S.favicon = p.favicon || null;
    isiFormulir();
    gambarMenu();
    var t = p.tema || {};
    $("warna").value = /^#[0-9a-fA-F]{6}$/.test(t.warna) ? t.warna : C.warnaBawaan;
    $("font").value = Object.prototype.hasOwnProperty.call(C.fonts, t.font) ? t.font : "modern";
    pratinjau();
    tampilFavicon();
    muatMedia();
  }

  // ----- login dan keluar -----
  $("form-login").addEventListener("submit", async function (e) {
    e.preventDefault();
    var h = await db.auth.signInWithPassword({ email: $("email").value.trim(), password: $("sandi").value });
    if (h.error) pesan("Email atau kata sandi salah.", true);
    else { $("sandi").value = ""; pesan(""); }
  });
  $("keluar").addEventListener("click", function () { db.auth.signOut(); });
  // setTimeout: permintaan data tidak dijalankan langsung di dalam callback ini (praktik yang disarankan)
  db.auth.onAuthStateChange(function (event, session) {
    if (session) { tampil(false); setTimeout(muatPengaturan, 0); } else { tampil(true); }
  });

  // ----- simpan: bagian utama -----
  $("form-hero").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!cekTujuan(TEKS.hero)) return;
    bacaTeks(TEKS.hero);
    S.tata.rata = $("rata").value;
    S.tata.ukuran = $("ukuran").value;
    S.tata.tombol1 = $("tombol1").checked;
    S.tata.tombol2 = $("tombol2").checked;
    if (await upsert("konten", S.konten) && await upsert("tata", S.tata)) pesan(TERSIMPAN);
  });
  $("reset-tata").addEventListener("click", async function () {
    if (!(await hapus("tata"))) return;
    S.tata = {};
    isiFormulir();
    pesan("Tata letak dan bagian dikembalikan ke bawaan.");
  });

  // ----- simpan: menu dan logo -----
  $("form-menu").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!S.menu.length) { pesan("Minimal harus ada 1 menu.", true); return; }
    var bersih = [];
    for (var i = 0; i < S.menu.length; i++) {
      var l = S.menu[i].label.trim(), t = S.menu[i].tujuan.trim();
      if (!l || !C.tujuanValid(t)) {
        pesan("Menu " + (i + 1) + ": tulisan wajib diisi, dan tujuan harus #bagian atau tautan https://", true);
        return;
      }
      bersih.push({ label: l, tujuan: t });
    }
    bacaTeks(TEKS.logo);
    if (await upsert("konten", S.konten) && await upsert("menu", bersih)) pesan(TERSIMPAN);
  });
  $("reset-menu").addEventListener("click", async function () {
    if (!(await hapus("menu"))) return;
    S.menu = menuBawaan();
    gambarMenu();
    pesan("Menu dikembalikan ke bawaan.");
  });

  // ----- simpan: bagian halaman -----
  $("form-bagian").addEventListener("submit", async function (e) {
    e.preventDefault();
    bacaTeks(TEKS.judul);
    bacaTeks(TEKS.isi);
    S.tata.bagian = {};
    BAGIAN.forEach(function (b) { S.tata.bagian[b[0]] = $("tampil_" + b[0]).checked; });
    if (await upsert("konten", S.konten) && await upsert("tata", S.tata)) pesan(TERSIMPAN);
  });

  // ----- warna dan font -----
  function pratinjau() {
    var tema = { warna: $("warna").value, font: $("font").value };
    C.pasangTema(tema);
    $("peringatan").textContent = C.kontrasDenganPutih(tema.warna) < 4.5
      ? "Warna ini terlalu terang: teks putih di bagian atas website akan sulit dibaca. Pilih warna yang lebih gelap."
      : "";
  }
  $("warna").addEventListener("input", pratinjau);
  $("font").addEventListener("change", pratinjau);
  $("form-tema").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (await upsert("tema", { warna: $("warna").value, font: $("font").value })) pesan(TERSIMPAN);
  });
  $("reset-tema").addEventListener("click", async function () {
    if (!(await hapus("tema"))) return;
    $("warna").value = C.warnaBawaan;
    $("font").value = "modern";
    pratinjau();
    pesan("Tema dikembalikan ke bawaan.");
  });
  // ===== Media dan favicon =====
  var BUCKET = "media", BATAS = 50 * 1024 * 1024, BATAS_FAVICON = 1024 * 1024;
  var JENIS = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "application/pdf"];
  var JENIS_FAVICON = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"];
  var AWAL_URL = C.url + "/storage/v1/object/public/" + BUCKET + "/";

  function namaAman(nama) {
    return nama.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "file";
  }
  function urlPublik(path) { return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }
  function ukuranTeks(b) { return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
  function periksa(file, jenis, batas) {
    if (jenis.indexOf(file.type) < 0) return file.name + ": jenis file tidak diizinkan.";
    if (file.size > batas) return file.name + ": ukuran " + ukuranTeks(file.size) + " melebihi batas " + ukuranTeks(batas) + ".";
    return "";
  }
  async function kirim(file, awalan) {
    var path = awalan + Date.now() + "-" + namaAman(file.name);
    var h = await db.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (h.error) throw h.error;
    return path;
  }

  async function muatMedia() {
    var w = $("daftar-media");
    w.textContent = "Memuat daftar...";
    var h = await db.storage.from(BUCKET).list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (h.error) { w.textContent = ""; pesan("Gagal memuat daftar media: " + terjemahkanGalat(h.error), true); return; }
    var files = h.data.filter(function (x) { return x.id; }); // folder (misalnya favicon) dilewati
    w.textContent = files.length ? "" : "Belum ada file.";
    files.forEach(function (f) {
      var jenis = (f.metadata && f.metadata.mimetype) || "";
      var url = urlPublik(f.name);
      var item = document.createElement("div");
      item.className = "media-item";
      if (jenis.indexOf("image/") === 0) {
        var img = document.createElement("img");
        img.src = url; img.alt = f.name; img.loading = "lazy";
        item.appendChild(img);
      } else {
        var ik = document.createElement("div");
        ik.className = "media-ikon";
        ik.textContent = jenis === "application/pdf" ? "PDF" : "VIDEO";
        item.appendChild(ik);
      }
      var info = document.createElement("div");
      var nama = document.createElement("div");
      nama.className = "media-nama";
      nama.textContent = f.name + (f.metadata && f.metadata.size ? " (" + ukuranTeks(f.metadata.size) + ")" : "");
      var aksi = document.createElement("div");
      aksi.className = "media-aksi";
      var salin = tombolKecil("Salin tautan", "Salin tautan " + f.name);
      salin.addEventListener("click", async function () {
        try { await navigator.clipboard.writeText(url); pesan("Tautan disalin."); }
        catch (e) { window.prompt("Salin tautan ini:", url); }
      });
      var buka = document.createElement("a");
      buka.href = url; buka.target = "_blank"; buka.rel = "noopener"; buka.textContent = "Buka";
      var del = tombolKecil("Hapus", "Hapus " + f.name);
      del.addEventListener("click", async function () {
        if (!window.confirm("Hapus file ini? Tautannya akan berhenti berfungsi.")) return;
        var r = await db.storage.from(BUCKET).remove([f.name]);
        if (r.error) { pesan("Gagal menghapus: " + terjemahkanGalat(r.error), true); return; }
        pesan("File dihapus.");
        muatMedia();
      });
      aksi.appendChild(salin); aksi.appendChild(buka); aksi.appendChild(del);
      info.appendChild(nama); info.appendChild(aksi);
      item.appendChild(info);
      w.appendChild(item);
    });
  }
  $("muat-media").addEventListener("click", muatMedia);

  $("unggah").addEventListener("click", async function () {
    var daftar = Array.prototype.slice.call($("berkas").files);
    if (!daftar.length) { pesan("Pilih file dulu.", true); return; }
    for (var i = 0; i < daftar.length; i++) {
      var salah = periksa(daftar[i], JENIS, BATAS);
      if (salah) { pesan(salah, true); return; }
    }
    $("unggah").disabled = true;
    try {
      for (var j = 0; j < daftar.length; j++) {
        pesan("Mengunggah " + (j + 1) + " dari " + daftar.length + "...");
        await kirim(daftar[j], "");
      }
      $("berkas").value = "";
      pesan("Selesai mengunggah " + daftar.length + " file.");
      muatMedia();
    } catch (e) {
      pesan("Gagal mengunggah: " + terjemahkanGalat(e), true);
    }
    $("unggah").disabled = false;
  });

  // ----- favicon -----
  function tampilFavicon() {
    var w = $("favicon-sekarang");
    w.textContent = "";
    if (S.favicon && S.favicon.url && S.favicon.url.indexOf(AWAL_URL) === 0) {
      var img = document.createElement("img");
      img.src = S.favicon.url; img.alt = "Favicon saat ini";
      w.appendChild(img);
      w.appendChild(document.createTextNode("Favicon saat ini"));
    } else {
      w.textContent = "Memakai favicon bawaan.";
    }
  }
  async function hapusBerkasLama() {
    if (S.favicon && S.favicon.path) await db.storage.from(BUCKET).remove([S.favicon.path]);
  }
  $("pasang-favicon").addEventListener("click", async function () {
    var f = $("berkas-favicon").files[0];
    if (!f) { pesan("Pilih gambar dulu.", true); return; }
    var salah = periksa(f, JENIS_FAVICON, BATAS_FAVICON);
    if (salah) { pesan(salah, true); return; }
    $("pasang-favicon").disabled = true;
    try {
      pesan("Mengunggah favicon...");
      var path = await kirim(f, "favicon/");
      var baru = { url: urlPublik(path), path: path };
      if (await upsert("favicon", baru)) {
        await hapusBerkasLama();
        S.favicon = baru;
        tampilFavicon();
        $("berkas-favicon").value = "";
        pesan("Favicon dipasang. Muat ulang website; jika belum berubah, tutup lalu buka lagi tab-nya.");
      }
    } catch (e) {
      pesan("Gagal mengunggah favicon: " + terjemahkanGalat(e), true);
    }
    $("pasang-favicon").disabled = false;
  });
  $("reset-favicon").addEventListener("click", async function () {
    if (!(await hapus("favicon"))) return;
    await hapusBerkasLama();
    S.favicon = null;
    tampilFavicon();
    pesan("Favicon dikembalikan ke bawaan.");
  });
})();
