import type { User } from "@/types";
import axios from "axios";
import { memoryStorage } from "@/storage";

export const userService = {
  async getById(id: number): Promise<User> {
    const response = await axios.get<User>(`/auth/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    return response.data;
  },
  async search(opts: { name?: string, email?: string; }): Promise<User[]> {
    const response = await axios.get<User[]>("/auth/search", {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
      params: opts,
    });
    return response.data;
  }
}


