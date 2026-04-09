import AceEditor from "discourse/components/ace-editor";
import { bind } from "discourse/lib/decorators";

export default class JsonEditor extends AceEditor {
  mode = "json";

  @bind
  setupAce(element) {
    const pluginAcePath = "/plugins/discourse-landing-pages/javascripts/ace";
    this.ace.config.set("modePath", pluginAcePath);
    this.ace.config.set("workerPath", pluginAcePath);
    super.setupAce(element);
    this.editor.setOptions({
      useWorker: true,
      wrap: true,
    });
  }
}
