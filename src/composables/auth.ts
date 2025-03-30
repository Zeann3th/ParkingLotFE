
import { ref, computed } from "vue";
import { jwtDecode } from "jwt-decode";
import { memoryStorage } from "@/storage";

export function useAuth() {
  const token = ref(memoryStorage.getToken());

  const decodedToken = computed(() => {
    if (!token.value) return null;
    try {
      return jwtDecode(token.value) as { role: string; username: string; email: string };
    } catch (e) {
      return null;
    }
  });

  const role = computed(() => decodedToken.value?.role || "");
  const username = computed(() => decodedToken.value?.username || "");
  const email = computed(() => decodedToken.value?.email || "");

  return { role, username, email };
}

