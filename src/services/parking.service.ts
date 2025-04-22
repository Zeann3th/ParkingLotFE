import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { CheckIn, CheckOut } from '@/types';

export const parkingService = {
  async checkIn(checkInData: CheckIn): Promise<void> {
    try {
      const payload = {
        ...checkInData,
        sectionId: Number(checkInData.sectionId),
        ticketId: Number(checkInData.ticketId),
      };

      await axios.post("/parking/check-in", payload, {
        headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
      });
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to check in");
    }
  },

  async checkOut(checkOutData: CheckOut): Promise<{ fee: number }> {
    try {
      const payload = {
        ...checkOutData,
        sectionId: Number(checkOutData.sectionId),
        ticketId: Number(checkOutData.ticketId),
      };

      const response = await axios.post("/parking/check-out", payload, {
        headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
      });
      return response.data as { fee: number };
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to check out");
    }
  }
};
