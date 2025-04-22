import type { CreateSection, Section } from '@/types';
import axios from 'axios';

export const sectionService = {
    async getAll(page = 1, limit = 10, options = {}) {
        const response = await axios.get('/sections', {
            params: { page, limit },
            ...options
        });
        return response.data;
    },

    async getById(id: number) {
        const response = await axios.get(`/sections/${id}`);
        return response.data;
    },

    async create(section: CreateSection) {
        const response = await axios.post('/sections', section);
        return response.data;
    },

    async update(id: number, section: Partial<Section>) {
        const response = await axios.put(`/sections/${id}`, section);
        return response.data;
    },

    async delete(id: number) {
        const response = await axios.delete(`/sections/${id}`);
        return response.data;
    }
};