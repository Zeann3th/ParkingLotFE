import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { Notification, NotificationResponse } from '@/types';

export const notificationService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<NotificationResponse> {
    const response = await axios.get<NotificationResponse>("/notifications", {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
        ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
      },
      params: { page, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Notification> {
    const response = await axios.get<Notification>(`/notifications/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
    return response.data;
  },

  async update(id: number): Promise<void> {
    await axios.patch(
      `/notifications/${id}`,
      { action: "READ" },
      {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      }
    );
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`/notifications/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
  },

  async create(message: string, to?: number): Promise<void> {
    const payload: { message: string; to?: number; } = { message };
    if (to) payload.to = to;

    await axios.post("/notifications", payload, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
  }
};
