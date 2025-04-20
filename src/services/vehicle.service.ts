import { memoryStorage } from "@/storage";
import type { Vehicle } from "@/types";
import axios from "axios";

export const vehicleService = {
  async getById(id: number): Promise<Vehicle> {
    const response = await axios.get<Vehicle>(`/vehicles/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
    return response.data;
  },
  async search(opts: { plate?: string; }): Promise<Vehicle[]> {
    const response = await axios.get<Vehicle[]>("/vehicles/search", {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
      params: opts,
    });
    return response.data;
  }
};
