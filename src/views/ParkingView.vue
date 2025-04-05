<script setup lang="ts">
import axios from 'axios';
import { useToast } from 'primevue';
import { ref } from 'vue';
import { memoryStorage } from '@/storage';
import MenuLayout from '@/components/MenuLayout.vue';

const toast = useToast();

type CheckIn = {
  sectionId: number;
  ticketId: number;
  plate: string;
  type: string;
};

type CheckOut = {
  sectionId: number;
  ticketId: number;
  plate: string;
};

const checkIn = ref<CheckIn>({ sectionId: 0, ticketId: 0, plate: '', type: '' });
const checkOut = ref<CheckOut>({ sectionId: 0, ticketId: 0, plate: '' });

const handleCheckIn = async (event: Event) => {
  event.preventDefault();
  if (!checkIn.value.sectionId || !checkIn.value.ticketId || !checkIn.value.plate.trim() || !checkIn.value.type.trim()) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'All fields are required', life: 3000 });
    return;
  }
  try {
    const response = await axios.post("parking/check-in", checkIn.value, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });
    const { status, data } = response;
    if (status === 201) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Check-in successful', life: 3000 });
      checkOut.value = {
        sectionId: checkIn.value.sectionId,
        ticketId: checkIn.value.ticketId,
        plate: checkIn.value.plate
      };
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: data.message, life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in', life: 3000 });
  } finally {
    checkIn.value = { sectionId: 0, ticketId: 0, plate: '', type: '' };
  }
};

const handleCheckOut = async (event: Event) => {
  event.preventDefault();
  if (!checkOut.value.sectionId || !checkOut.value.ticketId || !checkOut.value.plate.trim()) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'All fields are required', life: 3000 });
    return;
  }
  try {
    const response = await axios.post("parking/check-out", checkOut.value, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });
    const { status, data } = response;
    if (status === 200) {
      toast.add({ severity: 'success', summary: 'Success', detail: `Check-out successful, fee: ${data.fee} VND`, life: 8000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: data.message, life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check out', life: 3000 });
  } finally {
    checkOut.value = { sectionId: 0, ticketId: 0, plate: '' };
  }
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen flex items-center justify-center bg-gray-900 p-8 animate-fade-in">
      <div class="w-full max-w-6xl mx-auto flex flex-wrap gap-10 justify-center mb-10">
        <!-- Check In Card -->
        <div
          class="bg-gray-800 bg-opacity-80 rounded-2xl shadow-lg w-full max-w-md overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition duration-300 animate-fade-in delay-200 backdrop-blur-sm border border-gray-700">
          <div class="bg-gray-700 px-8 py-6 flex items-center gap-4 border-b border-gray-600">
            <div class="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md">
              <span class="text-lg font-bold">↓</span>
            </div>
            <h2 class="text-2xl font-semibold text-green-400">Check In</h2>
          </div>
          <form class="p-8" @submit="handleCheckIn">
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">Section ID</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">§</span>
                <input type="number" v-model="checkIn.sectionId"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter section ID" required />
              </div>
            </div>
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">Ticket ID</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">#</span>
                <input type="number" v-model="checkIn.ticketId"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter ticket ID" required />
              </div>
            </div>
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">License Plate</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">🚗</span>
                <input type="text" v-model="checkIn.plate"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter vehicle plate" required />
              </div>
            </div>
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">Vehicle Type</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">🚙</span>
                <input type="text" v-model="checkIn.type"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter vehicle type" required />
              </div>
            </div>
            <button type="submit"
              class="w-full bg-gradient-to-r from-green-600 to-green-800 text-white font-semibold py-3 rounded-md shadow-md hover:from-green-700 hover:to-green-900 hover:-translate-y-1 transition">Check
              In</button>
          </form>
        </div>

        <!-- Check Out Card -->
        <div
          class="bg-gray-800 bg-opacity-80 rounded-2xl shadow-lg w-full max-w-md overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition duration-300 animate-fade-in delay-400 backdrop-blur-sm border border-gray-700">
          <div class="bg-gray-700 px-8 py-6 flex items-center gap-4 border-b border-gray-600">
            <div class="bg-green-800 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md">
              <span class="text-lg font-bold">↑</span>
            </div>
            <h2 class="text-2xl font-semibold text-green-400">Check Out</h2>
          </div>
          <form class="p-8" @submit="handleCheckOut">
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">Section ID</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">§</span>
                <input type="number" v-model="checkOut.sectionId"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter section ID" required />
              </div>
            </div>
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">Ticket ID</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">#</span>
                <input type="number" v-model="checkOut.ticketId"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter ticket ID" required />
              </div>
            </div>
            <div class="mb-6">
              <label class="block mb-2 font-medium text-gray-300">License Plate</label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400">🚗</span>
                <input type="text" v-model="checkOut.plate"
                  class="pl-10 pr-4 py-3 w-full rounded-md border-2 border-gray-600 bg-gray-700 focus:outline-none focus:border-green-500 focus:ring focus:ring-green-900 text-gray-100 placeholder-gray-400"
                  placeholder="Enter vehicle plate" required />
              </div>
            </div>
            <button type="submit"
              class="w-full bg-gradient-to-r from-green-800 to-green-900 text-white font-semibold py-3 rounded-md shadow-md hover:from-green-900 hover:to-black hover:-translate-y-1 transition">Check
              Out</button>
          </form>
        </div>
      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-fade-in.delay-200 {
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.animate-fade-in.delay-400 {
  animation-delay: 0.4s;
  animation-fill-mode: both;
}

:deep(.p-toast) {
  background-color: rgba(31, 41, 55, 0.9);
  border: 1px solid rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

:deep(.p-toast .p-toast-message-success) {
  background-color: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.3);
}

:deep(.p-toast .p-toast-message-error) {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}
</style>
