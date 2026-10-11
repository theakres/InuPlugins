import { defineConfig } from "@inugram/cli";
export default defineConfig({
  outDir: process.env.INU_OUT ?? "dist",
  plugins: {
    "all-chats-loader": {
      entry: "src/all-chats-loader/index.ts",
      manifest: {
        name: "All Chats Loader",
        id: "all_chats_loader",
        author: "@nufxa (original), @akresik (inu port)",
        version: "1.0.0",
        description: {
          en: "Loads the full list of dialogs.",
          ru: "Догружает полный список диалогов.",
        },
        icon: "tg://addstickers?set=SpottyAndPersikAnimated&idx=43",
        grants: [
          "account.read(dialogs)",
          "invokeRpc(messages.getDialogs)",
          "unsafe.jvm",
        ],
      },
    },
  },
});
