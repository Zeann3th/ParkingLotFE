import axios from 'axios';
import { memoryStorage } from '@/storage';
import type { CreateTicket, ReserveTicket, Ticket, TicketResponse, UpdateTicket } from '@/types';

export const ticketService = {
  async getAll(page: number = 1, limit: number = 10, opts?: { cache: boolean; }): Promise<TicketResponse> {
    try {
      const response = await axios.get("/tickets", {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
          ...(opts?.cache === false ? { 'Cache-Control': 'no-cache' } : {})
        },
        params: { page, limit }
      });
      return response.data as TicketResponse;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch tickets");
    }
  },

  async getById(id: number): Promise<Ticket> {
    try {
      const response = await axios.get(`/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data as Ticket;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to fetch ticket");
    }
  },
  async create(ticket: CreateTicket): Promise<{ message: string, ticketId: number; }> {
    try {
      const response = await axios.post<{ message: string, ticketId: number; }>("/tickets", ticket, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to create ticket");
    }
  },
  async update(id: number, ticket: UpdateTicket): Promise<Ticket> {
    try {
      const response = await axios.patch(`/tickets/${id}`, ticket, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return response.data as Ticket;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to update ticket");
    }
  },
  async subcribe(id: number, ticket: ReserveTicket): Promise<void> {
    try {
      await axios.patch(`/tickets/${id}/reserve`, ticket, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to subscribe ticket");
    }
  },
  async unsubscribe(id: number): Promise<void> {
    try {
      await axios.patch(`/tickets/${id}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to unsubscribe ticket");
    }
  },
  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        }
      });
      return;
    } catch (error: any) {
      throw new Error(error.response.data.message ?? "Failed to delete ticket");
    }
  }
}


