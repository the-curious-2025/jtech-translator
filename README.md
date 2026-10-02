<p align="center"><img src="icons/128.png" width="96" alt=""></p>

<h1 align="center">JTech Translator</h1>

<p align="center">
  A Chrome extension that adds smart English → Hebrew translation to every post on
  <a href="https://jtechforums.org">JTech Forums</a>, and helps Hebrew speakers write their replies in English.
</p>

<p align="center">
  <a href="#installation">Installation</a> · <a href="#translation-engines">Engines</a> · <a href="#privacy--security">Privacy</a>
</p>

---

## Why

Pasting forum posts into Google Translate gives literal translations that mangle technical posts. Words like *root*, *bootloader*, *APK* or *NetFree* get turned into nonsense, code gets "translated", and the Hebrew comes out left-to-right with punctuation in the wrong places.

JTech Translator puts a **Translate** button under each post and does the job properly:

- **Technical terms stay in English.** Product, app and device names, modding terms, commands, file names, versions, URLs and code are kept as written. The term list is editable.
- **Always right-to-left.** The translated post is laid out RTL. Code blocks, commands and link previews stay LTR.
- **Understands the community.** Yeshivish terms such as *Hashem*, *B"H*, *Shabbos* and *shaila* are written back in their original Hebrew form.
- **Keeps the post's structure.** Quotes, lists, links, images, @mentions and code blocks are preserved.
- **Helps you reply.** A **Translate to English** button in the reply editor turns a Hebrew draft into natural forum English while keeping Markdown, code and quotes intact. It can be undone with one click.

## Installation

The extension is not on the Chrome Web Store yet, so you load it manually:

1. Download this repository (**Code → Download ZIP**) and extract it, or `git clone` it.
2. Open `chrome://extensions` in Chrome (also works in Edge and Brave).
3. Turn on **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the extracted `jtech-translator` folder.
5. Refresh jtechforums.org. A **Translate** button now appears under every post.

Click the extension icon to open the settings.

## Translation engines

| Engine | Cost | Quality | Setup |
|---|---|---|---|
| **Google Translate** (default) | Free | Good. Terms, code and links are protected, but phrasing can be literal | None |
| **Gemini** | Free tier available | Smart: understands context and slang, natural Hebrew | API key from [Google AI Studio](https://aistudio.google.com/apikey) |
| **Claude** | Paid, per use | Best quality | API key from the [Anthropic Console](https://console.anthropic.com/settings/keys) |

The smart engines (Gemini and Claude) receive the post's HTML. Code, images, mentions and embeds are swapped out for placeholders before sending and restored afterwards, so they are never altered. Claude offers Opus 5.5 (default), Sonnet 5.5 or Haiku 4.5.

### Settings

- **Display:** replace the original post with the translation, or show the translation below it.
- **Auto-translate:** translate every post automatically, without clicking. With paid engines, keep in mind that every post costs an API call.
- **Terms to keep in English:** one per line. Reset restores the built-in list.

### Syncing between computers

Your settings and term list are saved with `chrome.storage.sync`, so Chrome syncs them to every computer where you are signed into Chrome with the same Google account. Each person's data stays in their own account. To make this work:

- Sign into Chrome and turn on sync for **Extensions** (`chrome://settings/syncSetup`).
- Install the extension on each computer. The manifest includes a fixed `key`, so the extension gets the same ID everywhere, even when loaded unpacked, and Chrome treats every copy as the same extension.

API keys are **not** synced. Enter them once on each computer.

## How it works

```
content.js     injects buttons, extracts the post, renders the RTL result (runs on jtechforums.org)
background.js  performs translation requests and holds API keys (service worker)
glossary.js    default English-term list and Yeshivish → Hebrew map
settings.js    load/save settings: preferences synced, API keys local only
options.*      settings page
```

- **Google mode** translates each text node separately. Before sending, protected words are replaced with letter-only placeholder tokens, and the tokens are restored afterwards.
- **LLM mode** sends the post HTML with a prompt tuned for Israeli tech Hebrew. The response is **sanitized with an allowlist** before it touches the page.

## Privacy & security

- **What is sent where.** Post text is sent to the engine you choose (Google, Gemini or Claude) and nowhere else. There is no analytics, tracking or server of our own.
- **API keys** are kept in `chrome.storage.local` on your computer and are never synced. Local storage is locked to the extension's own background and settings pages. The script running on the forum page never sees them. Keys are sent only in request headers to the matching API.
- **Model output is untrusted.** HTML returned by an AI model goes through a strict tag/attribute allowlist. Scripts, event handlers, `javascript:` links, iframes and forms are removed. Text from Google is set as plain text, never as HTML.
- **Minimal permissions:** `storage`, plus access to jtechforums.org and the three translation APIs.

If you find a security issue, please open an issue on GitHub.

## Contributing

Issues and pull requests are welcome, especially for better default terms, Discourse layout changes, and new engines.

## License

[MIT](LICENSE)

