import { createMemoryHistory, createRouter } from "vue-router";
import HomeView from "../views/HomeView.vue";
import SignInView from "../views/auth/SignInView.vue";
import SignUpView from "../views/auth/SignUpView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: "/",
      component: HomeView,
      name: "home",
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/sign-in",
      component: SignInView,
      name: "auth.sign-in"
    },
    {
      path: "/sign-up",
      component: SignUpView,
      name: "auth.sign-up"
    }
  ]
})

router.beforeEach((to, _, next) => {
  if (to.meta.requiresAuth && !sessionStorage.getItem("access_token")) next({ name: "auth.sign-in" });
  else next();
});

export default router;
