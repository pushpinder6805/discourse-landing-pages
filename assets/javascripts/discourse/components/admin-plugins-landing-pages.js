import Component from "@ember/component";
import EmberObject, { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { extractError } from "discourse/lib/ajax-error";
import discourseComputed from "discourse/lib/decorators";
import Group from "discourse/models/group";
import { i18n } from "discourse-i18n";
import ImportPages from "../components/modal/import-pages";
import UpdatePagesRemote from "../components/modal/update-pages-remote";

const statusIcons = {
  error: "exclamation-triangle",
  success: "check",
};

export default class AdminPluginsLandingPages extends Component {
  @service modal;

  fetchingCommits = false;
  commitsBehind = null;
  showCommitsBehind = false;
  showPages = true;

  didReceiveAttrs() {
    super.didReceiveAttrs(...arguments);
    const model = this.get("model");
    this.setProperties({
      pages: model.pages,
      menus: model.menus,
      remote: EmberObject.create(model.remote || {}),
      themes: model.themes,
      groups: model.groups,
      global: model.global,
    });

    if (model.remote) {
      if (model.remote.commit) {
        this.send("fetchCommitsBehind");
      } else {
        this.set("pagesNotFetched", true);
      }
    }

    ajax("/admin/themes").then((result) =>
      this.set(
        "themes",
        result.themes.map((t) => ({ id: t.id, name: t.name }))
      )
    );

    Group.findAll().then((groups) => this.set("groups", groups));
  }

  @discourseComputed("remote.connected")
  remoteDisconnected(connected) {
    return !connected;
  }

  @discourseComputed("pullingFromRemote", "remoteDisconnected")
  pullDisabled(pullingFromRemote, remoteDisconnected) {
    return pullingFromRemote || remoteDisconnected;
  }

  @discourseComputed("commitsBehind")
  hasCommitsBehind(commitsBehind) {
    return commitsBehind > 0;
  }

  @discourseComputed("messages.items")
  hasMessages(items) {
    return items && items.length > 0;
  }

  @discourseComputed("staticMessage", "resultMessages")
  messages(staticMessage, resultMessages) {
    if (resultMessages) {
      setTimeout(() => {
        this.set("resultMessages", null);
      }, 15000);

      return {
        status: resultMessages.type,
        items: resultMessages.messages.map((message) => {
          return {
            icon: statusIcons[resultMessages.type],
            text: message,
          };
        }),
      };
    } else if (staticMessage) {
      return {
        status: "static",
        items: [
          {
            icon: staticMessage.icon,
            text: staticMessage.text,
          },
        ],
      };
    } else {
      return null;
    }
  }

  @discourseComputed(
    "pagesNotFetched",
    "hasCommitsBehind",
    "fetchingCommits",
    "page",
    "remote",
    "showGlobal"
  )
  staticMessage(
    pagesNotFetched,
    hasCommitsBehind,
    fetchingCommits,
    page,
    remote,
    showGlobal
  ) {
    let key;
    let icon = "circle-info";

    if (page) {
      if (page.remote) {
        key = "page.remote.description";
        icon = "book";
      } else {
        key = "page.local.description";
        icon = "desktop";
      }
    } else if (showGlobal) {
      key = "global.description";
    } else if (remote && remote.connected) {
      if (pagesNotFetched) {
        key = "remote.repository.not_fetched";
      } else if (fetchingCommits) {
        key = "remote.repository.checking_status";
      } else if (hasCommitsBehind) {
        key = "remote.repository.out_of_date";
      } else {
        key = "remote.repository.up_to_date";
      }
    }

    if (key) {
      return {
        icon,
        text: i18n(`admin.landing_pages.${key}`),
      };
    } else {
      return null;
    }
  }

  @discourseComputed("showGlobal")
  documentationUrl(showGlobal) {
    const rootUrl = "https://coop.pavilion.tech";
    return showGlobal ? `${rootUrl}` : `${rootUrl}`;
  }

  @action
  importPages() {
    this.modal.show(ImportPages).then((result) => {
      if (result?.page) {
        this.setProperties({
          pages: result.pages,
          resultMessages: {
            type: "success",
            messages: [
              i18n("admin.landing_pages.imported.x_pages", { count: 1 }),
            ],
          },
        });
      }
    });
  }

  @action
  updateRemote() {
    this.modal
      .show(UpdatePagesRemote, { model: { remote: this.remote } })
      .then((result) => {
        if (result?.remote) {
          this.setProperties({
            remote: result.remote,
            pagesNotFetched: true,
          });
        }
      });
  }

  @action
  pullFromRemote() {
    this.set("pullingFromRemote", true);

    ajax("/landing/remote/pages")
      .then((result) => {
        const pages = result.pages;
        const menus = result.menus;
        const global = result.global;
        const report = result.report;

        this.setProperties({
          pages,
          menus,
          global,
        });

        if (report.errors.length) {
          this.set("resultMessages", {
            type: "error",
            messages: result.report.errors,
          });
        } else {
          let imported = report.imported;
          let messages = [];

          ["scripts", "menus", "assets", "pages"].forEach((listType) => {
            if (imported[listType].length) {
              messages.push(
                i18n(`admin.landing_pages.imported.x_${listType}`, {
                  count: imported[listType].length,
                })
              );
            }
          });

          ["footer", "header"].forEach((boolType) => {
            if (imported[boolType]) {
              messages.push(i18n(`admin.landing_pages.imported.${boolType}`));
            }
          });

          this.setProperties({
            resultMessages: { type: "success", messages },
            pagesNotFetched: false,
          });

          this.send("fetchCommitsBehind");
        }
      })
      .catch((error) => {
        this.set("resultMessages", {
          type: "error",
          messages: [extractError(error)],
        });
      })
      .finally(() => {
        this.set("pullingFromRemote", false);
      });
  }

  @action
  fetchCommitsBehind() {
    this.set("fetchingCommits", true);

    ajax("/landing/remote/commits-behind")
      .then((result) => {
        if (!result.failed) {
          this.set("commitsBehind", result.commits_behind);
        }
      })
      .finally(() => {
        this.set("fetchingCommits", false);
      });
  }

  @action
  updatePages(pages) {
    this.set("pages", pages);
  }

  @action
  toggleShowPages() {
    this.setProperties({
      showPages: true,
      showGlobal: false,
    });
  }

  @action
  toggleShowGlobal() {
    this.setProperties({
      showPages: false,
      showGlobal: true,
    });
  }
}
