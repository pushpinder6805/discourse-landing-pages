import DiscourseRoute from "discourse/routes/discourse";
import LandingPage from "../../../models/landing-page";

export default DiscourseRoute.extend({
  model() {
    return LandingPage.all();
  },
});
