import { defineConfig } from "@inugram/cli";
export default defineConfig({
  outDir: process.env.INU_OUT ?? "dist",
  plugins: {
    "online-status": {
      entry: "src/index.ts",
      manifest: {
        name: "Online Status",
        id: "online_status",
        author: "@akresik",
        version: "1.0.0",
        description: {
          en: "Shows an online indicator on avatars of group chat members who are online.",
          ru: "Показывает индикатор «в сети» на аватарках участников групповых чатов, которые сейчас онлайн.",
        },
        icon: "tg://addstickers?set=OliverEmoji&idx=27",
        grants: ["unsafe.jvm", "unsafe.xposed"],
      },
    },
  },
});
