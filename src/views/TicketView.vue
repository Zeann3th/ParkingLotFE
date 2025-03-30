<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from 'vue';
import MenuBar from '@/components/MenuBar.vue';
import { useAuth } from '@/composables/auth';
import axios from 'axios';
import { memoryStorage } from '@/storage';
import Skeleton from 'primevue/skeleton';

interface Ticket {
  id: number;
  title: string;
  type: "DAILY" | "MONTHLY" | "RESERVED";
  status: "AVAILABLE" | "INUSE" | "LOST";
  vehicleId?: number;
  userId?: number;
}

const { role } = useAuth();
const tickets: Ref<Ticket[]> = ref([]);
const selectedTicket = ref<Ticket | null>(null);
const loading = ref(true);
const detailsLoading = ref(false);

const fetchTickets = async () => {
  try {
    const response = await axios.get<{ count: number; data: Ticket[] }>(
      '/tickets',
      {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      }
    );
    tickets.value = response.data.data;
  } catch (error) {
    console.error('Error fetching tickets:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTicketDetails = async (id: number) => {
  detailsLoading.value = true;
  try {
    const response = await axios.get<Ticket>(`/tickets/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedTicket.value = response.data;
  } catch (error) {
    console.error('Error fetching ticket details:', error);
  } finally {
    detailsLoading.value = false;
  }
};

onMounted(fetchTickets);

const isAdmin = computed(() => role.value === 'ADMIN');
</script>

<template>
  <MenuBar />
  <div class="min-h-screen bg-gray-900 p-6 text-white">
    <h1 class="text-3xl font-bold mb-6">Tickets</h1>

    <ul v-if="!loading" class="divide-y divide-gray-700">
      <li v-for="ticket in tickets" :key="ticket.id" class="p-4 hover:bg-gray-800 cursor-pointer"
        @click="fetchTicketDetails(ticket.id)">
        <h2 class="text-lg font-semibold">{{ ticket.title }}</h2>
        <p class="text-gray-400">Type: {{ ticket.type }}</p>
        <p class="text-gray-500">Status: {{ ticket.status }}</p>
      </li>
    </ul>

    <div v-else>
      <div v-for="n in 5" :key="n" class="p-4">
        <Skeleton width="80%" height="1.5rem" class="mb-2" />
        <Skeleton width="60%" height="1rem" class="mb-1" />
        <Skeleton width="40%" height="1rem" />
      </div>
    </div>

    <div v-if="selectedTicket" class="mt-6 p-4 bg-gray-800 rounded-lg">
      <h2 class="text-xl font-semibold">Ticket Details</h2>
      <div v-if="detailsLoading">
        <Skeleton width="100%" height="1.5rem" class="mb-2" />
        <Skeleton width="80%" height="1rem" class="mb-1" />
        <Skeleton width="70%" height="1rem" />
      </div>
      <div v-else>
        <p><strong>ID:</strong> {{ selectedTicket.id }}</p>
        <p><strong>Title:</strong> {{ selectedTicket.title }}</p>
        <p><strong>Type:</strong> {{ selectedTicket.type }}</p>
        <p><strong>Status:</strong> {{ selectedTicket.status }}</p>
      </div>
    </div>
  </div>

  <button v-if="isAdmin" class="floating-btn bg-green-500 hover:bg-green-600 text-white">
    +
  </button>
</template>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
</style>
