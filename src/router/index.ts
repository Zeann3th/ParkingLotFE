import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import SignInView from "../views/auth/SignInView.vue";
import SignUpView from "../views/auth/SignUpView.vue";
import { memoryStorage } from "@/storage";
import InboxView from "@/views/InboxView.vue";
import TicketView from "@/views/TicketView.vue";
import axios from "axios";
import SettingView from "@/views/SettingView.vue";

const router = createRouter({
  history: createWebHistory(),
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
    },
    {
      path: "/inbox",
      component: InboxView,
      name: "inbox",
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/tickets",
      component: TicketView,
      name: "tickets",
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/settings",
      component: SettingView,
      name: "settings",
      meta: {
        requiresAuth: true
      },
    }
  ]
})

router.beforeEach(async (to, _, next) => {
  if (!to.meta.requiresAuth) {
    return next();
  }

  const token = memoryStorage.getToken();
  if (token) {
    return next();
  }

  try {
    const response = await axios.get("/auth/refresh");

    if (response.status === 200 && response.data.access_token) {
      memoryStorage.setToken(response.data.access_token);
      return next();
    } else {
      throw new Error('Invalid refresh response');
    }
  } catch (error) {
    console.error('Auth refresh failed:', error);
    return next({
      name: "auth.sign-in",
      query: { redirect: to.fullPath }
    });
  }
});

export default router;
