import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import SignInView from "../views/auth/SignInView.vue";
import SignUpView from "../views/auth/SignUpView.vue";
import { memoryStorage } from "@/storage";
import InboxView from "@/views/InboxView.vue";
import TicketView from "@/views/TicketView.vue";
import axios from "axios";
import SettingView from "@/views/SettingView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import DashBoardView from "@/views/DashBoardView.vue";
import ParkingView from "@/views/ParkingView.vue";
import TransactionView from "@/views/TransactionView.vue";
import { useAuth } from "@/composables/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: HomeView,
      name: "home",
      meta: { title: "The Parking Hub", }
    },
    {
      path: "/sign-in",
      component: SignInView,
      name: "auth.sign-in",
      meta: { title: "Sign In" }
    },
    {
      path: "/sign-up",
      component: SignUpView,
      name: "auth.sign-up",
      meta: { title: "Sign Up" }
    },
    {
      path: "/dashboard",
      component: DashBoardView,
      name: "dashboard",
      meta: { title: "Dashboard", requiresAuth: true, allows: ["ADMIN", "SECURITY", "USER"] }
    },
    {
      path: "/parking",
      component: ParkingView,
      name: "parking",
      meta: { title: "Parking", requiresAuth: true, allows: ["ADMIN", "SECURITY"] }
    },
    {
      path: "/inbox",
      component: InboxView,
      name: "inbox",
      meta: { title: "Inbox", requiresAuth: true, allows: ["ADMIN", "SECURITY", "USER"] }
    },
    {
      path: "/tickets",
      component: TicketView,
      name: "tickets",
      meta: { title: "Tickets", requiresAuth: true, allows: ["ADMIN", "SECURITY", "USER"] }
    },
    {
      path: "/transactions",
      component: TransactionView,
      name: "transactions",
      meta: { title: "Transactions", requiresAuth: true, allows: ["ADMIN", "USER"] }
    },
    {
      path: "/settings",
      component: SettingView,
      name: "settings",
      meta: { title: "Settings", requiresAuth: true, allows: ["ADMIN", "SECURITY", "USER"] },
    },
    {
      path: "/:pathMatch(.*)*",
      component: NotFoundView,
      name: "not-found",
      meta: { title: "Not Found" }
    }
  ]
});

router.beforeEach(async (to, _, next) => {
  document.title = to.meta.title || "The Parking Hub";

  if (!to.meta?.requiresAuth) {
    return next();
  }

  const token = memoryStorage.getToken();
  let isAuthenticated = !!token;

  if (!token) {
    try {
      const response = await axios.get("/auth/refresh");
      if (response.status === 200 && response.data.access_token) {
        memoryStorage.setToken(response.data.access_token);
        isAuthenticated = true;
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      return next({ name: "auth.sign-in", query: { redirect: to.fullPath } });
    }
  }

  if (!isAuthenticated) {
    return next({ name: "auth.sign-in", query: { redirect: to.fullPath } });
  }

  if (to.meta.allows) {
    const { role } = useAuth();

    if (!role || !to.meta.allows.includes(role.value as "ADMIN" | "SECURITY" | "USER")) {
      return next({ name: "dashboard" });
    }
  }

  next();
});

export default router;
