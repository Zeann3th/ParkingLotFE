<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
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
    title: "Flexible Booking",
    description: "Reserve your parking space effortlessly, anytime.",
    icon: "⏰"
  },
  {
    title: "Secure Access",
    description: "Advanced security with peace of mind.",
    icon: "🔒"
  },
  {
    title: "Digital Payments",
    description: "Seamless contactless payment experience.",
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
    DAILY: ["Flexible hourly rates", "Quick access", "24/7 availability"],
    MONTHLY: ["Reserved spot", "Unlimited access", "Service discounts"],
    RESERVED: ["Premium location", "Priority access", "Concierge service"]
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
    await router.push('/dashboard');
    return;
  }
  try {
    const response = await axios.get("/auth/refresh", { timeout: 10000 });
    if (response.status === 200 && response.data.access_token) {
      memoryStorage.setToken(response.data.access_token);
      await router.push('/dashboard');
    } else {
      await router.push('/sign-in');
    }
  } catch (error) {
    await router.push('/sign-in');
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex justify-between items-center">
          <RouterLink to="/" class="group flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors duration-200">
              <span class="text-white font-medium text-sm">P</span>
            </div>
            <span class="text-xl font-medium text-gray-900">Parking Hub</span>
          </RouterLink>

          <div class="flex items-center space-x-4">
            <button @click="handleSignIn()"
                    class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200">
              Sign In
            </button>
            <RouterLink to="/sign-up">
              <button class="px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors duration-200">
                Get Started
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <header id="about" class="max-w-4xl mx-auto px-6 py-24 text-center">
      <div class="space-y-8">
        <div class="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full">
          <span class="text-sm text-gray-600 font-medium">Simple. Smart. Secure.</span>
        </div>

        <h1 class="text-5xl md:text-6xl font-light text-gray-900 leading-tight">
          Parking
          <span class="font-medium">Simplified</span>
        </h1>

        <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Find, reserve, and pay for parking spaces with ease.
          No hassle, no stress—just simple parking solutions.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button class="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors duration-200">
            Start Parking
          </button>
          <button class="px-8 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200">
            Learn More
          </button>
        </div>
      </div>
    </header>

    <!-- Features Section -->
    <section id="features" class="max-w-5xl mx-auto px-6 py-20">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-light text-gray-900 mb-4">Why Choose Us</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Three simple reasons to make parking effortless
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div v-for="(feature, index) in features" :key="index"
             @mouseenter="activeFeature = index"
             class="text-center group cursor-pointer"
             :class="{ 'opacity-100': activeFeature === index, 'opacity-70 hover:opacity-100': activeFeature !== index }">

          <div class="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
            {{ feature.icon }}
          </div>

          <h3 class="text-xl font-medium text-gray-900 mb-3">
            {{ feature.title }}
          </h3>

          <p class="text-gray-600 leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="bg-gray-50 py-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-light text-gray-900 mb-4">Simple Pricing</h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Transparent rates with no hidden fees
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable :value="sortedPricing" :loading="loading" class="minimal-table" :row-hover="false">
            <Column field="type" header="Plan" headerClass="minimal-header" bodyClass="minimal-cell">
              <template #body="{ data }">
                <div class="flex items-center">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        :class="{
                      'bg-green-50 text-green-700': data.type === 'DAILY',
                      'bg-blue-50 text-blue-700': data.type === 'MONTHLY',
                      'bg-purple-50 text-purple-700': data.type === 'RESERVED'
                    }">
                    {{ data.type }}
                  </span>
                </div>
              </template>
            </Column>

            <Column field="vehicleType" header="Vehicle" headerClass="minimal-header" bodyClass="minimal-cell">
              <template #body="{ data }">
                <div class="flex items-center space-x-3">
                  <span class="text-2xl">
                    {{ data.vehicleType === 'MOTORBIKE' ? '🏍️' : '🚗' }}
                  </span>
                  <span class="text-gray-900 font-medium capitalize">
                    {{ data.vehicleType.toLowerCase() }}
                  </span>
                </div>
              </template>
            </Column>

            <Column field="price" header="Price" headerClass="minimal-header" bodyClass="minimal-cell">
              <template #body="{ data }">
                <div class="text-right">
                  <div class="text-2xl font-light text-gray-900">
                    {{ new Intl.NumberFormat('vi-VN').format(data.price) }}
                    <span class="text-sm text-gray-500 font-normal">VND</span>
                  </div>
                  <div class="text-sm text-gray-500">
                    <span v-if="data.type === 'DAILY'">per hour</span>
                    <span v-else-if="data.type === 'MONTHLY'">per month</span>
                    <span v-else-if="data.type === 'RESERVED'">per month</span>
                  </div>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-100 py-12">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-3 mb-4 md:mb-0">
            <div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span class="text-white font-medium text-sm">P</span>
            </div>
            <span class="text-lg font-medium text-gray-900">Parking Hub</span>
          </div>

          <div class="flex space-x-8 mb-4 md:mb-0">
            <a href="#about" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">About</a>
            <a href="#features" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">Features</a>
            <a href="#pricing" class="text-gray-600 hover:text-gray-900 transition-colors duration-200">Pricing</a>
          </div>

          <p class="text-sm text-gray-500">
            © {{ new Date().getFullYear() }} Parking Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

* {
  font-family: 'Inter', sans-serif;
}

/* Minimal Table Styles */
:deep(.minimal-table) {
  background: transparent;
  border: none;
}

:deep(.minimal-table .p-datatable-thead > tr > th.minimal-header) {
  background: #f9fafb;
  color: #6b7280;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  text-align: left;
}

:deep(.minimal-table .p-datatable-tbody > tr) {
  background: white;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

:deep(.minimal-table .p-datatable-tbody > tr:hover) {
  background: #f9fafb;
}

:deep(.minimal-table .p-datatable-tbody > tr > td.minimal-cell) {
  border: none;
  padding: 1.5rem;
  color: #111827;
}

/* Loading States */
:deep(.p-datatable .p-datatable-loading-overlay) {
  background: rgba(255, 255, 255, 0.9);
}

:deep(.p-datatable .p-datatable-loading-icon) {
  color: #6b7280;
}

:deep(.p-datatable .p-datatable-emptymessage td) {
  color: #6b7280;
  text-align: center;
  padding: 3rem;
}

/* Smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Subtle animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}
</style>