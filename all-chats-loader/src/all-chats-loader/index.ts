const BATCH_SIZE = 100;

let loading = false;
let cancelled = false;
let loaded = 0;
let batches = 0;
let cachedBefore = 0;
let status = "Готово к загрузке";

const page = inu.ui.settingsPage({
  title: "All Chats Loader",
  items: () => {
    const hasStatus = loading || loaded > 0 || status.startsWith("Ошибка");
    return [
      inu.ui.header("Загрузка диалогов"),
      loading
        ? inu.ui.button({
            id: "cancel",
            text: "Остановить",
            icon: inu.icons.common("close"),
            danger: true,
            onClick: () => {
              cancelled = true;
              status = "Останавливаю...";
              page.invalidate();
            },
          })
        : inu.ui.button({
            id: "start",
            text: "Загрузить все чаты",
            icon: inu.icons.common("download"),
            onClick: () => void start().catch(console.error),
          }),
      ...(hasStatus
        ? [
            inu.ui.button({
              id: "status",
              text: status,
              subtitle:
                loaded > 0
                  ? `Диалогов: ${loaded} · пакетов: ${batches}`
                  : undefined,
              icon: inu.icons.common(loading ? "refresh" : "info"),
              onClick: () => {},
            }),
          ]
        : []),
      inu.ui.separator(
        "Список диалогов подгружается в фоне, чаты можно открывать.",
      ),
      inu.ui.header("Восстановление"),
      inu.ui.button({
        id: "resync",
        text: "Повторить синхронизацию",
        subtitle: "Только при проблемах, ничего не удаляет",
        icon: inu.icons.common("refresh"),
        onClick: () => void resync().catch(console.error),
      }),
    ];
  },
});

inu.registerSettings(page);

async function resync() {
  if (loading) return;
  const r = await inu.ui.dialog({
    title: "Экстренная синхронизация",
    message:
      "Это повторно запросит список диалогов. Локальная БД, папки, файлы и сообщения не удаляются.",
    positive: "Продолжить",
    negative: "Отмена",
  });
  if (r === "positive") await start();
}

const MessagesController = inu.jvm.cls(
  "org.telegram.messenger.MessagesController",
);

function findBy(list: any, pred: (x: any) => boolean): any {
  for (let i = 0; i < list.length; i++) {
    const x = list[i];
    if (pred(x)) return x;
  }
  return undefined;
}

function inputPeer(peer: any, res: any): any {
  const hash = (list: any, id: any) =>
    findBy(list, (x) => x.id === id)?.access_hash ?? 0;
  switch (peer._) {
    case "peerUser":
      return {
        _: "inputPeerUser",
        user_id: peer.user_id,
        access_hash: hash(res.users, peer.user_id),
      };
    case "peerChat":
      return { _: "inputPeerChat", chat_id: peer.chat_id };
    case "peerChannel":
      return {
        _: "inputPeerChannel",
        channel_id: peer.channel_id,
        access_hash: hash(res.chats, peer.channel_id),
      };
  }
  return { _: "inputPeerEmpty" };
}

function applyDialogs(controller: any, res: any) {
  const jres = inu.jvm.fromTl(res);
  try {
    controller.call(
      "processLoadedDialogs",
      jres,
      null,
      null,
      0,
      0,
      BATCH_SIZE,
      0,
      false,
      false,
      false,
    );
  } catch (e) {
    if (!(e instanceof TypeError)) throw e;
    controller.call(
      "processLoadedDialogs",
      jres,
      null,
      0,
      0,
      BATCH_SIZE,
      0,
      false,
      false,
      false,
    );
  }
}

async function start() {
  if (loading) return;
  const account = inu.account();
  loading = true;
  cancelled = false;
  loaded = 0;
  batches = 0;
  status = "Подключение к Telegram...";
  page.invalidate();

  try {
    cachedBefore = (
      await account.getDialogsCached({ archive: "keep", fields: [] })
    ).length;
    const controller = MessagesController.callStatic("getInstance", account.id);

    let offsetDate = 0;
    let offsetId = 0;
    let offsetPeer: any = { _: "inputPeerEmpty" };

    while (!cancelled) {
      status = `Запрос пакета ${batches + 1}...`;
      page.invalidate();

      const res: any = await account.invokeRpc({
        _: "messages.getDialogs",
        offset_date: offsetDate,
        offset_id: offsetId,
        offset_peer: offsetPeer,
        limit: BATCH_SIZE,
        exclude_pinned: true,
        hash: 0,
      } as any);
      if (!res || res._ === "messages.dialogsNotModified")
        throw new Error("пустой ответ");

      const count: number = res.dialogs.length;
      const last = res.dialogs[count - 1];
      if (count > 0) {
        offsetId = last.top_message;
        offsetDate =
          findBy(res.messages, (m) => m.id === last.top_message)?.date ?? 0;
        offsetPeer = inputPeer(last.peer, res);
      }

      applyDialogs(controller, res);
      loaded += count;
      batches++;
      status = `Обработан пакет ${batches} (+${count} чатов)`;
      page.invalidate();

      if (count < BATCH_SIZE) break;
    }

    if (cancelled) {
      status = `Остановлено: загружено ${loaded} чатов.`;
      return;
    }

    await new Promise((r) => setTimeout(r, 2000));
    const cachedAfter = (
      await account.getDialogsCached({ archive: "keep", fields: [] })
    ).length;
    status = `Готово: загружено ${loaded} чатов (в кэше: ${cachedBefore} → ${cachedAfter}).`;
    inu.ui
      .dialog({
        title: "Синхронизация завершена",
        message: `${status}\n\nДля корректного отображения чатов, папок и счётчиков непрочитанных рекомендуется перезапустить приложение вручную.`,
        positive: "OK",
      })
      .catch(console.error);
  } catch (e) {
    status = `Ошибка: ${e instanceof Error ? e.message : String(e)}`;
    inu.ui
      .dialog({
        title: "Синхронизация остановлена",
        message: status,
        positive: "OK",
      })
      .catch(console.error);
  } finally {
    loading = false;
    page.invalidate();
  }
}
