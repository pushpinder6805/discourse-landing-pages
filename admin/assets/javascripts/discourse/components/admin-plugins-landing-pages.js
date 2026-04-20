import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import EmberObject, { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { extractError } from "discourse/lib/ajax-error";
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

  @tracked pages;
  @tracked menus;
  @tracked remote;
  @tracked themes;
  @tracked groups;
  @tracked global;
  @tracked fetchingCommits = false;
  @tracked commitsBehind = null;
  @tracked showPages = true;
  @tracked showGlobal = false;
  @tracked pullingFromRemote = false;
  @tracked pagesNotFetched = false;
  @tracked resultMessages;

  resultMessagesTimeoutId;

  constructor() {
    super(...arguments);

    const model = this.args.model;

    this.pages = model.pages;
    this.menus = model.menus;
    this.remote = EmberObject.create(model.remote || {});
    this.themes = model.themes;
    this.groups = model.groups;
    this.global = model.global;

    if (model.remote?.commit) {
      this.fetchCommitsBehind();
    } else if (model.remote) {
      this.pagesNotFetched = true;
    }

    this.loadThemes();
    this.loadGroups();
  }

  willDestroy() {
    super.willDestroy(...arguments);
    clearTimeout(this.resultMessagesTimeoutId);
  }

  async loadThemes() {
    const result = await ajax("/admin/themes");

    this.themes = result.themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
    }));
  }

  async loadGroups() {
    this.groups = await Group.findAll();
  }

  get remoteDisconnected() {
    return !this.remote?.connected;
  }

  get pullDisabled() {
    return this.pullingFromRemote || this.remoteDisconnected;
  }

  get hasCommitsBehind() {
    return this.commitsBehind > 0;
  }

  get messages() {
    if (this.resultMessages) {
      return {
        status: this.resultMessages.type,
        items: this.resultMessages.messages.map((message) => {
          return {
            icon: statusIcons[this.resultMessages.type],
            text: message,
          };
        }),
      };
    }

    if (this.staticMessage) {
      return {
        status: "static",
        items: [
          {
            icon: this.staticMessage.icon,
            text: this.staticMessage.text,
          },
        ],
      };
    }

    return null;
  }

  get hasMessages() {
    return this.messages?.items?.length > 0;
  }

  get staticMessage() {
    let key;
    let icon = "circle-info";

    if (this.showGlobal) {
      key = "global.description";
    } else if (this.remote?.connected) {
      if (this.pagesNotFetched) {
        key = "remote.repository.not_fetched";
      } else if (this.fetchingCommits) {
        key = "remote.repository.checking_status";
      } else if (this.hasCommitsBehind) {
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

  get documentationUrl() {
    return "https://coop.pavilion.tech";
  }

  setResultMessages(type, messages) {
    clearTimeout(this.resultMessagesTimeoutId);

    this.resultMessages = { type, messages };

    this.resultMessagesTimeoutId = setTimeout(() => {
      this.resultMessages = null;
    }, 15000);
  }

  @action
  importPages() {
    this.modal.show(ImportPages).then((result) => {
      if (result?.page) {
        this.pages = result.pages;
        this.setResultMessages("success", [
          i18n("admin.landing_pages.imported.x_pages", { count: 1 }),
        ]);
      }
    });
  }

  @action
  updateRemote() {
    this.modal
      .show(UpdatePagesRemote, { model: { remote: this.remote } })
      .then((result) => {
        if (result?.remote) {
          this.remote = result.remote;
          this.pagesNotFetched = true;
        }
      });
  }

  @action
  pullFromRemote() {
    this.pullingFromRemote = true;

    ajax("/landing/remote/pages")
      .then((result) => {
        const pages = result.pages;
        const menus = result.menus;
        const global = result.global;
        const report = result.report;

        this.pages = pages;
        this.menus = menus;
        this.global = global;

        if (report.errors.length) {
          this.setResultMessages("error", result.report.errors);
        } else {
          const imported = report.imported;
          const messages = [];

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

          this.setResultMessages("success", messages);
          this.pagesNotFetched = false;

          this.fetchCommitsBehind();
        }
      })
      .catch((error) => {
        this.setResultMessages("error", [extractError(error)]);
      })
      .finally(() => {
        this.pullingFromRemote = false;
      });
  }

  @action
  fetchCommitsBehind() {
    this.fetchingCommits = true;

    ajax("/landing/remote/commits-behind")
      .then((result) => {
        if (!result.failed) {
          this.commitsBehind = result.commits_behind;
        }
      })
      .finally(() => {
        this.fetchingCommits = false;
      });
  }

  @action
  updatePages(pages) {
    this.pages = pages;
  }

  @action
  toggleShowPages() {
    this.showPages = true;
    this.showGlobal = false;
  }

  @action
  toggleShowGlobal() {
    this.showPages = false;
    this.showGlobal = true;
  }
}
