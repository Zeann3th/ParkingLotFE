import type { User } from "@/types";
import axios from "axios";
import { memoryStorage } from "@/storage";

export const userService = {
  async getById(id: number): Promise<User> {
    try {
      const response = await axios.get(`/auth/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      });
      return response.data as User;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch user");
    }
  },
  async search(opts: { name?: string, email?: string; }): Promise<User[]> {
    try {
      const response = await axios.get("/auth/search", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
        params: opts,
      });
      return response.data as User[];
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to search user");
    }
  }
}


