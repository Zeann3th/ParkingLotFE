<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Button from 'primevue/button';
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';
import { memoryStorage } from '@/storage';
import router from '@/router';

interface Pricing {
  type: 'DAILY' | 'MONTHLY' | 'RESERVED';
  vehicleType: 'MOTORBIKE' | 'CAR';
  price: number;
}

const toast = useToast();
const pricing = ref<Pricing[]>([]);
const loading = ref<boolean>(true);

onMounted(async () => {
  try {
    const response = await axios.get<Pricing[]>('/tickets/pricing');
    pricing.value = response.data;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pricing data', life: 3000 });
  } finally {
    loading.value = false;
  }
});

const sortedPricing = computed<Pricing[]>(() => {
  const typeOrder: Record<Pricing['type'], number> = { 'DAILY': 1, 'MONTHLY': 2, 'RESERVED': 3 };
  const vehicleOrder: Record<Pricing['vehicleType'], number> = { 'MOTORBIKE': 1, 'CAR': 2 };
  return [...pricing.value].sort((a, b) => {
    const typeComparison = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
    return typeComparison !== 0 ? typeComparison : (vehicleOrder[a.vehicleType] || 99) - (vehicleOrder[b.vehicleType] || 99);
  });
});

const handleSignIn = async () => {
  const token = memoryStorage.getToken();
  if (token) {
    router.push('/dashboard');
  }

  try {
    const response = await axios.get("/auth/refresh");

    if (response.status === 200 && response.data.access_token) {
      memoryStorage.setToken(response.data.access_token);
      router.push('/dashboard');
    } else {
      throw new Error('Invalid refresh response');
    }
  } catch (error) {
    console.error('Auth refresh failed:', error);
    router.push('/sign-in');
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
    <nav
      class="flex justify-between items-center p-6 bg-white/5 backdrop-blur-lg shadow-lg border-b border-white/10 rounded-3xl mx-4 mt-4">
      <RouterLink to="/"
        class="text-2xl font-bold bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent">ParkingHub
      </RouterLink>
      <div class="flex gap-4">
        <Button label="Sign In"
          class="rounded-full bg-white/10 hover:bg-white/20 px-6 py-3 border-none shadow-lg text-white"
          @click="handleSignIn()" />
        <RouterLink to="/sign-up">
          <Button label="Get Started"
            class="rounded-full bg-blue-500 hover:bg-blue-600 px-6 py-3 border-none shadow-lg text-white" />
        </RouterLink>
      </div>
    </nav>

    <header class="text-center py-24 px-4">
      <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent">Transparent
        Pricing</h1>
      <p class="text-xl text-blue-200/80 max-w-2xl mx-auto mt-4">Simple, affordable rates for all your parking needs.
      </p>
      <RouterLink to="/sign-up" class="inline-block mt-6">
        <Button label="Get Started"
          class="rounded-full px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 border-none shadow-lg" />
      </RouterLink>
    </header>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
      <div class="bg-white/5 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-white/10 p-8">
        <h2 class="text-3xl font-bold text-center mb-4">Parking Rates</h2>
        <p class="text-center text-blue-200/80 mb-6">Choose the option that best fits your needs</p>
        <DataTable :value="sortedPricing" :loading="loading" stripedRows class="border-none">
          <Column field="type" header="Plan Type">
            <template #body="{ data }">
              <span class="px-3 py-1 rounded-full text-sm" :class="{
                'bg-blue-400/20 text-blue-300': data.type === 'DAILY',
                'bg-purple-400/20 text-purple-300': data.type === 'MONTHLY',
                'bg-green-400/20 text-green-300': data.type === 'RESERVED'
              }">{{ data.type }}</span>
            </template>
          </Column>
          <Column field="vehicleType" header="Vehicle Type">
            <template #body="{ data }">
              <span class="text-lg">{{ data.vehicleType === 'MOTORBIKE' ? '🛵' : '🚗' }}</span>
              <span class="ml-2 capitalize text-blue-100">{{ data.vehicleType.toLowerCase() }}</span>
            </template>
          </Column>
          <Column field="price" header="Price">
            <template #body="{ data }">
              <span class="font-bold text-xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                {{ new Intl.NumberFormat('en-US').format(data.price) + " VND" }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <footer
      class="py-12 bg-white/5 backdrop-blur-lg border-t border-white/10 text-center text-blue-300/80 text-sm rounded-3xl mx-4">
      <p>&copy; 2025 The Parking Hub. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
.pricing-table .p-datatable-thead>tr>th {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

.pricing-table .p-datatable-tbody>tr>td {
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.p-button {
  transition: transform 0.2s ease-in-out;
}

.p-button:hover {
  transform: scale(1.05);
}
</style>
