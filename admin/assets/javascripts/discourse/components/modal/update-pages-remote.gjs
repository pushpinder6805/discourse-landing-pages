import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { on } from "@ember/modifier";
import DButton from "discourse/components/d-button";
import DModal from "discourse/components/d-modal";
import DModalCancel from "discourse/components/d-modal-cancel";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import icon from "discourse/helpers/d-icon";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";

export default class UpdatePagesRemote extends Component {
  @tracked url;
  @tracked branch;
  @tracked isPrivate;
  @tracked publicKey;
  @tracked privateKey;
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
    const remote = this.args.model.remote;
    this.url = remote.url || "";
    this.branch = remote.branch || "";
    this.isPrivate = remote.private || false;
    this.publicKey = remote.public_key || "";
    this.privateKey = remote.private_key || "";
  }

  get connected() {
    return this.args.model.remote.connected;
  }

  get showPublicKey() {
    return this.isPrivate && this.publicKey;
  }

  get loading() {
    return this.testing || this.updating || this.resetting;
  }

  get updateDisabled() {
    return this.tested !== "success" || this.loading;
  }

  get resetDisabled() {
    return !this.connected || this.loading;
  }

  get testDisabled() {
    return !this.url || this.loading;
  }

  get urlPlaceholder() {
    return this.isPrivate ? this.sshPlaceholder : this.httpsPlaceholder;
  }

  get testIcon() {
    return this.tested === "success"
      ? "check"
      : this.tested === "error"
        ? "xmark"
        : null;
  }

  @action
  onUrlChange(event) {
    this.url = event.target.value;
    this.tested = null;
  }

  @action
  onBranchChange(event) {
    this.branch = event.target.value;
    this.tested = null;
  }

  @action
  privateWasChecked(event) {
    this.isPrivate = event.target.checked;
    this.tested = null;

    if (this.isPrivate && !this.publicKey && !this.keyLoading) {
      this.keyLoading = true;

      ajax(this.keyGenUrl, { type: "POST" })
        .then((result) => {
          this.privateKey = result.private_key;
          this.publicKey = result.public_key;
        })
        .catch(popupAjaxError)
        .finally(() => (this.keyLoading = false));
    }
  }

  buildData() {
    return {
      remote: {
        url: this.url,
        branch: this.branch,
        ...(this.isPrivate && { private_key: this.privateKey }),
        ...(this.isPrivate && { public_key: this.publicKey }),
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
      })
      .catch(popupAjaxError)
      .finally(() => (this.resetting = false));
  }

  <template>
    <DModal
      class="update-pages-remote"
      @title={{i18n "admin.landing_pages.remote.title"}}
      @closeModal={{@closeModal}}
    >
      <:body>
        <div class="url">
          <div class="label">{{i18n "admin.landing_pages.remote.url"}}</div>
          <input
            type="text"
            value={{this.url}}
            placeholder={{this.urlPlaceholder}}
            {{on "input" this.onUrlChange}}
          />
        </div>

        <div class="branch">
          <div class="label">{{i18n "admin.customize.theme.remote_branch"}}</div>
          <input
            type="text"
            value={{this.branch}}
            placeholder="main"
            {{on "input" this.onBranchChange}}
          />
        </div>

        <div class="check-private">
          <label>
            <input
              type="checkbox"
              checked={{this.isPrivate}}
              {{on "change" this.privateWasChecked}}
            />
            {{i18n "admin.landing_pages.remote.private"}}
          </label>
        </div>

        {{#if this.showPublicKey}}
          <div class="public-key">
            <div class="label">{{i18n "admin.customize.theme.public_key"}}</div>
            <textarea readonly>{{this.publicKey}}</textarea>
          </div>
        {{/if}}
      </:body>

      <:footer>
        <DButton
          @action={{this.update}}
          @disabled={{this.updateDisabled}}
          class="btn btn-primary"
          @label="admin.landing_pages.remote.update"
        />

        <DButton
          @action={{this.reset}}
          @disabled={{this.resetDisabled}}
          class="btn btn-danger"
          @label="admin.landing_pages.remote.reset"
        />

        <DButton
          @action={{this.test}}
          @disabled={{this.testDisabled}}
          class="btn btn-test"
          @label="admin.landing_pages.remote.test"
        />

        {{#if this.loading}}
          <ConditionalLoadingSpinner @condition={{true}} @size="small" />
        {{else}}
          {{#if this.testIcon}}
            {{icon this.testIcon class=this.tested}}
          {{/if}}
        {{/if}}

        <DModalCancel @close={{@closeModal}} />
      </:footer>
    </DModal>
  </template>
}
