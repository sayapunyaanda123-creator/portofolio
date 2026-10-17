(function () {
  var C = window.SITE_CONFIG;
  var db = window.supabase.createClient(C.url, C.key);
  var $ = function (id) { return document.getElementById(id); };
  // S menyimpan data terakhir dari database: teks (konten), tata letak (tata), dan daftar menu
  var S = { konten: {}, tata: {}, menu: [], skill: [], proyek: [], layanan: [], mediaGambar: [] };

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
    Object.keys(DAFTAR).forEach(function (k) { muatDaftar(k, p[k]); });
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
  // ===== Skill, Proyek, dan Layanan =====
  // kolom: k = nama data, jenis = text | area | url | label | gambar
  var DAFTAR = {
    skill: {
      judul: "Skill", satuan: "skill", maks: 12,
      ket: ["ket_skill", "Kalimat pengantar bagian Skill", "text", 200, "Teknologi yang sedang saya pelajari dan pakai di proyek latihan."],
      kolom: [
        { k: "nama", label: "Nama skill", jenis: "text", maks: 30, wajib: true },
        { k: "status", label: "Status (misalnya: Sedang dipelajari)", jenis: "text", maks: 30 }
      ],
      baru: { nama: "Skill baru", status: "Sedang dipelajari" },
      bawaan: [
        { nama: "HTML", status: "Sedang dipelajari" }, { nama: "CSS", status: "Sedang dipelajari" },
        { nama: "JavaScript", status: "Sedang dipelajari" }, { nama: "Git dan GitHub", status: "Sedang dipelajari" },
        { nama: "Vercel", status: "Sedang dipelajari" }
      ]
    },
    proyek: {
      judul: "Proyek", satuan: "proyek", maks: 9,
      catatan: "Beri label yang jujur. Pilih Proyek Klien hanya untuk pekerjaan yang benar-benar dikerjakan untuk klien. Gambar dipilih dari file yang sudah diunggah di panel Media.",
      ket: ["ket_proyek", "Kalimat pengantar bagian Proyek", "text", 200, "Semua proyek di bawah adalah latihan pribadi, bukan pekerjaan untuk klien."],
      kolom: [
        { k: "judul", label: "Judul proyek", jenis: "text", maks: 60, wajib: true },
        { k: "label", label: "Label", jenis: "label", maks: 30, wajib: true },
        { k: "deskripsi", label: "Deskripsi singkat", jenis: "area", maks: 250 },
        { k: "status", label: "Status (misalnya: rencana, sedang dikerjakan, selesai)", jenis: "text", maks: 40 },
        { k: "gambar", label: "Gambar (dari Media)", jenis: "gambar", maks: 400 },
        { k: "tautan", label: "Tautan proyek (https://, boleh kosong)", jenis: "url", maks: 200 }
      ],
      baru: { judul: "Proyek baru", label: "Proyek Latihan", deskripsi: "", status: "rencana", gambar: "", tautan: "" },
      bawaan: [
        { judul: "Website portofolio ini", label: "Personal Project", deskripsi: "Satu halaman statis dengan HTML, CSS, dan JavaScript, diterbitkan lewat Vercel.", status: "versi pertama", gambar: "", tautan: "" },
        { judul: "Website profil UMKM", label: "Proyek Latihan", deskripsi: "Halaman untuk usaha fiktif berisi info usaha, produk, jam buka contoh, dan kontak demo.", status: "rencana", gambar: "", tautan: "" },
        { judul: "Landing page jasa", label: "Demo Konsep", deskripsi: "Halaman promosi layanan dengan manfaat, contoh pekerjaan, dan ajakan menghubungi.", status: "rencana", gambar: "", tautan: "" }
      ]
    },
    layanan: {
      judul: "Layanan", satuan: "layanan", maks: 8,
      ket: ["ket_layanan", "Kalimat pengantar bagian Layanan", "text", 200, "Proyek kecil yang saat ini bisa saya kerjakan sambil terus belajar."],
      kolom: [
        { k: "judul", label: "Nama layanan", jenis: "text", maks: 50, wajib: true },
        { k: "deskripsi", label: "Deskripsi singkat", jenis: "area", maks: 200 }
      ],
      baru: { judul: "Layanan baru", deskripsi: "" },
      bawaan: [
        { judul: "Landing page sederhana", deskripsi: "Satu halaman untuk mempromosikan jasa atau produk." },
        { judul: "Website profil UMKM", deskripsi: "Halaman statis berisi info usaha dan kontak." },
        { judul: "Perbaikan tampilan responsif", deskripsi: "Merapikan tampilan website agar nyaman di ponsel." }
      ]
    }
  };

  function salin(x) { return JSON.parse(JSON.stringify(x)); }
  // Mengisi daftar dari database (atau bawaan jika belum pernah disimpan)
  function muatDaftar(key, data) {
    var d = DAFTAR[key];
    S[key] = Array.isArray(data) ? data.map(function (item) {
      var o = {};
      d.kolom.forEach(function (kol) { o[kol.k] = String((item && item[kol.k]) || ""); });
      return o;
    }) : salin(d.bawaan);
    $(d.ket[0]).value = S.konten[d.ket[0]] || "";
    gambarDaftar(key);
  }

  function kontrol(kol, item) {
    var el;
    if (kol.jenis === "label" || kol.jenis === "gambar") {
      el = document.createElement("select");
      var pilihan = kol.jenis === "label"
        ? C.labelProyek.map(function (x) { return [x, x]; })
        : [["", "Tanpa gambar"]].concat(S.mediaGambar.map(function (m) { return [m.url, m.nama]; }));
      if (kol.jenis === "gambar" && item.gambar && !S.mediaGambar.some(function (m) { return m.url === item.gambar; })) {
        pilihan.push([item.gambar, "Gambar saat ini"]);
      }
      pilihan.forEach(function (x) {
        var o = document.createElement("option");
        o.value = x[0]; o.textContent = x[1];
        el.appendChild(o);
      });
      el.value = item[kol.k];
      el.addEventListener("change", function () { item[kol.k] = el.value; });
    } else {
      el = document.createElement(kol.jenis === "area" ? "textarea" : "input");
      if (kol.jenis !== "area") el.type = kol.jenis === "url" ? "url" : "text";
      el.maxLength = kol.maks;
      el.value = item[kol.k];
      el.addEventListener("input", function () { item[kol.k] = el.value; });
    }
    return el;
  }

  function gambarDaftar(key) {
    var d = DAFTAR[key], w = $("editor-" + key);
    if (!w) return;
    w.textContent = "";
    S[key].forEach(function (item, i) {
      var kotak = document.createElement("div");
      kotak.className = "item-daftar";
      var judul = document.createElement("strong");
      judul.textContent = d.satuan.charAt(0).toUpperCase() + d.satuan.slice(1) + " " + (i + 1);
      kotak.appendChild(judul);
      d.kolom.forEach(function (kol) {
        var l = document.createElement("label");
        l.appendChild(document.createTextNode(kol.label));
        l.appendChild(kontrol(kol, item));
        kotak.appendChild(l);
      });
      var aksi = document.createElement("div");
      aksi.className = "baris";
      [["Naik", -1], ["Turun", 1]].forEach(function (x) {
        var k = tombolKecil(x[0], x[0] + "kan " + d.satuan + " " + (i + 1));
        k.disabled = i + x[1] < 0 || i + x[1] >= S[key].length;
        k.addEventListener("click", function () {
          var j = i + x[1], tmp = S[key][i];
          S[key][i] = S[key][j]; S[key][j] = tmp;
          gambarDaftar(key);
        });
        aksi.appendChild(k);
      });
      var h = tombolKecil("Hapus", "Hapus " + d.satuan + " " + (i + 1));
      h.addEventListener("click", function () { S[key].splice(i, 1); gambarDaftar(key); });
      aksi.appendChild(h);
      kotak.appendChild(aksi);
      w.appendChild(kotak);
    });
  }

  // Memeriksa isi daftar sebelum disimpan; melempar pesan galat jika ada yang salah
  function bersihkan(key) {
    var d = DAFTAR[key], hasil = [];
    S[key].forEach(function (item, i) {
      var o = {}, nama = d.satuan + " " + (i + 1);
      d.kolom.forEach(function (kol) {
        var v = String(item[kol.k] || "").trim();
        if (kol.wajib && !v) throw new Error(nama + ": kolom \"" + kol.label + "\" wajib diisi.");
        if (v.length > kol.maks) throw new Error(nama + ": \"" + kol.label + "\" terlalu panjang (maksimal " + kol.maks + " karakter).");
        if (kol.jenis === "url" && v && !/^https:\/\/\S+$/.test(v)) throw new Error(nama + ": tautan harus diawali https://");
        if (kol.jenis === "label" && C.labelProyek.indexOf(v) < 0) throw new Error(nama + ": label tidak valid.");
        if (kol.jenis === "gambar" && v && !C.gambarValid(v)) throw new Error(nama + ": gambar harus dipilih dari Media.");
        o[kol.k] = v;
      });
      hasil.push(o);
    });
    return hasil;
  }

  function tombolBiasa(teks, kelas, tipe) {
    var k = document.createElement("button");
    k.type = tipe || "button"; k.className = kelas || ""; k.textContent = teks;
    return k;
  }
  function buatPanel(key) {
    var d = DAFTAR[key];
    var det = document.createElement("details");
    det.className = "panel";
    var sum = document.createElement("summary");
    sum.textContent = d.judul;
    det.appendChild(sum);
    var form = document.createElement("form");
    form.id = "form-" + key;
    det.appendChild(form);
    if (d.catatan) {
      var c = document.createElement("p");
      c.className = "bantu"; c.textContent = d.catatan;
      form.appendChild(c);
    }
    var ket = document.createElement("div");
    form.appendChild(ket);
    buatKolom(d.ket, ket);
    var h = document.createElement("h3");
    h.textContent = "Daftar " + d.satuan + " (maksimal " + d.maks + ")";
    form.appendChild(h);
    var ed = document.createElement("div");
    ed.id = "editor-" + key;
    form.appendChild(ed);
    var baris = document.createElement("div");
    baris.className = "baris";
    var tambahBtn = tombolBiasa("Tambah " + d.satuan, "sekunder");
    var resetBtn = tombolBiasa("Kembalikan bawaan", "sekunder");
    baris.appendChild(tambahBtn);
    baris.appendChild(tombolBiasa("Simpan " + d.satuan, "", "submit"));
    baris.appendChild(resetBtn);
    form.appendChild(baris);
    $("panel-daftar").appendChild(det);

    tambahBtn.addEventListener("click", function () {
      if (S[key].length >= d.maks) { pesan("Maksimal " + d.maks + " " + d.satuan + ".", true); return; }
      S[key].push(salin(d.baru));
      gambarDaftar(key);
    });
    resetBtn.addEventListener("click", async function () {
      if (!window.confirm("Kembalikan daftar " + d.satuan + " ke isi bawaan?")) return;
      if (!(await hapus(key))) return;
      S[key] = salin(d.bawaan);
      gambarDaftar(key);
      pesan("Daftar " + d.satuan + " dikembalikan ke bawaan.");
    });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        var hasil = bersihkan(key);
        bacaTeks([d.ket]);
        if (await upsert("konten", S.konten) && await upsert(key, hasil)) pesan(TERSIMPAN);
      } catch (err) {
        pesan(err.message, true);
      }
    });
  }
  ["skill", "proyek", "layanan"].forEach(buatPanel);

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
    S.mediaGambar = files.filter(function (x) { return x.metadata && /^image\//.test(x.metadata.mimetype || ""); })
      .map(function (x) { return { nama: x.name, url: urlPublik(x.name) }; });
    gambarDaftar("proyek"); // pilihan gambar proyek ikut diperbarui
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
