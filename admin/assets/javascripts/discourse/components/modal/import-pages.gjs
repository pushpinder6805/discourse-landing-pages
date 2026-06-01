import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { on } from "@ember/modifier";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";
import DModal from "discourse/components/d-modal";
import DModalCancel from "discourse/components/d-modal-cancel";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";
import LandingPage from "../../models/landing-page";

export default class ImportPages extends Component {
  @service dialog;

  @tracked pageFile;
  @tracked loading = false;

  get importDisabled() {
    return !this.pageFile || this.loading;
  }

  @action
  uploadFile(event) {
    this.pageFile = event.target.files[0];
  }

  @action
  importPage() {
    const data = new FormData();
    data.append("page", this.pageFile);

    this.loading = true;
    LandingPage.import(data)
      .then((result) => {
        this.args.closeModal(result);
      })
      .catch((e) => {
        if (typeof e === "string") {
          this.dialog.alert(e);
        } else {
          popupAjaxError(e);
        }
      })
      .finally(() => (this.loading = false));
  }

  <template>
    <DModal
      class="upload-selector import-pages"
      @title={{i18n "admin.landing_pages.import.title"}}
      @closeModal={{@closeModal}}
    >
      <:body>
        <div class="inputs">
          <input
            {{on "change" this.uploadFile}}
            type="file"
            id="file-input"
            accept=".zip,application/zip"
          /><br />
          <span class="description">{{i18n
              "admin.landing_pages.import.file_tip"
            }}</span>
        </div>
      </:body>

      <:footer>
        <DButton
          @action={{this.importPage}}
          @disabled={{this.importDisabled}}
          class="btn btn-primary"
          @label="admin.landing_pages.import.button"
        />
        <DModalCancel @close={{@closeModal}} />
      </:footer>
    </DModal>
  </template>
}
