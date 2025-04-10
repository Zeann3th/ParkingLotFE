<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import Button from 'primevue/button';
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';
import { memoryStorage } from '@/storage';
import router from '@/router';
import { RouterLink } from 'vue-router';
import type { Pricing } from '@/types';

const toast = useToast();
const pricing = ref<Pricing[]>([]);
const loading = ref<boolean>(true);
const activeFeature = ref<number>(0);
let featureInterval: number | undefined = undefined;

const features = [
  {
    title: "Smart Parking",
    description: "AI-powered parking space detection for optimal vehicle placement.",
    icon: "🤖"
  },
  {
    title: "24/7 Security",
    description: "Round-the-clock surveillance and security personnel.",
    icon: "👮"
  },
  {
    title: "Support Contactless Payment",
    description: "Secure digital payments with multiple options.",
    icon: "💳"
  }
];

onMounted(async () => {
  loading.value = true;
  try {
    const response = await axios.get<Pricing[]>('/tickets/pricing');
    pricing.value = response.data.map(item => ({
      ...item,
      features: getFeaturesForType(item.type)
    }));
  } catch (error) {
    console.error("Failed to load pricing data:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pricing data', life: 3000 });
  } finally {
    loading.value = false;
    if (featureInterval) clearInterval(featureInterval);
    featureInterval = setInterval(() => {
      activeFeature.value = (activeFeature.value + 1) % features.length;
    }, 5000);
  }
});

onUnmounted(() => {
  if (featureInterval) clearInterval(featureInterval);
});

function getFeaturesForType(type: string): string[] {
  const featureMap: Record<string, string[]> = {
    DAILY: ["Flexible hourly rates", "Easy in-and-out", "24/7 access"],
    MONTHLY: ["Guaranteed spot", "Unlimited entries", "Discounts on services"],
    RESERVED: ["Dedicated parking", "Priority access", "Valet service available"]
  };
  return featureMap[type] || [];
}

const sortedPricing = computed<Pricing[]>(() => {
  const typeOrder: Record<Pricing['type'], number> = { 'DAILY': 1, 'MONTHLY': 2, 'RESERVED': 3 };
  const vehicleOrder: Record<Pricing['vehicleType'], number> = { 'MOTORBIKE': 1, 'CAR': 2 };
  return [...pricing.value].sort((a, b) => {
    const typeComparison = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
    if (typeComparison !== 0) return typeComparison;
    return (vehicleOrder[a.vehicleType] || 99) - (vehicleOrder[b.vehicleType] || 99);
  });
});

const handleSignIn = async () => {
  const token = memoryStorage.getToken();
  if (token) {
    router.push('/dashboard');
    return;
  }
  try {
    const response = await axios.get("/auth/refresh");
    if (response.status === 200 && response.data.access_token) {
      memoryStorage.setToken(response.data.access_token);
      router.push('/dashboard');
    } else {
      router.push('/sign-in');
    }
  } catch (error) {
    console.error("Refresh token failed:", error);
    router.push('/sign-in');
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        class="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl animate-pulse-slow">
      </div>
      <div
        class="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow delay-2000">
      </div>
    </div>

    <nav
      class="sticky top-0 z-20 flex justify-between items-center p-4 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <RouterLink to="/"
        class="text-2xl font-bold bg-gradient-to-r from-green-500 to-cyan-500 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent">
        The Parking<span class="text-gray-900 dark:text-white">Hub</span>
      </RouterLink>
      <div class="flex gap-2 md:gap-4">
        <Button label="Sign In"
          class="p-button-themed rounded-lg text-sm md:text-base bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 md:px-6 md:py-3 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white transition-colors duration-300"
          @click="handleSignIn()" />
        <RouterLink to="/sign-up">
          <Button label="Get Started"
            class="p-button-themed rounded-lg text-sm md:text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-2 md:px-6 md:py-3 border-none shadow-lg text-white" />
        </RouterLink>
      </div>
    </nav>

    <header id="about" class="relative z-10 text-center py-16 md:py-24 px-4 max-w-6xl mx-auto">
      <h1
        class="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 dark:from-green-400 dark:to-cyan-400 bg-clip-text text-transparent mb-6 leading-tight">
        Smart Parking Solutions
      </h1>
      <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Effortless, secure, and tech-driven parking experiences designed for you.
      </p>
    </header>

    <section id="features" class="relative z-10 max-w-5xl mx-auto px-4 mb-16 md:mb-24">
      <div
        class="bg-white/70 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-xl transition-colors duration-300">
        <h2 class="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Why Choose Us?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div v-for="(feature, index) in features" :key="index" @mouseenter="activeFeature = index"
            class="p-6 rounded-lg transition-all duration-300 cursor-pointer border" :class="{
              'bg-green-50/80 dark:bg-gray-700/50 border-green-300 dark:border-green-500/40 ring-1 ring-green-300/50 dark:ring-green-500/30 shadow-md': activeFeature === index,
              'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50': activeFeature !== index
            }">
            <div class="text-4xl mb-4">{{ feature.icon }}</div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{{ feature.title }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="pricing" class="relative z-10 max-w-6xl mx-auto px-4 mb-16 md:mb-24">
      <div
        class="bg-white/70 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-xl transition-colors duration-300">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Transparent Pricing</h2>
          <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Simple, flexible plans tailored to your parking needs.
          </p>
        </div>

        <DataTable :value="sortedPricing" :loading="loading" class="p-datatable-themed" :row-hover="false">
          <Column field="type" header="Plan Type" headerClass="table-header" bodyClass="table-cell">
            <template #body="{ data }">
              <div class="flex items-center font-bold">
                <span class="px-3 py-1 rounded-full text-sm font-medium" :class="{
                  'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300': data.type === 'DAILY',
                  'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300': data.type === 'MONTHLY',
                  'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300': data.type === 'RESERVED'
                }">
                  {{ data.type }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="vehicleType" header="Vehicle Type" headerClass="table-header" bodyClass="table-cell">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <span class="text-2xl">
                  {{ data.vehicleType === 'MOTORBIKE' ? '🛵' : '🚗' }}
                </span>
                <span class="capitalize text-gray-800 dark:text-white font-medium">
                  {{ data.vehicleType.toLowerCase() }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="price" header="Price" headerClass="table-header" bodyClass="table-cell">
            <template #body="{ data }">
              <span class="font-bold text-lg md:text-xl text-gray-800 dark:text-white">
                {{ new Intl.NumberFormat('vi-VN').format(data.price) }} <span
                  class="text-sm text-gray-500 dark:text-gray-400">VND</span>
              </span>
              <span v-if="data.type === 'DAILY'" class="block text-xs text-gray-500 dark:text-gray-400">/ Day</span>
              <span v-else-if="data.type === 'MONTHLY'" class="block text-xs text-gray-500 dark:text-gray-400">/
                Month</span>
              <span v-else-if="data.type === 'RESERVED'" class="block text-xs text-gray-500 dark:text-gray-400">/
                Month</span>
            </template>
          </Column>

          <template #loading>
            <div class="flex items-center justify-center p-8">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--text-color-secondary)"></i>
              <span class="ml-2" :style="{ color: 'var(--text-color-secondary)' }">Loading pricing...</span>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-8" :style="{ color: 'var(--text-color-secondary)' }">
              No pricing information available at the moment.
            </div>
          </template>
        </DataTable>

      </div>
    </section>

    <footer
      class="relative z-10 py-8 md:py-12 bg-gray-100 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <div class="flex justify-center gap-6 md:gap-8 mb-6 md:mb-8">
          <a href="#about"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">About</a>
          <a href="#features"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">Features</a>
          <a href="#pricing"
            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">Pricing</a>
        </div>
        <p class="text-gray-500 dark:text-gray-500 text-sm">
          © {{ new Date().getFullYear() }} Parking Hub. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
:root {
  --text-color: #1f2937;
  --text-color-secondary: #6b7280;
  --surface-ground: #f9fafb;
  --surface-card: #ffffff;
  --surface-border: #e5e7eb;
  --surface-header: #f3f4f6;
  --surface-row: #ffffff;
  --primary-color: #10b981;
}

html.dark {
  --text-color: #f3f4f6;
  --text-color-secondary: #9ca3af;
  --surface-ground: #111827;
  --surface-card: #1f2937;
  --surface-border: #374151;
  --surface-header: #111827;
  --surface-row: #1f2937;
  --primary-color: #34d399;
}

.p-button-themed {
  transition: all 0.2s ease-in-out !important;
}

.p-button-themed:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

html.dark .p-button-themed:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

:deep(.p-datatable-themed) {
  border-radius: 0.5rem;
  overflow: hidden;
  border: none;
}

:deep(.p-datatable-thead > tr > th.table-header) {
  background-color: var(--surface-header);
  color: var(--text-color-secondary);
  border-bottom: 1px solid var(--surface-border);
  border-top: none;
  border-left: none;
  border-right: none;
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

:deep(.p-datatable-tbody > tr) {
  background-color: var(--surface-row);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

:deep(.p-datatable-tbody > tr > td.table-cell) {
  border: none;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  transition: border-color 0.3s;
}

:deep(.p-datatable .p-datatable-loading-overlay),
:deep(.p-datatable .p-datatable-emptymessage) {
  background-color: rgba(255, 255, 255, 0);
}

:deep(.p-datatable .p-datatable-loading-icon),
:deep(.p-datatable .p-datatable-emptymessage td) {
  color: var(--text-color-secondary);
}

@keyframes pulse-slow {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-2000 {
  animation-delay: 2s;
}
</style>
