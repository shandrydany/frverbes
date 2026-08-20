# 🇫🇷 Conjugueur v2 — дофаминовый тренажёр французских глаголов

PWA-тренажёр: **581 глагол** с переводами на русский и английский, **14 времён**
(включая passé simple, оба субжонктива и импératif), предлоги управления,
фразы-челленджи, XP и уровни, конфетти 🎉. Работает офлайн, ставится как
приложение на iPhone, Android и компьютер.

## Возможности

- **Уровни базы:** Топ-50 / Топ-100 / Топ-300 / Все 581 (по частотности)
- **14 времён:** Présent, Passé composé, Imparfait, Plus-que-parfait, Futur simple,
  Futur antérieur, Passé simple, Passé antérieur, Conditionnel présent/passé,
  Subjonctif présent/passé/imparfait, Impératif
- **Язык перевода:** 🇷🇺 русский или 🇬🇧 английский
- **Предлоги:** 📎 подсказка «parler à qn, de qch» рядом с переводом
- **Фраза-челлендж 💬:** после спряжения — перевести фразу на французский (+25 ⚡)
- **Пропуски:** 💡 показать ответ формы, ⏭ пропустить глагол целиком
- **Геймификация:** ⚡XP, уровни, 🔥 серия без ошибок, конфетти и похвала
- Панель акцентов é è ê ç…, мягкий/строгий режим акцентов, тёмная тема

## Файлы

`index.html` + `style.css` + `app.js` — приложение · `verbs.json` — база ·
`manifest.json` + `sw.js` + `icons/` — PWA · `generate.py` + `verbs_data*.py` +
`phrases_data.py` — генерация базы · `test.js` — тесты (`node test.js`)

## Публикация на GitHub Pages (рекомендуется)

1. Создайте аккаунт на github.com → новый **публичный** репозиторий `conjugueur`.
2. **Add file → Upload files** → перетащите ВСЕ файлы (включая папку `icons`) → Commit.
3. **Settings → Pages → Branch: main → Save.**
4. Через минуту: `https://ВАШ_ЛОГИН.github.io/conjugueur/` — шлите друзьям!
5. Обновление приложения = загрузить новые файлы + поменять версию кэша в `sw.js`
   (`conjugueur-v2` → `v3`).

Быстрая альтернатива: netlify.com → Drop (перетащить папку), но для постоянной
ссылки нужен бесплатный аккаунт.

## Установка на телефон

- **iPhone (Safari):** Поделиться → «На экран “Домой”».
- **Android (Chrome):** предложит «Установить приложение» автоматически.

## Как добавить глаголы/фразы

1. `curl -L -o lefff.json https://cdn.jsdelivr.net/npm/french-verbs-lefff@latest/dist/conjugations.json`
2. Допишите строки `inf|ru|en|prep` в `verbs_data2.py` и/или `inf|fr|ru|en` в `phrases_data.py`.
3. `python3 generate.py` → обновится `verbs.json`. Поменяйте версию кэша в `sw.js`.

## Источники и лицензии

Спряжения — [french-verbs-lefff](https://www.npmjs.com/package/french-verbs-lefff)
(лексикон LEFFF, Apache-2.0). Переводы и фразы составлены вручную — правьте под себя.
