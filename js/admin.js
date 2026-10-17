(function () {
  var C = window.SITE_CONFIG;
  var db = window.supabase.createClient(C.url, C.key);
  var $ = function (id) { return document.getElementById(id); };
  var FIELDS = ["hero_peran", "hero_pengantar", "tentang_1", "tentang_2",
                "kontak_pengantar", "kontak_email", "kontak_github", "kontak_linkedin"];

  function pesan(teks, galat) {
    var s = $("status");
    s.textContent = teks;
    s.className = galat ? "galat" : "ok";
  }
  function terjemahkanGalat(e) {
    if (/row-level security/i.test(e.message)) {
      return "Ditolak oleh aturan keamanan. Pastikan email di supabase-setup.sql sama persis dengan email yang dipakai login.";
    }
    return e.message;
  }
  function tampil(login) {
    $("tampilan-login").hidden = !login;
    $("tampilan-panel").hidden = login;
    $("keluar").hidden = login;
  }

  // ----- isi pilihan font -----
  Object.keys(C.fonts).forEach(function (k) {
    var o = document.createElement("option");
    o.value = k;
    o.textContent = C.fonts[k].nama;
    $("font").appendChild(o);
  });

  function pratinjau() {
    var tema = { warna: $("warna").value, font: $("font").value };
    C.pasangTema(tema);
    var rasio = C.kontrasDenganPutih(tema.warna);
    $("peringatan").textContent = rasio < 4.5
      ? "Warna ini terlalu terang: teks putih di bagian atas website akan sulit dibaca. Pilih warna yang lebih gelap."
      : "";
  }
  $("warna").addEventListener("input", pratinjau);
  $("font").addEventListener("change", pratinjau);

  async function simpan(key, value) {
    var h = await db.from("site_settings").upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    if (h.error) { pesan("Gagal menyimpan: " + terjemahkanGalat(h.error), true); return false; }
    pesan("Tersimpan. Muat ulang website untuk melihat hasilnya.");
    return true;
  }

  async function muatPengaturan() {
    var h = await db.from("site_settings").select("key,value");
    if (h.error) { pesan("Gagal memuat pengaturan: " + terjemahkanGalat(h.error), true); return; }
    var peta = {};
    h.data.forEach(function (b) { peta[b.key] = b.value; });
    var k = peta.konten || {};
    FIELDS.forEach(function (id) { $(id).value = k[id] || ""; });
    var t = peta.tema || {};
    $("warna").value = /^#[0-9a-fA-F]{6}$/.test(t.warna) ? t.warna : C.warnaBawaan;
    $("font").value = Object.prototype.hasOwnProperty.call(C.fonts, t.font) ? t.font : "modern";
    pratinjau();
  }

  // ----- login dan keluar -----
  $("form-login").addEventListener("submit", async function (e) {
    e.preventDefault();
    var h = await db.auth.signInWithPassword({ email: $("email").value.trim(), password: $("sandi").value });
    if (h.error) pesan("Email atau kata sandi salah.", true);
    else { $("sandi").value = ""; pesan(""); }
  });
  $("keluar").addEventListener("click", function () { db.auth.signOut(); });

  // Dipanggil saat halaman dibuka dan setiap status login berubah.
  // setTimeout dipakai agar permintaan data tidak berjalan di dalam callback ini (praktik yang disarankan).
  db.auth.onAuthStateChange(function (event, session) {
    if (session) { tampil(false); setTimeout(muatPengaturan, 0); }
    else { tampil(true); }
  });

  // ----- simpan konten -----
  $("form-konten").addEventListener("submit", async function (e) {
    e.preventDefault();
    var nilai = {};
    FIELDS.forEach(function (id) {
      var v = $(id).value.trim();
      if (v) nilai[id] = v; // kosong = pakai teks bawaan di website
    });
    await simpan("konten", nilai);
  });

  // ----- simpan tema -----
  $("form-tema").addEventListener("submit", async function (e) {
    e.preventDefault();
    await simpan("tema", { warna: $("warna").value, font: $("font").value });
  });
  $("reset-tema").addEventListener("click", async function () {
    var h = await db.from("site_settings").delete().eq("key", "tema");
    if (h.error) { pesan("Gagal mengembalikan: " + terjemahkanGalat(h.error), true); return; }
    $("warna").value = C.warnaBawaan;
    $("font").value = "modern";
    pratinjau();
    pesan("Tema dikembalikan ke bawaan.");
  });
})();
