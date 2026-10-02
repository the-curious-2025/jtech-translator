// Shared by background.js (importScripts) and options.js (<script>).

// Terms that always stay in English. Editable from the options page.
const JTT_DEFAULT_TERMS = [
  // Platforms, brands, apps
  'Android', 'iPhone', 'iOS', 'Windows', 'Linux', 'macOS', 'Chrome', 'Chromebook',
  'Google', 'Gmail', 'Google Play', 'Play Store', 'App Store', 'Google Maps', 'Gboard',
  'WhatsApp', 'Telegram', 'Waze', 'YouTube', 'Spotify', 'Uber', 'Lyft', 'Zelle', 'Venmo',
  'ChatGPT', 'Claude', 'Claude Code', 'Gemini', 'GitHub', 'XDA', 'Discourse', 'JTech', 'JTech Forums',
  'Samsung', 'Kyocera', 'Nokia', 'Sonim', 'Xiaomi', 'Qin', 'Unihertz', 'Light Phone', 'Duoqin',
  'Mediatek', 'MTK', 'Qualcomm', 'Snapdragon', 'Unisoc',
  // Filters
  'NetFree', 'TAG', 'Etrog', 'Rimon', 'Yeshivanet', 'Meshimer', 'Gentech', 'Covenant Eyes', 'Canopy',
  // Modding / tech
  'root', 'rooted', 'rooting', 'bootloader', 'firmware', 'ROM', 'custom ROM', 'stock ROM', 'recovery',
  'TWRP', 'Magisk', 'KernelSU', 'LSPosed', 'Xposed', 'Shizuku', 'Termux', 'F-Droid', 'Aurora Store',
  'Obtainium', 'LineageOS', 'GSI', 'Treble', 'kernel', 'ADB', 'fastboot', 'APK', 'APKs', 'sideload',
  'sideloading', 'debloat', 'debloating', 'launcher', 'MDM', 'Device Owner', 'SP Flash Tool', 'Odin',
  'VPN', 'DNS', 'proxy', 'router', 'Wi-Fi', 'WiFi', 'hotspot', 'Bluetooth', 'USB', 'USB-C', 'SIM',
  'eSIM', 'IMEI', 'OTA', 'GPS', 'NFC', 'LTE', '4G', '5G', 'VoLTE', 'TTS', 'OCR', 'AI'
];

// Yeshivish / Jewish terms written in English -> original Hebrew form.
const JTT_HEBREW_MAP = {
  'baruch hashem': '\u05d1\u05e8\u05d5\u05da \u05d4\'', 'hashem': '\u05d4\'', 'b"h': '\u05d1"\u05d4', "b'h": '\u05d1"\u05d4', 'bs"d': '\u05d1\u05e1"\u05d3',
  'iy"h': '\u05d0\u05d9"\u05d4', 'iyh': '\u05d0\u05d9"\u05d4', 'bli neder': '\u05d1\u05dc\u05d9 \u05e0\u05d3\u05e8',
  'shabbos': '\u05e9\u05d1\u05ea', 'shabbat': '\u05e9\u05d1\u05ea', 'yom tov': '\u05d9\u05d5\u05dd \u05d8\u05d5\u05d1', 'chol hamoed': '\u05d7\u05d5\u05dc \u05d4\u05de\u05d5\u05e2\u05d3',
  'yeshiva': '\u05d9\u05e9\u05d9\u05d1\u05d4', 'yeshivas': '\u05d9\u05e9\u05d9\u05d1\u05d5\u05ea', 'bochur': '\u05d1\u05d7\u05d5\u05e8', 'bochurim': '\u05d1\u05d7\u05d5\u05e8\u05d9\u05dd', 'kollel': '\u05db\u05d5\u05dc\u05dc',
  'rav': '\u05e8\u05d1', 'rabbonim': '\u05e8\u05d1\u05e0\u05d9\u05dd', 'shaila': '\u05e9\u05d0\u05dc\u05d4', 'shailah': '\u05e9\u05d0\u05dc\u05d4', 'sheilah': '\u05e9\u05d0\u05dc\u05d4', 'shailos': '\u05e9\u05d0\u05dc\u05d5\u05ea',
  'chashuv': '\u05d7\u05e9\u05d5\u05d1', 'tznius': '\u05e6\u05e0\u05d9\u05e2\u05d5\u05ea', 'kedusha': '\u05e7\u05d3\u05d5\u05e9\u05d4', 'chizuk': '\u05d7\u05d9\u05d6\u05d5\u05e7', 'nisayon': '\u05e0\u05d9\u05e1\u05d9\u05d5\u05df',
  'mamash': '\u05de\u05de\u05e9', 'gemach': '\u05d2\u05de"\u05d7', 'frum': '\u05d3\u05ea\u05d9'
};
