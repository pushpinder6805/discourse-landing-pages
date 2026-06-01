import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  api.setAdminPluginIcon("discourse-landing-pages", "file-lines");
  api.addAdminPluginConfigurationNav("discourse-landing-pages", [
    {
      label: "admin.landing_pages.main",
      route: "adminPlugins.show.discourse-landing-pages",
    },
  ]);
});
