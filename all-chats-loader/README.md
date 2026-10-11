# All Chats Loader

Плагин для [Inugram](https://inugram.dev), который догружает полный список диалогов.

Порт одноимённого плагина для exteraGram от @nufxa. Порт: @akresik.

## Как работает

Плагин запрашивает `messages.getDialogs` пакетами по 100 диалогов и передаёт каждый ответ штатному обработчику приложения (`MessagesController.processLoadedDialogs`), чтобы диалоги попали в локальную БД. В настройках плагина есть кнопка запуска, остановки и повторной синхронизации. После завершения плагин показывает, как изменился размер кэша диалогов.

## Гранты

- `account.read(dialogs)` - сравнение размера кэша до и после загрузки
- `invokeRpc(messages.getDialogs)` - постраничный запрос диалогов
- `unsafe.jvm` - вызов `processLoadedDialogs`, высокоуровневого способа записать диалоги в кэш в API нет

## Установка

Скачай `all-chats-loader.inu.js` из [Releases](../../releases) и открой в Inugram (Настройки → Плагины).

## Сборка

Нужны Node.js и pnpm.

```bash
pnpm install
pnpm build
```

Готовый файл появится в `dist/`. Чтобы собирать в другую папку, задай `INU_OUT`, например в Termux:

```bash
export INU_OUT=/storage/emulated/0/inu
pnpm build
```

Если pnpm ругается на `ERR_PNPM_IGNORED_BUILDS` для esbuild, выполни `pnpm approve-builds`.

## Авторы

- @nufxa - оригинальный плагин для exteraGram
- @akresik - порт на Inugram
