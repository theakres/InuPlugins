const AlertsCreator: any = inu.jvm.cls(
  "org.telegram.ui.Components.AlertsCreator",
);
const BulletinFactory: any = inu.jvm.cls(
  "org.telegram.ui.Components.BulletinFactory",
);
const LaunchActivity: any = inu.jvm.cls("org.telegram.ui.LaunchActivity");
const AndroidUtilities: any = inu.jvm.cls(
  "org.telegram.messenger.AndroidUtilities",
);

const Dialog = inu.jvm.cls("android.app.Dialog");
const TextView: any = inu.jvm.cls("android.widget.TextView");
const ViewGroup: any = inu.jvm.cls("android.view.ViewGroup");
const OnClickListener = inu.jvm.cls("android.view.View$OnClickListener");
const SpannableStringBuilder: any = inu.jvm.cls(
  "android.text.SpannableStringBuilder",
);
const RelativeSizeSpan: any = inu.jvm.cls(
  "android.text.style.RelativeSizeSpan",
);
const ForegroundColorSpan: any = inu.jvm.cls(
  "android.text.style.ForegroundColorSpan",
);
const AtomicBoolean: any = inu.jvm.cls(
  "java.util.concurrent.atomic.AtomicBoolean",
);

const SPAN_EXCLUSIVE_EXCLUSIVE = 0x21;
const PENDING_TTL_MS = 3000;
const MAX_DEPTH = 12;

const HINT = inu.info().language.toLowerCase().startsWith("ru")
  ? "Нажмите, чтобы скопировать"
  : "Tap to copy";

const PENDING: any = new AtomicBoolean(false);

let pendingUrl: string | null = null;
let pendingAt = 0;

function clearPending() {
  pendingUrl = null;
  PENDING.call("set", false);
}

function findTextView(view: any, url: string, depth: number): any {
  if (view === null || depth > MAX_DEPTH) return null;
  if (TextView.isInstance(view)) {
    const text = view.call("getText");
    const str =
      text === null
        ? ""
        : typeof text === "string"
          ? text
          : text.call("toString");
    if (str.includes(url)) return view;
  }
  if (ViewGroup.isInstance(view)) {
    const n: number = view.call("getChildCount");
    for (let i = 0; i < n; i++) {
      const found = findTextView(view.call("getChildAt", i), url, depth + 1);
      if (found !== null) return found;
    }
  }
  return null;
}

function addHint(tv: any) {
  const sb = new SpannableStringBuilder(tv.call("getText"));
  const start: number = sb.call("length");
  sb.call("append", "\n" + HINT);
  const end: number = sb.call("length");
  const color: number = tv.call("getCurrentTextColor");
  const dim = (0x73 << 24) | (color & 0xffffff);
  sb.call(
    "setSpan",
    new RelativeSizeSpan(0.85),
    start,
    end,
    SPAN_EXCLUSIVE_EXCLUSIVE,
  );
  sb.call(
    "setSpan",
    new ForegroundColorSpan(dim),
    start,
    end,
    SPAN_EXCLUSIVE_EXCLUSIVE,
  );
  tv.call("setText", sb);
}

const CopyListener = inu.jvm.defineClass({
  interfaces: [OnClickListener],
  fields: { url: "java.lang.String", dialog: "android.app.Dialog" },
  methods: {
    onClick: (self: any) => {
      try {
        const url: string = self.getField("url");
        self.getField("dialog").call("dismiss");
        if (AndroidUtilities.callStatic("addToClipboard", url) === true) {
          const fragment = LaunchActivity.callStatic("getSafeLastFragment");
          BulletinFactory.callStatic("of", fragment)
            .call("createCopyLinkBulletin")
            .call("show");
        }
      } catch (_) {}
    },
  },
});

function attach(dialog: any, url: string) {
  const decor = dialog.call("getWindow").call("getDecorView");
  const tv = findTextView(decor, url, 0);
  if (tv === null) return;
  const listener: any = new CopyListener();
  listener.setField("url", url);
  listener.setField("dialog", dialog);
  tv.call("setOnClickListener", listener);
  tv.call("setClickable", true);
  addHint(tv);
}

const off1 = inu.xposed.hookAllOverloads(AlertsCreator, "showOpenUrlAlert", {
  before(ctx) {
    for (let i = 0; i < ctx.args.length; i++) {
      const arg = ctx.args[i];
      if (typeof arg === "string" && arg.length > 0) {
        pendingUrl = arg;
        pendingAt = Date.now();
        PENDING.call("set", true);
        return;
      }
    }
  },
  after() {
    clearPending();
  },
});

const off2 = inu.xposed.hookMethod(Dialog.getDeclaredMethod("show()V"), {
  filter: inu.jvm.routine(() => {
    return PENDING.get();
  }),
  after(ctx) {
    const url = pendingUrl;
    const fresh = Date.now() - pendingAt < PENDING_TTL_MS;
    clearPending();
    if (url === null || !fresh) return;
    attach(ctx.thisObject, url);
  },
});

inu.onUnload(() => {
  off1();
  off2();
  clearPending();
});
