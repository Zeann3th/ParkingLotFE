import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { Notification, NotificationResponse } from '@/types';

export const notificationService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<NotificationResponse> {
    try {
      const response = await axios.get("/notifications", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
          ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
        },
        params: { page, limit }
      });
      return response.data as NotificationResponse;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch notifications");
    }
  },

  async getById(id: number): Promise<Notification> {
    try {
      const response = await axios.get(`/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data as Notification;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch notification");
    }
  },

  async update(id: number): Promise<void> {
    try {
      await axios.patch(
        `/notifications/${id}`,
        { action: "READ" },
        {
          headers: {
            Authorization: `Bearer ${memoryStorage.getToken()}`,
          }
        }
      );
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to update notification");
    }
  },
  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to delete notification");
    }
  },
  async create(message: string, to?: number): Promise<void> {
    const payload: { message: string; to?: number; } = { message };
    if (to) payload.to = to;

    try {
      await axios.post("/notifications", payload, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to create notification");
    }
  }
};
