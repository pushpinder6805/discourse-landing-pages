import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "discourse-landing-pages-admin-plugin-configuration-nav",

  initialize(container) {
    const currentUser = container.lookup("service:current-user");
    if (!currentUser || !currentUser.admin) {
      return;
    }

    withPluginApi((api) => {
      api.setAdminPluginIcon("discourse-landing-pages", "file-lines");
      api.addAdminPluginConfigurationNav("discourse-landing-pages", [
        {
          label: "admin.landing_pages.main",
          route: "adminPlugins.show.discourse-landing-pages",
        },
      ]);
    });
  },
};
