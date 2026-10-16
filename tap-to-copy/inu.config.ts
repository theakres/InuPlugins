import { defineConfig } from "@inugram/cli";
export default defineConfig({
  outDir: process.env.INU_OUT ?? "dist",
  plugins: {
    "tap-to-copy": {
      entry: "src/index.ts",
      manifest: {
        name: "Tap To Copy",
        id: "tap_to_copy",
        author: "@akresik",
        version: "1.0.0",
        description: {
          en: 'Adds tap-to-copy to the \"Open link\" dialog: tap the link to copy it.',
          ru: "Добавляет копирование по нажатию в диалог «Открыть ссылку»: нажмите на ссылку, чтобы скопировать её.",
        },
        icon: "tg://addstickers?set=SpottyAndPersikAnimated&idx=6",
        grants: ["unsafe.jvm", "unsafe.xposed"],
      },
    },
  },
});
