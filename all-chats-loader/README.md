# All Chats Loader

Догружает полный список диалогов. Порт плагина All Chats Loader для exteraGram от [@nufxa](https://t.me/nufxa).

## Скачать

Готовый файл плагина можно скачать в [Releases](https://github.com/theakres/InuPlugins/releases/tag/all-chats-loader).

## Как работает

Плагин запрашивает `messages.getDialogs` пакетами по 100 диалогов и передаёт каждый ответ штатному обработчику приложения (`MessagesController.processLoadedDialogs`), чтобы диалоги попали в локальную БД. После завершения показывает, как изменился размер кэша диалогов.

## Гранты

- `account.read(dialogs)` - сравнение размера кэша до и после загрузки
- `invokeRpc(messages.getDialogs)` - постраничный запрос диалогов
- `unsafe.jvm` - вызов `processLoadedDialogs`, высокоуровневого способа записать диалоги в кэш в API нет

## Авторы

- [@nufxa](https://t.me/nufxa) - оригинальный плагин для exteraGram
- [@akresik](https://t.me/akresik) - порт на Inugram
