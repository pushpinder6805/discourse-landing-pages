import { apiInitializer } from "discourse/lib/api";
import DiscourseURL from "discourse/lib/url";

export default apiInitializer((api) => {
  const site = api.container.lookup("service:site");
  const existing = DiscourseURL.routeTo;

  DiscourseURL.routeTo = function (url, opts) {
    let parser = document.createElement("a");
    parser.href = url;
    if (
      parser.pathname &&
      site.landing_paths.includes(parser.pathname.replace(/^\//, ""))
    ) {
      return (window.location = url);
    }
    return existing.apply(this, [url, opts]);
  };
});
