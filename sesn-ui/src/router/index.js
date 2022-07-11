import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/detail",
    name: "detail",
    component: () => import("../views/BlogDetail.vue"),
  },
  {
    path: "/new",
    name: "new",
    meta: { layout: "blank" },
    component: () => import("../views/CreateBlog.vue"),
  },
  {
    path: "/profile",
    name: "userprofile",
    meta: { layout: "blank" },
    component: () => import("../views/UserProfile.vue"),
  },
  {
    path: "/rent",
    name: "rent",
    meta: { layout: "blank" },
    component: () => import("../views/RentUser.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

export default router;
