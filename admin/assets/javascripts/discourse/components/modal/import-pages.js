import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { popupAjaxError } from "discourse/lib/ajax-error";
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
}
