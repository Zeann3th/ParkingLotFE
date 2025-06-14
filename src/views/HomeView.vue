<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import axios from 'axios';
import { toast } from 'vue-sonner';
import { memoryStorage } from '@/storage';
import router from '@/router';
import { RouterLink } from 'vue-router';
import type { Pricing } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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
    toast.error("Failed to load pricing data");
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

const getBadgeVariant = (type: string) => {
  switch (type) {
    case 'DAILY': return 'default';
    case 'MONTHLY': return 'secondary';
    case 'RESERVED': return 'outline';
    default: return 'default';
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
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-200 shadow-lg">
              <span class="text-white font-medium text-sm">P</span>
            </div>
            <span class="text-xl font-medium text-gray-900">Parking Hub</span>
          </RouterLink>

          <div class="flex items-center space-x-4">
            <Button variant="ghost" @click="handleSignIn()" class="hover:text-blue-600 hover:bg-blue-50">
              Sign In
            </Button>
            <RouterLink to="/sign-up">
              <Button class="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                Get Started
              </Button>
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <header id="about" class="max-w-4xl mx-auto px-6 py-24 text-center">
      <div class="space-y-8">
        <Badge variant="secondary" class="px-4 py-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          Simple. Smart. Secure.
        </Badge>

        <h1 class="text-5xl md:text-6xl font-light text-gray-900 leading-tight">
          Parking
          <span class="font-medium bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Simplified</span>
        </h1>

        <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Find, reserve, and pay for parking spaces with ease.
          No hassle, no stress—just simple parking solutions.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button size="lg" class="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
            Start Parking
          </Button>
          <Button variant="ghost" size="lg" class="px-8 hover:text-blue-600 hover:bg-blue-50">
            Learn More
          </Button>
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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card
            v-for="(feature, index) in features"
            :key="index"
            @mouseenter="activeFeature = index"
            class="text-center group cursor-pointer border-none shadow-none hover:shadow-lg transition-all duration-300 hover:border-blue-100"
            :class="{ 
              'opacity-100 scale-105 shadow-xl border-blue-200 bg-gradient-to-b from-blue-50/50 to-white': activeFeature === index, 
              'opacity-70 hover:opacity-100': activeFeature !== index 
            }">

          <CardHeader class="pb-4">
            <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300"
                 :class="{ 'transform scale-110': activeFeature === index }">
              {{ feature.icon }}
            </div>
            <CardTitle class="text-xl font-medium"
                       :class="activeFeature === index ? 'text-blue-700' : 'text-gray-900'">
              {{ feature.title }}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CardDescription class="text-gray-600 leading-relaxed">
              {{ feature.description }}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="bg-gradient-to-b from-gray-50 to-blue-50/30 py-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-light text-gray-900 mb-4">Simple Pricing</h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Transparent rates with no hidden fees
          </p>
        </div>

        <Card class="overflow-hidden border-blue-100 shadow-xl">
          <CardContent class="p-0">
            <Table v-if="!loading">
              <TableHeader class="bg-gradient-to-r from-blue-50 to-blue-100/50">
                <TableRow>
                  <TableHead class="font-medium text-blue-800">Plan</TableHead>
                  <TableHead class="font-medium text-blue-800">Vehicle</TableHead>
                  <TableHead class="text-right font-medium text-blue-800">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in sortedPricing" :key="`${item.type}-${item.vehicleType}`"
                          class="hover:bg-blue-50/30 transition-colors duration-200">
                  <TableCell>
                    <Badge :variant="getBadgeVariant(item.type)"
                           :class="{
                             'bg-blue-100 text-blue-700 hover:bg-blue-200': item.type === 'DAILY',
                             'bg-blue-50 text-blue-600 hover:bg-blue-100': item.type === 'MONTHLY',
                             'border-blue-300 text-blue-700 hover:bg-blue-50': item.type === 'RESERVED'
                           }">
                      {{ item.type }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center space-x-3">
                      <span class="text-2xl">
                        {{ item.vehicleType === 'MOTORBIKE' ? '🏍️' : '🚗' }}
                      </span>
                      <span class="text-gray-900 font-medium capitalize">
                        {{ item.vehicleType.toLowerCase() }}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <div>
                      <div class="text-2xl font-light text-blue-700">
                        {{ new Intl.NumberFormat('vi-VN').format(item.price) }}
                        <span class="text-sm text-gray-500 font-normal">VND</span>
                      </div>
                      <div class="text-sm text-blue-600/70">
                        <span v-if="item.type === 'DAILY'">per hour</span>
                        <span v-else-if="item.type === 'MONTHLY'">per month</span>
                        <span v-else-if="item.type === 'RESERVED'">per month</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <!-- Loading Skeletons -->
            <div v-else class="p-6 space-y-4">
              <div class="flex justify-between items-center border-b pb-2">
                <Skeleton class="h-4 w-16" />
                <Skeleton class="h-4 w-20" />
                <Skeleton class="h-4 w-24" />
              </div>
              <div v-for="i in 6" :key="i" class="flex justify-between items-center py-3">
                <Skeleton class="h-6 w-20" />
                <div class="flex items-center space-x-3">
                  <Skeleton class="h-8 w-8 rounded" />
                  <Skeleton class="h-4 w-16" />
                </div>
                <div class="text-right">
                  <Skeleton class="h-6 w-24 mb-1" />
                  <Skeleton class="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-100 py-12">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-3 mb-4 md:mb-0">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <span class="text-white font-medium text-sm">P</span>
            </div>
            <span class="text-lg font-medium text-gray-900">Parking Hub</span>
          </div>

          <div class="flex space-x-8 mb-4 md:mb-0">
            <a href="#about" class="text-gray-600 hover:text-blue-600 transition-colors duration-200">About</a>
            <a href="#features" class="text-gray-600 hover:text-blue-600 transition-colors duration-200">Features</a>
            <a href="#pricing" class="text-gray-600 hover:text-blue-600 transition-colors duration-200">Pricing</a>
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

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>