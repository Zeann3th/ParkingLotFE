import { ref, computed } from "vue";
import { jwtDecode } from "jwt-decode";

export function useAuth() {
  const token = ref(sessionStorage.getItem("access_token"));

  const role = computed(() => {
    if (!token.value) return null;
    try {
      const decoded: any = jwtDecode(token.value);
      return decoded.role;
    } catch (e) {
      return null;
    }
  });

  return { role };
}
