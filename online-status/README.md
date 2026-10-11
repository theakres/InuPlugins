# Online Status

Показывает индикатор «в сети» на аватарках участников групповых чатов, которые сейчас онлайн. Порт функции «Show online status» из exteraGram.

## Скачать

Готовый файл плагина можно скачать в [Releases](https://github.com/theakres/InuPlugins/releases/tag/online-status).

## Как работает

Плагин ставит два хука, оба выполняются как routines прямо в потоке отрисовки:

- `ChatMessageCell.getAvatarImage()` - ChatActivity вызывает его перед отрисовкой аватарки. Здесь определяется, онлайн ли автор сообщения: по `status.expires` или, если статус скрыт, через `LocaleController.formatUserStatus` (так же «в сети» определяют профиль и шапка чата). Аватарки онлайн-пользователей запоминаются в `WeakHashMap`.
- `ImageReceiver.draw(Canvas)` - для запомненных аватарок рисует аватарку в отдельный слой, вырезает круглый «зазор» в правом нижнем углу, затем рисует точку цветом темы `key_chats_onlineCircle`. Размеры и смещение взяты из exteraGram.

Свои сообщения, ботов и пользователей без статуса плагин пропускает.

## Логи

В logcat с меткой `inu` пишутся только ошибки (уровень E, не больше 20 за сеанс):

- `online_status: getAvatarImage hook failed`
- `online_status: draw(before) failed`
- `online_status: draw(after) failed`

## Гранты

- `unsafe.jvm` - доступ к классам приложения (`MessagesController`, `ConnectionsManager`, `LocaleController`, `Theme`) и к Canvas
- `unsafe.xposed` - хуки на `ChatMessageCell.getAvatarImage` и `ImageReceiver.draw`, высокоуровневого способа нарисовать что-то на аватарке в API нет

## Авторы

- [exteraGram](https://t.me/exteraGram) - оригинальная функция «Показывать индикатор онлайна»
- [@akresik](https://t.me/akresik) - порт в виде плагина на Inugram
