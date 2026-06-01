import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

const basePath = "/landing/global";

export default class LandingPageGlobal {
  static save(data) {
    return ajax(`${basePath}`, {
      type: "PUT",
      data,
    }).catch(popupAjaxError);
  }

  static destroy() {
    return ajax(`${basePath}`, {
      type: "DELETE",
    }).catch(popupAjaxError);
  }
}
