# Changelog

## 1.5.0 - 2026-10-12

- The reply translator now reads the post you're replying to (or the topic's first post), so the English comes out fitting the conversation. Only that one post is sent, trimmed and without quotes, images or code, to keep API usage low. Works with Gemini and Claude, and can be turned off in the settings.
- When Gemini's free tier is busy or rate-limited, the extension retries once and then switches to the other Gemini model instead of showing an error right away.

## 1.4.1 - 2026-10-04

- Spoilers in translated posts can be clicked to show or hide, and keep the state they had before translating.

## 1.4.0 - 2026-10-02

- "Translate to English" button in the reply box, with one-click undo.
- Separate engines for reading and writing.
- Settings and the word list sync between computers through Chrome sync. API keys stay local.
- Gemini 3.8 Flash replaces the retired 2.5 model.
- New settings page that saves automatically.
