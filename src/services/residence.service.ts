import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { Residence, ResidenceResponse } from '@/types';

export const residenceService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<ResidenceResponse> {
    const response = await axios.get<ResidenceResponse>("/residences", {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
        ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
      },
      params: { page, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Residence> {
    const response = await axios.get<Residence>(`/residences/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
    return response.data;
  },
};
