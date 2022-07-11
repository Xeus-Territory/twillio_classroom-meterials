import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import Default from "./layouts/Default.vue";
import Blank from "./layouts/Blank.vue";

Vue.config.productionTip = false;
Vue.component("default-layout", Default);
Vue.component("blank-layout", Blank);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
