import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { dasherize } from "@ember/string";
import { extractError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";
import LandingPage from "../models/landing-page";

const location = window.location;
const port = location.port ? ":" + location.port : "";
const baseUrl = location.protocol + "//" + location.hostname + port;

export default class PageAdmin extends Component {
  @tracked page;
  @tracked savingPage = false;
  @tracked destroyingPage = false;
  @tracked resultMessage;

  get pages() {
    return this.args.pages;
  }

  get themes() {
    return this.args.themes;
  }

  get groups() {
    return this.args.groups;
  }

  get menus() {
    return this.args.menus;
  }

  get updatingPage() {
    return this.destroyingPage || this.savingPage;
  }

  get hasParent() {
    return !!this.parent;
  }

  updateProps(props = {}) {
    this.args.updatePages(props.pages || this.pages);

    if (props.page) {
      this.page = LandingPage.create(props.page);
    } else {
      this.page = null;
    }
  }

  showErrorMessage(error) {
    this.resultMessage = {
      style: "error",
      icon: "xmark",
      text: extractError(error),
    };
    setTimeout(() => (this.resultMessage = null), 5000);
  }

  get parent() {
    return this.pages.find((page) => page.id === this.page?.parent_id) || null;
  }

  get pagePath() {
    return this.parent ? this.parent.path : this.page?.path;
  }

  get pageUrl() {
    let url = baseUrl;
    if (this.pagePath) {
      url += `/${dasherize(this.pagePath)}`;
    } else {
      url += `/${i18n("admin.landing_pages.page.path.placeholder")}`;
    }
    if (this.hasParent) {
      url += `/1`;
    }
    return url;
  }

  @action
  onChangePath(event) {
    const path = event.target.value;
    if (!this.page.parent_id) {
      this.page.path = path;
    }
  }

  @action
  onChangeParent(pageId) {
    this.page.parent_id = pageId;
  }

  @action
  createPage() {
    this.updateProps({ page: {} });
  }

  @action
  changePage(pageId) {
    if (pageId) {
      LandingPage.find(pageId).then((result) => this.updateProps(result));
    } else {
      this.updateProps();
    }
  }

  @action
  savePage() {
    this.savingPage = true;

    this.page
      .save()
      .then((result) => {
        if (result) {
          this.updateProps(result);
        }
      })
      .catch((error) => this.showErrorMessage(error))
      .finally(() => (this.savingPage = false));
  }

  @action
  destroyPage() {
    const hasChildren = this.pages.find(
      (page) => page.parent_id === this.page.id,
    );
    if (hasChildren) {
      this.resultMessage = {
        style: "error",
        icon: "xmark",
        text: i18n("admin.landing_pages.page.destroy.has_children"),
      };
      setTimeout(() => (this.resultMessage = null), 5000);
      return;
    }

    this.destroyingPage = true;

    this.page
      .destroy()
      .then((result) => {
        if (result.success) {
          this.updateProps(result);
        }
      })
      .catch((error) => this.showErrorMessage(error))
      .finally(() => (this.destroyingPage = false));
  }

  @action
  exportPage() {
    this.page
      .export()
      .then((file) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.setAttribute(
          "download",
          `discourse-${this.page.name.toLowerCase()}.zip`,
        );
        link.click();
      })
      .catch((error) => this.showErrorMessage(error));
  }
}
