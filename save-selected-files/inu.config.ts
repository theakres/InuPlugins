import { defineConfig } from "@inugram/cli";
export default defineConfig({
  outDir: process.env.INU_OUT ?? "dist",
  plugins: {
    "save-selected-files": {
      entry: "src/index.ts",
      manifest: {
        name: "Save Selected Files",
        id: "save_selected_files",
        author: "@akresik",
        version: "1.0.0",
        description: {
          en: "Adds a save button to the action bar when selecting files in a profile's shared media (Media and Files tabs), in search results and in storage usage (Settings → Data and Storage → Storage Usage). Tap it and all selected files are saved to Downloads in one click. Files that are not downloaded yet are fetched automatically.",
          ru: "Добавляет кнопку сохранения в панель действий при выделении файлов в медиа-профиле (вкладки «Медиа» и «Файлы»), в результатах поиска и в управлении кэшем (Настройки → Данные и память → Использование памяти). Нажимаете её, и все выбранные файлы сохраняются в «Загрузки» в один клик. Если файл ещё не загружен, плагин докачает его сам.",
        },
        icon: "tg://addstickers?set=Catz5Emoji&idx=35",
        grants: ["unsafe.jvm", "unsafe.xposed"],
      },
    },
  },
});
