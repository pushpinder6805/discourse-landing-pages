import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { on } from "@ember/modifier";
import DButton from "discourse/components/d-button";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import icon from "discourse/helpers/d-icon";
import { i18n } from "discourse-i18n";
import JsonEditor from "./json-editor";
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
  @tracked newScriptValue = "";

  constructor() {
    super(...arguments);
    this.global = this.args.global;
    this.initializeProps();
  }

  initializeProps() {
    this.scripts = this.global?.scripts || [];
    this.jsonHeader = JSON.stringify(this.global?.header || undefined, null, 4);
    this.jsonFooter = JSON.stringify(this.global?.footer || undefined, null, 4);
  }

  get updatingGlobal() {
    return this.destroyingGlobal || this.savingGlobal;
  }

  get scriptItems() {
    if (!this.scripts) {
      return [];
    }
    if (Array.isArray(this.scripts)) {
      return this.scripts;
    }
    return this.scripts.split("|").filter(Boolean);
  }

  @action
  onNewScriptInput(event) {
    this.newScriptValue = event.target.value;
  }

  @action
  addScript() {
    if (!this.newScriptValue.trim()) {
      return;
    }
    const items = [...this.scriptItems, this.newScriptValue.trim()];
    this.scripts = items;
    this.newScriptValue = "";
  }

  @action
  removeScript(index) {
    const items = [...this.scriptItems];
    items.splice(index, 1);
    this.scripts = items;
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
        scripts: this.scriptItems,
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

  <template>
    <div class="page-header">
      <div class="page-name">
        <span>{{i18n "admin.landing_pages.global.label"}}</span>
      </div>

      <div class="buttons">
        {{#if this.resultIcon}}
          {{icon this.resultIcon}}
        {{/if}}

        {{#if this.updatingGlobal}}
          <ConditionalLoadingSpinner @condition={{true}} @size="small" />
        {{/if}}

        <DButton
          @action={{this.destroyGlobal}}
          @label="admin.landing_pages.destroy"
          @disabled={{this.updatingGlobal}}
          @icon="xmark"
        />

        <DButton
          @action={{this.saveGlobal}}
          @label="admin.landing_pages.save"
          class="btn-primary"
          @disabled={{this.updatingGlobal}}
          @icon="floppy-disk"
        />
      </div>
    </div>

    <div class="page-global">
      <div class="control-group">
        <label class="control-label">
          {{i18n "admin.landing_pages.global.scripts.label"}}
        </label>

        <div class="value-list">
          <div class="value-list-input">
            <input
              type="text"
              value={{this.newScriptValue}}
              placeholder="https://example.com/script.js"
              {{on "input" this.onNewScriptInput}}
            />
            <DButton
              @action={{this.addScript}}
              @icon="plus"
              class="btn-primary btn-small"
            />
          </div>
          {{#if this.scriptItems.length}}
            <div class="values">
              {{#each this.scriptItems as |item index|}}
                <div class="value">
                  <span class="value-text">{{item}}</span>
                  <DButton
                    @action={{this.removeScript}}
                    @actionParam={{index}}
                    @icon="xmark"
                    class="btn-flat btn-small remove-value-btn"
                  />
                </div>
              {{/each}}
            </div>
          {{/if}}
        </div>

        <div class="control-instructions">
          {{! eslint-disable-next-line no-triple-curlies }}
          {{{i18n "admin.landing_pages.global.scripts.description"}}}
        </div>
      </div>

      <div class="control-group global-editor">
        <label class="control-label">
          {{i18n "admin.landing_pages.global.header.label"}}
        </label>

        <div class="control-instructions">
          {{! eslint-disable-next-line no-triple-curlies }}
          {{{i18n "admin.landing_pages.global.header.description"}}}
        </div>

        <JsonEditor @content={{this.jsonHeader}} />
        {{#if this.jsonHeaderError}}
          <span class="validation-error">
            {{icon "xmark"}}
            {{i18n
              "admin.landing_pages.global.header.error"
              error=this.jsonHeaderError
            }}
          </span>
        {{/if}}
      </div>

      <div class="control-group global-editor">
        <label class="control-label">
          {{i18n "admin.landing_pages.global.footer.label"}}
        </label>

        <div class="control-instructions">
          {{! eslint-disable-next-line no-triple-curlies }}
          {{{i18n "admin.landing_pages.global.footer.description"}}}
        </div>

        <JsonEditor @content={{this.jsonFooter}} />
        {{#if this.jsonFooterError}}
          <span class="validation-error">
            {{icon "xmark"}}
            {{i18n
              "admin.landing_pages.global.footer.error"
              error=this.jsonFooterError
            }}
          </span>
        {{/if}}
      </div>
    </div>
  </template>
}
