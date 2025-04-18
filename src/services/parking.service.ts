import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { CheckIn, CheckOut } from '@/types';

export const parkingService = {
  async checkIn(checkInData: CheckIn): Promise<{ message?: string; }> {
    const payload = {
      ...checkInData,
      sectionId: Number(checkInData.sectionId),
      ticketId: Number(checkInData.ticketId),
    };

    const response = await axios.post("/parking/check-in", payload, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });

    return response.data;
  },

  async checkOut(checkOutData: CheckOut): Promise<{ fee: number, message?: string; }> {
    const payload = {
      ...checkOutData,
      sectionId: Number(checkOutData.sectionId),
      ticketId: Number(checkOutData.ticketId),
    };

    const response = await axios.post("/parking/check-out", payload, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });

    return response.data;
  }
};
