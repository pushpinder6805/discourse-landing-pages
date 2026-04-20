import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import BufferedProxy from "ember-buffered-proxy/proxy";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class UpdatePagesRemote extends Component {
  @tracked buffered;
  @tracked tested;
  @tracked testing = false;
  @tracked updating = false;
  @tracked resetting = false;
  @tracked keyLoading = false;

  keyGenUrl = "/admin/themes/generate_key_pair";
  remoteUrl = "/landing/remote";
  httpsPlaceholder = "https://github.com/org/repo";
  sshPlaceholder = "git@github.com:org/repo.git";

  constructor() {
    super(...arguments);
    this.buffered = BufferedProxy.create({
      content: this.args.model.remote,
    });
  }

  get showPublicKey() {
    return this.buffered.private && this.buffered.public_key;
  }

  get loading() {
    return this.testing || this.updating || this.resetting;
  }

  get updateDisabled() {
    return this.tested !== "success" || this.loading;
  }

  get resetDisabled() {
    return !this.buffered.connected || this.loading;
  }

  get testDisabled() {
    return !this.buffered.url || this.loading;
  }

  get urlPlaceholder() {
    return this.buffered.private ? this.sshPlaceholder : this.httpsPlaceholder;
  }

  get testIcon() {
    return this.tested === "success"
      ? "check"
      : this.tested === "error"
        ? "xmark"
        : null;
  }

  @action
  remoteChanged() {
    this.tested = null;
  }

  @action
  privateWasChecked(event) {
    this.buffered.set("private", event.target.checked);
    this.remoteChanged();

    if (
      this.buffered.get("private") &&
      !this.buffered.get("public_key") &&
      !this.keyLoading
    ) {
      this.keyLoading = true;

      ajax(this.keyGenUrl, { type: "POST" })
        .then((result) => {
          this.buffered.setProperties({
            private_key: result.private_key,
            public_key: result.public_key,
          });
        })
        .catch(popupAjaxError)
        .finally(() => (this.keyLoading = false));
    }
  }

  buildData() {
    this.buffered.applyChanges();
    const remote = this.args.model.remote;
    return {
      remote: {
        url: remote.url,
        branch: remote.branch,
        ...(remote.private && { private_key: remote.private_key }),
        ...(remote.private && { public_key: remote.public_key }),
      },
    };
  }

  @action
  test() {
    this.testing = true;

    ajax(this.remoteUrl + "/test", {
      type: "POST",
      data: this.buildData(),
    })
      .then((result) => {
        this.tested = result.success ? "success" : "error";
      })
      .catch(popupAjaxError)
      .finally(() => (this.testing = false));
  }

  @action
  update() {
    this.updating = true;

    ajax(this.remoteUrl, {
      type: "PUT",
      data: this.buildData(),
    })
      .then((result) => {
        this.args.closeModal(result);
        this.args.model.remote = {};
      })
      .catch(popupAjaxError)
      .finally(() => (this.updating = false));
  }

  @action
  reset() {
    this.resetting = true;

    ajax(this.remoteUrl, {
      type: "DELETE",
    })
      .then(() => {
        this.args.closeModal({ remote: {} });
        this.args.model.remote = {};
      })
      .catch(popupAjaxError)
      .finally(() => (this.resetting = false));
  }
}
