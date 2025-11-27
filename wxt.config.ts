import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  manifest: {
    name: "NPM Version Stats",
    description:
      "Show npm package version usage statistics inline on the npmjs.com package page in the versions tab",
    version: "1.0.3",
    permissions: ["activeTab"],
    host_permissions: ["https://www.npmjs.com/package/*"],
    manifest_version: 3,
    browser_specific_settings: {
      gecko: {
        id: "@npm-version-stats",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
