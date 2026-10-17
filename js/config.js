// Konfigurasi dan fungsi yang dipakai bersama oleh index.html dan admin.html.
// Project URL dan Publishable key AMAN ditaruh di sini (memang untuk publik).
// JANGAN PERNAH menaruh secret key, service_role key, atau Database Password di file mana pun.
window.SITE_CONFIG = {
  url: "https://jjetbrpwggrfmknfisyr.supabase.co",
  key: "sb_publishable_MINiDb0G3q4qCYGLFygPdQ_UviVw-pI",
  warnaBawaan: "#14306b",
  fonts: {
    modern: { nama: "Modern (bawaan perangkat)", css: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' },
    klasik: { nama: "Klasik (serif)", css: 'Georgia, "Times New Roman", serif' },
    netral: { nama: "Netral (Arial)", css: 'Arial, Helvetica, sans-serif' },
    mono: { nama: "Teknis (monospace)", css: 'ui-monospace, Consolas, "Courier New", monospace' }
  },
  // Label proyek yang tersedia. Pilih "Proyek Klien" hanya untuk pekerjaan klien yang benar-benar ada.
  labelProyek: ["Proyek Latihan", "Personal Project", "Demo Konsep", "Proyek Klien"],
  // Gambar proyek hanya boleh berasal dari bucket "media" project ini
  gambarValid: function (u) {
    return typeof u === "string" && u.indexOf(this.url + "/storage/v1/object/public/media/") === 0 && /^https:\/\/\S+$/.test(u);
  },
  // Tujuan tautan yang diizinkan: bagian halaman (#tentang, dst) atau tautan https://
  tujuanValid: function (t) {
    return typeof t === "string" && /^(#(beranda|tentang|skill|proyek|layanan|kontak)|https:\/\/\S+)$/.test(t);
  },
  // Menerapkan warna dan font ke halaman. Nilai yang tidak valid diganti nilai bawaan.
  pasangTema: function (tema) {
    var root = document.documentElement;
    var warna = tema && /^#[0-9a-fA-F]{6}$/.test(tema.warna) ? tema.warna : this.warnaBawaan;
    var adaFont = tema && Object.prototype.hasOwnProperty.call(this.fonts, tema.font);
    root.style.setProperty("--biru", warna);
    root.style.setProperty("--font", this.fonts[adaFont ? tema.font : "modern"].css);
  },
  // Rasio kontras warna terhadap putih (minimal 4.5 dianggap nyaman dibaca).
  kontrasDenganPutih: function (hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return 1.05 / (lum + 0.05);
  }
};
