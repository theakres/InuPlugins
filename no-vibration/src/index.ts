const skipVoid = inu.xposed.routine((ctx) => {
  ctx.setReturnValue(null);
});

const skipTrue = inu.xposed.routine((ctx) => {
  ctx.setReturnValue(true);
});

const nullFirstArg = inu.xposed.routine((ctx) => {
  ctx.args[0] = null;
});

const falseFirstArg = inu.xposed.routine((ctx) => {
  ctx.args[0] = false;
});

function hook(className: string, method: string, h: inu.xposed.MethodHook) {
  try {
    inu.xposed.hookAllOverloads(inu.jvm.cls(className), method, h);
  } catch {}
}

for (const cls of [
  "android.os.Vibrator",
  "android.os.SystemVibrator",
  "android.os.SystemVibrator$MultiVibrator",
  "android.os.SystemVibratorManager$SingleVibrator",
  "android.os.VibratorManager",
  "android.os.SystemVibratorManager",
  "android.os.IVibratorService$Stub$Proxy",
  "android.os.IVibratorManagerService$Stub$Proxy",
]) {
  hook(cls, "vibrate", { before: skipVoid });
}

hook("android.view.View", "performHapticFeedback", { before: skipTrue });
hook("android.view.ViewRootImpl", "performHapticFeedback", {
  before: skipTrue,
});

hook("android.app.NotificationChannel", "enableVibration", {
  before: falseFirstArg,
});
hook("android.app.NotificationChannel", "setVibrationPattern", {
  before: nullFirstArg,
});
