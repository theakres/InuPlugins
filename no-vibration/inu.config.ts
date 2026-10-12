import { defineConfig } from "@inugram/cli";
export default defineConfig({
  outDir: process.env.INU_OUT ?? "dist",
  plugins: {
    "no-vibration": {
      entry: "src/index.ts",
      manifest: {
        name: "No Vibration",
        id: "no_vibration",
        author: "@akresik",
        version: "1.0.0",
        description: {
          en: "Disables vibration in the client completely.",
          ru: "Полностью отключает вибрацию в клиенте.",
        },
        icon: "tg://addstickers?set=SpottyAndPersikAnimated&idx=37",
        grants: ["unsafe.jvm", "unsafe.xposed"],
      },
    },
  },
});
