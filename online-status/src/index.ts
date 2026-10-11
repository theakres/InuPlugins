const ImageReceiver = inu.jvm.cls("org.telegram.messenger.ImageReceiver");
const ChatMessageCell = inu.jvm.cls("org.telegram.ui.Cells.ChatMessageCell");
const MessagesController: any = inu.jvm.cls(
  "org.telegram.messenger.MessagesController",
);
const ConnectionsManager: any = inu.jvm.cls(
  "org.telegram.tgnet.ConnectionsManager",
);
const LocaleController: any = inu.jvm.cls(
  "org.telegram.messenger.LocaleController",
);
const AndroidUtilities: any = inu.jvm.cls(
  "org.telegram.messenger.AndroidUtilities",
);
const Theme: any = inu.jvm.cls("org.telegram.ui.ActionBar.Theme");
const Log: any = inu.jvm.cls("android.util.Log");

const Paint = inu.jvm.cls("android.graphics.Paint");
const PorterDuffXfermode = inu.jvm.cls("android.graphics.PorterDuffXfermode");
const PorterDuffMode = inu.jvm.cls("android.graphics.PorterDuff$Mode");
const WeakHashMap = inu.jvm.cls("java.util.WeakHashMap");
const Collections: any = inu.jvm.cls("java.util.Collections");
const JBoolean: any = inu.jvm.cls("java.lang.Boolean");
const JArray: any = inu.jvm.cls("java.lang.reflect.Array");
const AtomicIntegerArray = inu.jvm.cls(
  "java.util.concurrent.atomic.AtomicIntegerArray",
);

const ONLINE_COLOR_KEY = Theme.getStaticField("key_chats_onlineCircle");

const DOT_PAINT: any = new Paint(1);
const CLEAR_PAINT: any = new Paint(1);
CLEAR_PAINT.call(
  "setXfermode",
  new PorterDuffXfermode(PorterDuffMode.getStaticField("CLEAR")),
);

const ONLINE: any = Collections.callStatic(
  "synchronizedMap",
  new WeakHashMap(),
);
const TRUE: any = JBoolean.getStaticField("TRUE");

const FLAGS: any = JArray.callStatic(
  "newInstance",
  JBoolean.getStaticField("TYPE"),
  1,
);

const LAYER: any = new AtomicIntegerArray(1);
const ERRS: any = new AtomicIntegerArray(1);

const getAvatarImage = ChatMessageCell.getDeclaredMethod(
  "getAvatarImage()Lorg/telegram/messenger/ImageReceiver;",
);
const draw = ImageReceiver.getDeclaredMethod(
  "draw(Landroid/graphics/Canvas;)Z",
);

const off1 = inu.xposed.hookMethod(getAvatarImage, {
  after: inu.xposed.routine((ctx) => {
    const recv = ctx.returnValue;
    if (recv !== null) {
      try {
        let online = false;
        const mo = ctx.thisObject.getMessageObject();
        if (mo !== null) {
          const id = mo.getFromChatId();
          if (id > 0) {
            const acc = mo.currentAccount;
            const user = MessagesController.getInstance(acc).getUser(id);
            if (
              user !== null &&
              !user.self &&
              !user.bot &&
              user.status !== null
            ) {
              const exp = user.status.expires;
              if (exp > ConnectionsManager.getInstance(acc).getCurrentTime()) {
                online = true;
              } else if (exp <= 0) {
                JArray.setBoolean(FLAGS, 0, false);
                LocaleController.formatUserStatus(acc, user, FLAGS);
                if (JArray.getBoolean(FLAGS, 0)) {
                  online = true;
                }
              }
            }
          }
        }
        if (online) {
          ONLINE.put(recv, TRUE);
        } else {
          ONLINE.remove(recv);
        }
      } catch (e) {
        if (ERRS.incrementAndGet(0) <= 20) {
          Log.e("inu", "online_status: getAvatarImage hook failed", e);
        }
      }
    }
  }),
});

const off2 = inu.xposed.hookMethod(draw, {
  before: inu.xposed.routine((ctx) => {
    LAYER.set(0, 0);
    const r = ctx.thisObject;
    if (ONLINE.containsKey(r) && r.hasBitmapImage()) {
      try {
        const canvas = ctx.args[0];
        LAYER.set(
          0,
          canvas.saveLayer(
            r.getImageX(),
            r.getImageY(),
            r.getImageX2(),
            r.getImageY2(),
            null,
          ),
        );
      } catch (e) {
        if (ERRS.incrementAndGet(0) <= 20) {
          Log.e("inu", "online_status: draw(before) failed", e);
        }
      }
    }
  }),

  after: inu.xposed.routine((ctx) => {
    const layer = LAYER.get(0);
    if (layer > 0) {
      LAYER.set(0, 0);
      try {
        const r = ctx.thisObject;
        const canvas = ctx.args[0];

        const w = r.getImageX2() - r.getImageX();
        const h = r.getImageY2() - r.getImageY();
        const size = w < h ? w : h;
        const dotRadius = 0.11111111 * size;
        const holeRadius = 0.037037037 * size + dotRadius;
        const cx = r.getImageX2() - AndroidUtilities.dp(6);
        const cy = r.getImageY2() - AndroidUtilities.dp(8);

        canvas.drawCircle(cx, cy, holeRadius, CLEAR_PAINT);
        canvas.restoreToCount(layer);

        DOT_PAINT.setColor(Theme.getColor(ONLINE_COLOR_KEY));
        canvas.drawCircle(cx, cy, dotRadius, DOT_PAINT);
      } catch (e) {
        if (ERRS.incrementAndGet(0) <= 20) {
          Log.e("inu", "online_status: draw(after) failed", e);
        }
      }
    }
  }),
});

inu.onUnload(() => {
  off1();
  off2();
});
