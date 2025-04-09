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
  features: string[];
}

const toast = useToast();
const pricing = ref<Pricing[]>([]);
const loading = ref<boolean>(true);
const activeFeature = ref<number>(0);

const features = [
  {
    title: "Smart Parking",
    description: "AI-powered parking space detection for optimal vehicle placement",
    icon: "🤖"
  },
  {
    title: "24/7 Security",
    description: "Round-the-clock surveillance and security personnel",
    icon: "👮"
  },
  {
    title: "Support Contactless Payment",
    description: "Secure digital payments with multiple options",
    icon: "💳"
  }
];

onMounted(async () => {
  try {
    const response = await axios.get<Pricing[]>('/tickets/pricing');
    pricing.value = response.data.map(item => ({
      ...item,
      features: getFeaturesForType(item.type)
    }));
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pricing data', life: 3000 });
  } finally {
    loading.value = false;
    // Auto-rotate features
    setInterval(() => {
      activeFeature.value = (activeFeature.value + 1) % features.length;
    }, 5000);
  }
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
    return typeComparison !== 0 ? typeComparison : (vehicleOrder[a.vehicleType] || 99) - (vehicleOrder[b.vehicleType] || 99);
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
    }
  } catch (error) {
    router.push('/sign-in');
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100">
    <!-- Floating background elements -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Navigation -->
    <nav
      class="relative z-10 flex justify-between items-center p-6 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700">
      <RouterLink to="/"
        class="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
        The Parking<span class="text-white">Hub</span>
      </RouterLink>
      <div class="flex gap-4">
        <Button label="Sign In"
          class="rounded-lg bg-gray-700 hover:bg-gray-600 px-6 py-3 border border-gray-600 text-white"
          @click="handleSignIn()" />
        <RouterLink to="/sign-up">
          <Button label="Get Started"
            class="rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-3 border-none shadow-lg text-white" />
        </RouterLink>
      </div>
    </nav>

    <!-- Hero Section -->
    <header id="about" class="relative z-10 text-center py-24 px-4 max-w-6xl mx-auto">
      <h1
        class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-6">
        Smart Parking Solutions
      </h1>
    </header>

    <!-- Features Carousel -->
    <section id="features" class="relative z-10 max-w-5xl mx-auto px-4 mb-24">
      <div class="bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 p-8 shadow-xl">
        <h2 class="text-3xl font-bold text-center mb-8 text-white">Why Choose Us?</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(feature, index) in features" :key="index" @mouseenter="activeFeature = index"
            class="p-6 rounded-lg transition-all duration-300 cursor-pointer" :class="{
              'bg-gray-700/50 border border-green-500/30': activeFeature === index,
              'bg-gray-700/30 border border-gray-700 hover:border-gray-600': activeFeature !== index
            }">
            <div class="text-4xl mb-4">{{ feature.icon }}</div>
            <h3 class="text-xl font-semibold mb-2 text-white">{{ feature.title }}</h3>
            <p class="text-gray-400">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="relative z-10 max-w-6xl mx-auto px-4 mb-24">
      <div class="bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 p-8 shadow-xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-4 text-white">Transparent Pricing</h2>
          <p class="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple, flexible plans tailored to your parking needs
          </p>
        </div>

        <DataTable :value="sortedPricing" :loading="loading" class="border-none" :row-hover="false">
          <Column field="type" header="Plan Type">
            <template #body="{ data }">
              <div class="flex items-center font-bold gap-3">
                <span class="px-3 py-1 rounded-full text-sm font-medium" :class="{
                  'bg-green-500/20 text-green-400': data.type === 'DAILY',
                  'bg-cyan-500/20 text-cyan-400': data.type === 'MONTHLY',
                  'bg-purple-500/20 text-purple-400': data.type === 'RESERVED'
                }">
                  {{ data.type }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="vehicleType" header="Vehicle Type">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <span class="text-2xl">
                  {{ data.vehicleType === 'MOTORBIKE' ? '🛵' : '🚗' }}
                </span>
                <span class="capitalize text-white font-bold">
                  {{ data.vehicleType.toLowerCase() }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="price" header="Price">
            <template #body="{ data }">
              <span class="font-bold text-xl text-white">
                {{ new Intl.NumberFormat('en-US').format(data.price) + " VND" }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 py-12 bg-gray-800/80 backdrop-blur-lg border-t border-gray-700">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <div class="flex justify-center gap-8 mb-8">
          <a href="#about" class="text-gray-400 hover:text-white transition">About</a>
          <a href="#features" class="text-gray-400 hover:text-white transition">Features</a>
          <a href="#pricing" class="text-gray-400 hover:text-white transition">Pricing</a>
        </div>
        <p class="text-gray-500 text-sm">
          &copy; 2025 Parking Hub. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
.p-button {
  transition: all 0.3s ease !important;
}

.p-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
