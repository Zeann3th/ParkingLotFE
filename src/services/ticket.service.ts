import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { CreateTicket, Ticket, TicketResponse } from '@/types';

export const ticketService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<TicketResponse> {
    const response = await axios.get<TicketResponse>("/tickets", {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
        ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
      },
      params: { page, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Ticket> {
    const response = await axios.get<Ticket>(`/tickets/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
    return response.data;
  },
  async create(ticket: CreateTicket): Promise<{ message: string, ticketId: number; }> {
    const response = await axios.post<{ message: string, ticketId: number; }>("/tickets", ticket, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });
    return response.data;
  }
};
;
