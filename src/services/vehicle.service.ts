import { memoryStorage } from "@/storage";
import type { CreateVehicle, Vehicle, VehicleResponse } from "@/types";
import axios from "axios";

export const vehicleService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<VehicleResponse> {
    try {
      const response = await axios.get("/vehicles", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
          ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
        },
        params: { page, limit }
      });
      return response.data as VehicleResponse;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch vehicles");
    }
  },
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
  async create(vehicle: CreateVehicle): Promise<{ message: string }> {
    try {
      const response = await axios.post<{ message: string }>("/vehicles", vehicle, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to create vehicle");
    }
  },
  async update(id: number, plate: string): Promise<Vehicle> {
    try {
      const response = await axios.patch(`/vehicles/${id}`, { plate }, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data as Vehicle;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to update vehicle");
    }
  },
  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete<{ message: string }>(`/vehicles/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to delete vehicle");
    }
  },
  async search(plate: string): Promise<Vehicle[]> {
    try {
      const response = await axios.get<{ count: number, data: Vehicle[]; }>("/vehicles/search", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
        params: {
          plate
        },
      });
      return response.data.data as Vehicle[];
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to search vehicle");
    }
  }
};
