import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { CreateResidence, Residence, ResidenceResponse } from '@/types';

export const residenceService = {
  async getAll(page: number = 1, limit: number = 20, opts?: { cache: boolean; }): Promise<ResidenceResponse> {
    try {
      const response = await axios.get("/residences", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
          ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
        },
        params: { page, limit }
      });
      return response.data as ResidenceResponse;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch residences");
    }
  },

  async getById(id: number): Promise<Residence> {
    try {
      const response = await axios.get(`/residences/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data as Residence;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch residence");
    }
  },
  async create(residence: CreateResidence): Promise<void> {
    try {
      await axios.post("/residences", residence, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to create residence");
    }
  },
  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`/residences/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to delete residence");
    }
  },
  async addResident(id: number, userId: number): Promise<void> {
    try {
      await axios.post(`/residences/${id}/residents/${userId}`, {}, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to add resident to residence");
    }
  },
  async removeResident(id: number, userId: number): Promise<void> {
    try {
      await axios.delete(`/residences/${id}/residents/${userId}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to remove resident from residence");
    }
  },
  async addVehicle(id: number, vehicleId: number): Promise<void> {
    try {
      await axios.post(`/residences/${id}/vehicles/${vehicleId}`, {}, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to add vehicle to residence");
    }
  },
  async removeVehicle(id: number, vehicleId: number): Promise<void> {
    try {
      await axios.delete(`/residences/${id}/vehicles/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to remove vehicle from residence");
    }
  },
};
