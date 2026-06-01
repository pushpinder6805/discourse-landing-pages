import EmberObject from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

const basePath = "/landing/page";

export default class LandingPage extends EmberObject {
  get exportUrl() {
    return `${basePath}/${this.id}/export`;
  }

  save() {
    const path = this.id ? `${basePath}/${this.id}` : basePath;
    const method = this.id ? "PUT" : "POST";

    let page = {
      name: this.name,
      path: this.path,
      parent_id: this.parent_id,
      category_id: this.category_id,
      theme_id: this.theme_id,
      group_ids: this.group_ids,
      body: this.body,
      menu: this.menu,
    };

    return ajax(path, {
      type: method,
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(page),
    });
  }

  destroy() {
    return ajax(`${basePath}/${this.id}`, {
      type: "DELETE",
    }).catch(popupAjaxError);
  }

  export() {
    return ajax(this.exportUrl, {
      type: "GET",
      dataType: "binary",
      xhrFields: {
        responseType: "blob",
      },
    });
  }

  static all() {
    return ajax(basePath).catch(popupAjaxError);
  }

  static find(pageId) {
    return ajax(`${basePath}/${pageId}`).catch(popupAjaxError);
  }

  static import(data) {
    return ajax(`${basePath}/upload`, {
      type: "POST",
      processData: false,
      contentType: false,
      data,
    });
  }
}
