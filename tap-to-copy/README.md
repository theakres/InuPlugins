# Tap To Copy

Нажмите на ссылку в диалоге «Открыть ссылку», чтобы скопировать её. Под ссылкой появляется подсказка «Нажмите, чтобы скопировать». Порт функции «Tap to copy» из exteraGram.

## Скачать

Готовый файл плагина можно скачать в [Releases](https://github.com/theakres/InuPlugins/releases/tag/tap-to-copy).

## Как работает

Плагин ставит два хука:

- `AlertsCreator.showOpenUrlAlert` (все перегрузки) - запоминает ссылку, которую сейчас покажут в диалоге, и поднимает флаг в Java (`AtomicBoolean`).
- `Dialog.show()` - с `filter`-routine, которая пропускает все диалоги, пока флаг не поднят, так что JS-движок не будит ради посторонних диалогов. Для нужного диалога плагин находит `TextView` со ссылкой (обход окна диалога), вешает на него обработчик нажатия и дописывает серую подсказку: «Нажмите, чтобы скопировать» для русского и «Tap to copy» для всех остальных языков.

По нажатию, как в exteraGram, диалог закрывается, ссылка копируется через `AndroidUtilities.addToClipboard` и показывается стандартный bulletin `BulletinFactory.createCopyLinkBulletin()` - его текст приложение берёт из своей локализации.

## Гранты

- `unsafe.jvm` - доступ к классам приложения (`AlertsCreator`, `AndroidUtilities`, `BulletinFactory`, `LaunchActivity`) и к View-иерархии диалога
- `unsafe.xposed` - хуки на `AlertsCreator.showOpenUrlAlert` и `Dialog.show`, высокоуровневого API для диалога открытия ссылки нет

## Авторы

- [exteraGram](https://t.me/exteraGram) - оригинальная функция «Tap to copy» в диалоге открытия ссылки
- [@akresik](https://t.me/akresik) - порт в виде плагина на Inugram
