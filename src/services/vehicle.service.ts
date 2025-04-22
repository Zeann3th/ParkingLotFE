import { memoryStorage } from "@/storage";
import type { Vehicle } from "@/types";
import axios from "axios";

export const vehicleService = {
  async getById(id: number): Promise<Vehicle> {
    try {
      const response = await axios.get(`/vehicles/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data as Vehicle;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch vehicle");
    }
  },
  async search(opts: { plate?: string; }): Promise<Vehicle[]> {
    try {
      const response = await axios.get<{ count: number, data: Vehicle[]; }>("/vehicles/search", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
        params: opts,
      });
      return response.data.data as Vehicle[];
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to search vehicle");
    }
  }
};
