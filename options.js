const DEFAULTS = {
  engine: 'google', geminiKey: '', geminiModel: 'gemini-2.5-flash',
  claudeKey: '', claudeModel: 'claude-opus-5-5', terms: '', mode: 'replace', auto: false
};

const ENGINE_NOTES = {
  google: '\u05d7\u05d9\u05e0\u05de\u05d9 \u05d5\u05de\u05d4\u05d9\u05e8, \u05d1\u05dc\u05d9 \u05de\u05e4\u05ea\u05d7. \u05d4\u05ea\u05e8\u05d2\u05d5\u05dd \u05de\u05d9\u05dc\u05d5\u05dc\u05d9 \u05d9\u05d5\u05ea\u05e8.',
  gemini: '\u05de\u05d1\u05d9\u05df \u05d4\u05e7\u05e9\u05e8 \u05d5\u05de\u05ea\u05e8\u05d2\u05dd \u05dc\u05e2\u05d1\u05e8\u05d9\u05ea \u05d8\u05d1\u05e2\u05d9\u05ea. \u05d9\u05e9 \u05de\u05e4\u05ea\u05d7 \u05d7\u05d9\u05e0\u05de\u05d9.',
  claude: '\u05d4\u05d0\u05d9\u05db\u05d5\u05ea \u05d4\u05db\u05d9 \u05d2\u05d1\u05d5\u05d4\u05d4. \u05d1\u05ea\u05e9\u05dc\u05d5\u05dd \u05dc\u05e4\u05d9 \u05e9\u05d9\u05de\u05d5\u05e9.'
};

const $ = id => document.getElementById(id);
const checked = name => document.querySelector(`input[name=${name}]:checked`).value;
const defaultTerms = JTT_DEFAULT_TERMS.join('\n');

function render() {
  const engine = checked('engine');
  $('engine-note').textContent = ENGINE_NOTES[engine];
  $('box-gemini').hidden = engine !== 'gemini';
  $('box-claude').hidden = engine !== 'claude';
  $('count').textContent = ` (${$('terms').value.split('\n').filter(t => t.trim()).length})`;
}

async function load() {
  const s = { ...DEFAULTS, ...(await chrome.storage.local.get(null)) };
  (document.querySelector(`input[name=engine][value="${s.engine}"]`) || document.querySelector('input[name=engine]')).checked = true;
  (document.querySelector(`input[name=mode][value="${s.mode}"]`) || document.querySelector('input[name=mode]')).checked = true;
  $('geminiKey').value = s.geminiKey;
  $('geminiModel').value = s.geminiModel;
  $('claudeKey').value = s.claudeKey;
  $('claudeModel').value = s.claudeModel;
  $('auto').checked = s.auto;
  $('terms').value = s.terms || defaultTerms;
  render();
}

let savedTimer;
async function save() {
  const terms = $('terms').value.trim();
  await chrome.storage.local.set({
    engine: checked('engine'),
    mode: checked('mode'),
    geminiKey: $('geminiKey').value.trim(),
    geminiModel: $('geminiModel').value.trim() || DEFAULTS.geminiModel,
    claudeKey: $('claudeKey').value.trim(),
    claudeModel: $('claudeModel').value,
    auto: $('auto').checked,
    // Store '' when unchanged so future default-list updates still apply.
    terms: terms === defaultTerms ? '' : terms
  });
  $('saved').classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => $('saved').classList.remove('show'), 1200);
}

// Save automatically: immediately for clicks, after a pause for typing.
let typingTimer;
document.addEventListener('change', () => { render(); save(); });
document.addEventListener('input', e => {
  if (!e.target.matches('input[type=text], input[type=password], textarea')) return;
  render();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(save, 500);
});
$('reset').addEventListener('click', () => { $('terms').value = defaultTerms; render(); save(); });

load();
