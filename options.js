const DEFAULTS = {
  engine: 'google', geminiKey: '', geminiModel: 'gemini-2.5-flash',
  claudeKey: '', claudeModel: 'claude-opus-5-5', terms: '', mode: 'replace', auto: false
};

const $ = id => document.getElementById(id);

function showEngineBoxes() {
  const engine = document.querySelector('input[name=engine]:checked')?.value;
  $('box-gemini').hidden = engine !== 'gemini';
  $('box-claude').hidden = engine !== 'claude';
}

async function load() {
  const s = { ...DEFAULTS, ...(await chrome.storage.local.get(null)) };
  document.querySelector(`input[name=engine][value=${s.engine}]`).checked = true;
  document.querySelector(`input[name=mode][value=${s.mode}]`).checked = true;
  $('geminiKey').value = s.geminiKey;
  $('geminiModel').value = s.geminiModel;
  $('claudeKey').value = s.claudeKey;
  $('claudeModel').value = s.claudeModel;
  $('auto').checked = s.auto;
  $('terms').value = s.terms || JTT_DEFAULT_TERMS.join('\n');
  showEngineBoxes();
}

async function save() {
  const terms = $('terms').value.trim();
  await chrome.storage.local.set({
    engine: document.querySelector('input[name=engine]:checked').value,
    mode: document.querySelector('input[name=mode]:checked').value,
    geminiKey: $('geminiKey').value.trim(),
    geminiModel: $('geminiModel').value.trim() || DEFAULTS.geminiModel,
    claudeKey: $('claudeKey').value.trim(),
    claudeModel: $('claudeModel').value,
    auto: $('auto').checked,
    // Store '' when unchanged so future default-list updates still apply.
    terms: terms === JTT_DEFAULT_TERMS.join('\n') ? '' : terms
  });
  $('status').textContent = '✓ \u05e0\u05e9\u05de\u05e8';
  setTimeout(() => { $('status').textContent = ''; }, 2000);
}

document.querySelectorAll('input[name=engine]').forEach(r => r.addEventListener('change', showEngineBoxes));
$('reset').addEventListener('click', () => { $('terms').value = JTT_DEFAULT_TERMS.join('\n'); });
$('save').addEventListener('click', save);
load();
