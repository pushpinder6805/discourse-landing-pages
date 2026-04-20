import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import LandingPageGlobal from "../models/landing-page-global";

export default class GlobalAdmin extends Component {
  @tracked global;
  @tracked scripts;
  @tracked jsonHeader;
  @tracked jsonFooter;
  @tracked savingGlobal = false;
  @tracked destroyingGlobal = false;
  @tracked jsonHeaderError;
  @tracked jsonFooterError;
  @tracked resultIcon;

  constructor() {
    super(...arguments);
    this.global = this.args.global;
    this.initializeProps();
  }

  initializeProps() {
    this.scripts = this.global?.scripts;
    this.jsonHeader = JSON.stringify(this.global?.header || undefined, null, 4);
    this.jsonFooter = JSON.stringify(this.global?.footer || undefined, null, 4);
  }

  get updatingGlobal() {
    return this.destroyingGlobal || this.savingGlobal;
  }

  @action
  saveGlobal() {
    this.savingGlobal = true;
    this.jsonHeaderError = null;
    this.jsonFooterError = null;

    let header;
    try {
      header = JSON.parse(this.jsonHeader || "null");
    } catch (e) {
      this.jsonHeaderError = e.message;
    }

    let footer;
    try {
      footer = JSON.parse(this.jsonFooter || "null");
    } catch (e) {
      this.jsonFooterError = e.message;
    }

    if (this.jsonHeaderError || this.jsonFooterError) {
      this.savingGlobal = false;
      this.resultIcon = "xmark";
      setTimeout(() => (this.resultIcon = null), 10000);
      return;
    }

    const data = {
      global: {
        scripts: this.scripts,
        header,
        footer,
      },
    };

    LandingPageGlobal.save(data)
      .then((result) => {
        if (result.success) {
          this.resultIcon = "check";
          this.global = data.global;
          this.initializeProps();
        } else {
          this.resultIcon = "xmark";
        }
        setTimeout(() => (this.resultIcon = null), 10000);
      })
      .finally(() => (this.savingGlobal = false));
  }

  @action
  destroyGlobal() {
    this.destroyingGlobal = true;

    LandingPageGlobal.destroy()
      .then((result) => {
        if (result.success) {
          this.resultIcon = "check";
          this.global = {};
          this.initializeProps();
        } else {
          this.resultIcon = "xmark";
        }
        setTimeout(() => (this.resultIcon = null), 10000);
      })
      .finally(() => (this.destroyingGlobal = false));
  }
}
