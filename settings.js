// Shared by background.js (importScripts) and options.js (<script>).
//
// Preferences and the term list live in chrome.storage.sync, so Chrome syncs them
// across every computer signed into the same Google account (when extension sync
// is on; otherwise Chrome keeps them locally). API keys stay in chrome.storage.local
// and never leave this computer.

const JTT_DEFAULTS = {
  engine: 'google',            // reading engine: google | gemini | claude
  composeEngine: 'gemini',     // writing (Hebrew -> English) engine
  geminiKey: '',
  geminiModel: 'gemini-3.8-flash',
  claudeKey: '',
  claudeModel: 'claude-opus-5-5',
  terms: '',                   // empty = JTT_DEFAULT_TERMS
  mode: 'replace',             // replace | below
  auto: false
};

const JTT_LOCAL_KEYS = ['geminiKey', 'claudeKey'];

// Models offered in the settings page. A saved model that is no longer offered
// (e.g. gemini-2.5-flash, now closed to new API keys) falls back to the default.
const JTT_GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
const JTT_CLAUDE_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5'];

// storage.sync limits each item to 8 KB, so the term list is split across items.
const JTT_TERMS_CHUNK = 2000;

async function jttLoadSettings() {
  const [synced, local] = await Promise.all([
    chrome.storage.sync.get(null),
    chrome.storage.local.get(JTT_LOCAL_KEYS)
  ]);
  const s = { ...JTT_DEFAULTS };
  for (const k in JTT_DEFAULTS) {
    if (k !== 'terms' && !JTT_LOCAL_KEYS.includes(k) && k in synced) s[k] = synced[k];
  }
  s.terms = Array.from({ length: synced.termsChunks || 0 }, (_, i) => synced['terms_' + i] || '').join('');
  for (const k of JTT_LOCAL_KEYS) if (k in local) s[k] = local[k];
  if (!JTT_GEMINI_MODELS.includes(s.geminiModel)) s.geminiModel = JTT_DEFAULTS.geminiModel;
  if (!JTT_CLAUDE_MODELS.includes(s.claudeModel)) s.claudeModel = JTT_DEFAULTS.claudeModel;
  return s;
}

async function jttSaveSettings(s) {
  const local = {}, synced = {};
  for (const k in s) {
    if (JTT_LOCAL_KEYS.includes(k)) local[k] = s[k];
    else if (k !== 'terms') synced[k] = s[k];
  }

  const chunks = [];
  for (let i = 0; i < s.terms.length; i += JTT_TERMS_CHUNK) chunks.push(s.terms.slice(i, i + JTT_TERMS_CHUNK));
  chunks.forEach((c, i) => { synced['terms_' + i] = c; });
  synced.termsChunks = chunks.length;

  const { termsChunks: oldCount = 0 } = await chrome.storage.sync.get('termsChunks');
  const stale = [];
  for (let i = chunks.length; i < oldCount; i++) stale.push('terms_' + i);

  await chrome.storage.sync.set(synced);
  if (stale.length) await chrome.storage.sync.remove(stale);
  await chrome.storage.local.set(local);
}
