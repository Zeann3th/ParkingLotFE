import { memoryStorage } from '@/storage';
import type { CreateSection, Section } from '@/types';
import axios from 'axios';

export const sectionService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<Section[]> {
    try {
      const response = await axios.get('/sections', {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
          ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
        },
        params: { page, limit },
      });
      console.log('response', response.data);
      return response.data as Section[];
    } catch (error: any) {
      throw new Error(error.response?.data?.message ?? 'Failed to fetch sections');
    }
  },
  async getById(id: number): Promise<Section> {
    try {
      const response = await axios.get(`/sections/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      });
      return response.data as Section;
    } catch (error: any) {
      throw new Error(error.response?.data?.message ?? 'Failed to fetch section');
    }
  },
  async create(section: CreateSection): Promise<void> {
    try {
      await axios.post('/sections', section, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      });
      return;
    } catch (error: any) {
      throw new Error(error.response?.data?.message ?? 'Failed to create section');
    }
  },
  async update(id: number, section: Partial<Section>, privilegedTo?: number[]): Promise<Section> {
    try {
      const response = await axios.patch(`/sections/${id}`, {
        ...section,
        ...(privilegedTo ? privilegedTo.length > 0 ? { privilegedTo } : {} : {})
      }, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message ?? 'Failed to update section');
    }
  },
  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`/sections/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      });
      return;
    } catch (error: any) {
      throw new Error(error.response?.data?.message ?? 'Failed to delete section');
    }
  },
  async report(id: number, opts?: {from: string | undefined, to: string | undefined}): Promise<{revenue: number}> {
    try {
      const response = await axios.post(`/sections/${id}/report`, {},{
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
        params: {
            ...(opts?.from ? { from: opts.from } : {}),
            ...(opts?.to ? { to: opts.to } : {})
        }
      });
      return response.data;
    }  catch (error: any) {
      throw new Error(error.response?.data?.message ?? 'Failed to report section');
    }
  }
};