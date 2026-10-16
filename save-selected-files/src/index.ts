const TAG = "save_selected_files_button";
const WRAP = -2;
const MATCH = -1;
const HORIZONTAL = 0;
const CENTER_VERTICAL = 16;

const cls = (name: string) => inu.jvm.cls(name);
const ApplicationLoader = cls("org.telegram.messenger.ApplicationLoader");
const ContentValues = cls("android.content.ContentValues");
const MediaColumns = cls("android.provider.MediaStore$MediaColumns");
const Downloads = cls("android.provider.MediaStore$Downloads");
const MimeTypeMap = cls("android.webkit.MimeTypeMap");
const JFile = cls("java.io.File");
const Files = cls("java.nio.file.Files");
const FileLoader = cls("org.telegram.messenger.FileLoader");
const ImageLocation = cls("org.telegram.messenger.ImageLocation");
const PRIORITY_NORMAL: number = FileLoader.getStaticField("PRIORITY_NORMAL");
const ArrayList = cls("java.util.ArrayList");
const JArray = cls("java.lang.reflect.Array");
const LinearLayout = cls("android.widget.LinearLayout");
const ViewGroup = cls("android.view.ViewGroup");
const ActionBar = cls("org.telegram.ui.ActionBar.ActionBar");
const ActionBarMenuItem = cls("org.telegram.ui.ActionBar.ActionBarMenuItem");
const Theme = cls("org.telegram.ui.ActionBar.Theme");
const R_DOWNLOAD: number = cls(
  "org.telegram.messenger.R$drawable",
).getStaticField("msg_download");

const addViewAt = ViewGroup.getDeclaredMethod(
  "addView(Landroid/view/View;ILandroid/view/ViewGroup$LayoutParams;)V",
);
const addView = ViewGroup.getDeclaredMethod(
  "addView(Landroid/view/View;Landroid/view/ViewGroup$LayoutParams;)V",
);
const LinearParams = cls("android.widget.LinearLayout$LayoutParams");
const FrameParams = cls("android.widget.FrameLayout$LayoutParams");
const LinearParamsCopy = LinearParams.getDeclaredConstructor(
  "(Landroid/view/ViewGroup$LayoutParams;)V",
);

const handlers = new Map<number, () => void>();
let nextHandlerId = 0;
const ClickListener = inu.jvm.defineClass({
  interfaces: [cls("android.view.View$OnClickListener")],
  fields: { id: "int" },
  methods: {
    onClick: (self) => {
      handlers.get(self.getField("id"))?.();
    },
  },
});

function clickListener(fn: () => void): JavaObject {
  const listener = new ClickListener();
  const id = nextHandlerId++;
  handlers.set(id, fn);
  listener.setField("id", id);
  return listener;
}

function defer(fn: () => Promise<void>) {
  setTimeout(() => fn().catch(console.error), 0);
}

function appFolder(context: any): string {
  const raw = context
    .call("getApplicationInfo")
    .call("loadLabel", context.call("getPackageManager"));
  const label: string = typeof raw === "string" ? raw : raw.call("toString");
  return (
    label
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim()
      .replace(/^\.+|\.+$/g, "") || "Telegram"
  );
}

function copyToDownloads(path: string, name: string, mime: string | null) {
  const context = ApplicationLoader.getStaticField("applicationContext");
  const values = new ContentValues();
  const put = (key: string, value: string) =>
    values.call("put(Ljava/lang/String;Ljava/lang/String;)V", key, value);
  put(MediaColumns.getStaticField("DISPLAY_NAME"), name);
  if (mime) put(MediaColumns.getStaticField("MIME_TYPE"), mime);
  put(
    MediaColumns.getStaticField("RELATIVE_PATH"),
    "Download/" + appFolder(context),
  );

  const resolver = context.call("getContentResolver");
  const uri = resolver.call(
    "insert",
    Downloads.getStaticField("EXTERNAL_CONTENT_URI"),
    values,
  );
  if (uri === null) throw new Error("MediaStore insert returned null");
  const stream = resolver.call("openOutputStream", uri);
  try {
    Files.callStatic(
      "copy(Ljava/nio/file/Path;Ljava/io/OutputStream;)J",
      new JFile(path).call("toPath"),
      stream,
    );
  } finally {
    stream.call("close");
  }
}

const BulletinFactory = cls("org.telegram.ui.Components.BulletinFactory");
const FileType = cls("org.telegram.ui.Components.BulletinFactory$FileType");
const Handler = cls("android.os.Handler");
const Looper = cls("android.os.Looper");
const mainHandler = new Handler(Looper.callStatic("getMainLooper"));

function showError(text: string) {
  report(0, text);
}

function report(saved: number, errorText = "Не удалось сохранить файлы") {
  const ok = saved > 0;
  const fragment = inu.android.getCurrentFragment();
  if (fragment === null) return;
  mainHandler.call(
    "post",
    inu.jvm.runnable(() => {
      try {
        const factory = BulletinFactory.callStatic("of", fragment);
        const bulletin = ok
          ? factory.call(
              "createDownloadBulletin",
              FileType.getStaticField(saved > 1 ? "UNKNOWNS" : "UNKNOWN"),
              saved,
              null,
            )
          : factory.call("createErrorBulletin", errorText);
        bulletin.call("show");
      } catch (e) {
        console.error(e);
      }
    }),
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function tryField(object: any, name: string): any {
  try {
    return object.getField(name);
  } catch {
    return null;
  }
}

async function waitForFile(
  loader: JavaObject,
  owner: JavaObject,
  startLoad: () => void,
): Promise<JavaObject | null> {
  const current = () => {
    const file = loader.call("getPathToMessage", owner);
    return file !== null && file.call("exists") ? file : null;
  };
  let file = current();
  if (file !== null) return file;
  startLoad();
  const deadline = Date.now() + 900_000;
  while (Date.now() < deadline) {
    await sleep(500);
    file = current();
    if (file !== null) return file;
  }
  return null;
}

async function saveMessage(object: JavaObject): Promise<boolean> {
  const id = object.call("getId");
  const loader = FileLoader.callStatic(
    "getInstance",
    object.getField("currentAccount"),
  );
  const owner = object.getField("messageOwner");

  const document = object.call("getDocument");
  if (document !== null) {
    const name: string =
      FileLoader.callStatic("getDocumentFileName", document) || "";
    const file = await waitForFile(loader, owner, () =>
      loader.call("loadFile", document, object, PRIORITY_NORMAL, 0),
    );
    if (file === null) {
      return false;
    }
    copyToDownloads(
      file.call("getAbsolutePath"),
      name || file.call("getName"),
      document.getField("mime_type") || null,
    );
    return true;
  }

  const media = tryField(owner, "media");
  const webpage = media === null ? null : tryField(media, "webpage");
  const photo =
    media === null
      ? null
      : (tryField(media, "photo") ??
        (webpage === null ? null : tryField(webpage, "photo")));
  if (photo !== null) {
    const size = FileLoader.callStatic(
      "getClosestPhotoSizeWithSize",
      photo.getField("sizes"),
      5000,
    );
    if (size === null) {
      return false;
    }
    const file = await waitForFile(loader, owner, () =>
      loader.call(
        "loadFile",
        ImageLocation.callStatic("getForPhoto", size, photo),
        object,
        "jpg",
        PRIORITY_NORMAL,
        0,
      ),
    );
    if (file === null) {
      return false;
    }
    const name = `photo_${photo.getField("id")}_${id}.jpg`;
    copyToDownloads(file.call("getAbsolutePath"), name, "image/jpeg");
    return true;
  }

  return false;
}

async function saveMessages(messages: JavaObject[]) {
  let saved = 0;
  for (const object of messages) {
    try {
      if (await saveMessage(object)) saved++;
    } catch (e) {
      console.warn("save failed:", e);
    }
  }
  report(saved);
}

async function saveCacheFiles(paths: string[]) {
  let saved = 0;
  for (const path of paths) {
    try {
      const file = new JFile(path);
      if (!file.call("exists")) continue;
      const name: string = file.call("getName");
      const dot = name.lastIndexOf(".");
      const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
      const mime = ext
        ? MimeTypeMap.callStatic("getSingleton").call(
            "getMimeTypeFromExtension",
            ext,
          )
        : null;
      copyToDownloads(path, name, mime);
      saved++;
    } catch (e) {
      console.warn("save failed:", e);
    }
  }
  report(saved);
}

function newButton(
  context: any,
  selectorKey: string,
  iconKey: string,
  onClick: () => void,
): JavaObject {
  const button = new ActionBarMenuItem(
    context,
    null,
    Theme.callStatic("getColor", Theme.getStaticField(selectorKey)),
    Theme.callStatic("getColor", Theme.getStaticField(iconKey)),
    false,
  );
  button.call("setTag", TAG);
  button.call("setIcon", R_DOWNLOAD);
  button.call("setOnClickListener", clickListener(onClick));
  return button;
}

function addButton(anchor: any, onClick: () => void) {
  const container = anchor.call("getParent");
  if (container === null || container.call("findViewWithTag", TAG) !== null)
    return;
  const button = newButton(
    anchor.call("getContext"),
    "key_actionBarActionModeDefaultSelector",
    "key_actionBarActionModeDefaultIcon",
    onClick,
  );
  addViewAt.invoke(
    container,
    button,
    container.call("indexOfChild", anchor),
    LinearParamsCopy.newInstance(anchor.call("getLayoutParams")),
  );
}

function injectIntoProfile(layout: JavaObject) {
  const anchor = layout.getField("gotoItem") ?? layout.getField("deleteItem");
  if (anchor === null) return;
  addButton(anchor, () => {
    const messages: JavaObject[] = [];
    const arrays = layout.getField("selectedFiles");
    const count: number = JArray.callStatic("getLength", arrays);
    for (let i = 0; i < count; i++) {
      const sparse = JArray.callStatic("get", arrays, i);
      for (let j = 0; j < sparse.call("size"); j++)
        messages.push(sparse.call("valueAt", j));
    }
    layout.call("closeActionMode", false);
    defer(() => saveMessages(messages));
  });
}

function injectIntoSearch(pager: JavaObject) {
  const anchor = pager.getField("gotoItem");
  if (anchor === null) return;
  addButton(anchor, () => {
    const values = new ArrayList(
      pager.getField("selectedFiles").call("values"),
    );
    const messages: JavaObject[] = [];
    for (let i = 0; i < values.call("size"); i++)
      messages.push(values.call("get", i));
    pager.call("hideActionMode");
    defer(() => saveMessages(messages));
  });
}

function collectCachePaths(fragment: JavaObject): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  const add = (info: any) => {
    const file = info.getField("file");
    if (file === null) return;
    const path: string = file.call("getAbsolutePath");
    if (!seen.has(path)) {
      seen.add(path);
      paths.push(path);
    }
  };
  const model = fragment.getField("cacheModel");
  if (model === null) return paths;

  const selected = model.getField("selectedFiles");
  if (selected !== null) {
    const it = selected.call("iterator");
    while (it.call("hasNext")) add(it.call("next"));
  }
  const dialogs = model.getField("selectedDialogs");
  const entities = model.getField("entities");
  if (dialogs !== null && entities !== null && !dialogs.call("isEmpty")) {
    const chosen = new Set<number>();
    const it = dialogs.call("iterator");
    while (it.call("hasNext")) chosen.add(Number(it.call("next")));
    for (let i = 0; i < entities.call("size"); i++) {
      const entity = entities.call("get", i);
      if (!chosen.has(Number(entity.getField("dialogId")))) continue;
      const byType = entity.getField("entitiesByType");
      for (let j = 0; j < byType.call("size"); j++) {
        const files = byType.call("valueAt", j).getField("files");
        for (let k = 0; k < files.call("size"); k++) add(files.call("get", k));
      }
    }
  }
  return paths;
}

function injectIntoCache(fragment: JavaObject) {
  const clear = fragment.getField("actionModeClearButton");
  if (clear === null) return;
  const container = clear.call("getParent");
  if (container === null || container.call("findViewWithTag", TAG) !== null)
    return;
  const context = clear.call("getContext");

  const button = newButton(
    context,
    "key_listSelector",
    "key_windowBackgroundWhiteBlackText",
    () => {
      const paths = collectCachePaths(fragment);
      if (paths.length > 0) {
        try {
          const model = fragment.getField("cacheModel");
          const layout = fragment.getField("cachedMediaLayout");
          if (model !== null) model.call("clearSelection");
          if (layout !== null) {
            layout.call("showActionMode", false);
            layout.call("updateVisibleRows");
          }
        } catch (e) {
          console.warn("clearing selection failed:", e);
        }
      }
      defer(async () => {
        if (paths.length === 0) {
          showError("Не удалось получить выбранные файлы");
        } else {
          await saveCacheFiles(paths);
        }
      });
    },
  );

  const clearParams = clear.call("getLayoutParams");
  const wrapper = new LinearLayout(context);
  wrapper.call("setOrientation", HORIZONTAL);
  const wrapperParams = new FrameParams(WRAP, MATCH);
  wrapperParams.setField("gravity", clearParams.getField("gravity"));
  wrapperParams.call(
    "setMargins",
    clearParams.getField("leftMargin"),
    clearParams.getField("topMargin"),
    clearParams.getField("rightMargin"),
    clearParams.getField("bottomMargin"),
  );
  const index = container.call("indexOfChild", clear);
  container.call("removeView", clear);
  addViewAt.invoke(container, wrapper, index, wrapperParams);

  const size: number = ActionBar.callStatic("getCurrentActionBarHeight");
  const buttonParams = new LinearParams(size, size);
  buttonParams.setField("gravity", CENTER_VERTICAL);
  addView.invoke(wrapper, button, buttonParams);

  const innerParams = new LinearParams(
    clearParams.getField("width"),
    clearParams.getField("height"),
  );
  innerParams.setField("gravity", CENTER_VERTICAL);
  addView.invoke(wrapper, clear, innerParams);
}

function install(name: string, hook: () => void) {
  try {
    hook();
  } catch (e) {
    console.warn(`hook ${name} not installed:`, e);
  }
}

install("SharedMediaLayout", () =>
  inu.xposed.hookAllConstructors(
    cls("org.telegram.ui.Components.SharedMediaLayout"),
    {
      after: (ctx) => injectIntoProfile(ctx.thisObject!),
    },
  ),
);
install("SearchViewPager", () =>
  inu.xposed.hookAllOverloads(
    cls("org.telegram.ui.Components.SearchViewPager"),
    "showActionMode",
    {
      after: (ctx) => injectIntoSearch(ctx.thisObject!),
    },
  ),
);
install("CacheControlActivity", () =>
  inu.xposed.hookAllOverloads(
    cls("org.telegram.ui.CacheControlActivity"),
    "createView",
    {
      after: (ctx) => injectIntoCache(ctx.thisObject!),
    },
  ),
);
