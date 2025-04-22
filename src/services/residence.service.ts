import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { CreateResidence, Residence, ResidenceResponse } from '@/types';

export const residenceService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<ResidenceResponse> {
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
  }
};
