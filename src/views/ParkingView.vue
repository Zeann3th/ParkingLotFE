<script setup lang="ts">
import { useToast } from 'primevue';
import { ref } from 'vue';
import MenuLayout from '@/components/MenuLayout.vue';
import type { CheckIn, CheckOut } from '@/types';
import { parkingService } from '@/services/parking.service';

const toast = useToast();

const checkIn = ref<CheckIn>({ sectionId: '', ticketId: '', plate: '', type: '' });
const checkOut = ref<CheckOut>({ sectionId: '', ticketId: '', plate: '' });

const validateCheckIn = () => {
  const sectionIdNum = Number(checkIn.value.sectionId);
  const ticketIdNum = Number(checkIn.value.ticketId);

  if (!checkIn.value.sectionId || sectionIdNum <= 0 ||
    !checkIn.value.ticketId || ticketIdNum <= 0 ||
    !checkIn.value.plate.trim() || !checkIn.value.type.trim()) {
    toast.add({ severity: 'warn', summary: 'Missing Information', detail: 'All Check-In fields are required and must be valid.', life: 3000 });
    return false;
  }
  return true;
}

const validateCheckOut = () => {
  const sectionIdNum = Number(checkOut.value.sectionId);
  const ticketIdNum = Number(checkOut.value.ticketId);

  if (!checkOut.value.sectionId || sectionIdNum <= 0 ||
    !checkOut.value.ticketId || ticketIdNum <= 0 ||
    !checkOut.value.plate.trim()) {
    toast.add({ severity: 'warn', summary: 'Missing Information', detail: 'All Check-Out fields are required and must be valid.', life: 3000 });
    return false;
  }
  return true;
}

const handleCheckIn = async (event: Event) => {
  event.preventDefault();
  if (!validateCheckIn()) return;
  try {
    const response = await parkingService.checkIn({
      sectionId: Number(checkIn.value.sectionId),
      ticketId: Number(checkIn.value.ticketId),
      plate: checkIn.value.plate,
      type: checkIn.value.type
    });
    if (!response.message) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Check-in successful', life: 3000 });
      checkIn.value = { sectionId: '', ticketId: '', plate: '', type: '' };
    } else {
      toast.add({ severity: 'error', summary: 'Check-In Failed', detail: response.message || 'An unknown error occurred.', life: 4000 });
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in due to a server error.', life: 4000 });
  }
};

const handleCheckOut = async (event: Event) => {
  event.preventDefault();
  if (!validateCheckOut()) return;
  try {
    const response = await parkingService.checkOut({
      sectionId: Number(checkOut.value.sectionId),
      ticketId: Number(checkOut.value.ticketId),
      plate: checkOut.value.plate
    });
    if (!response.message) {
      const feeFormatted = new Intl.NumberFormat('vi-VN').format(response.fee || 0);
      toast.add({ severity: 'success', summary: 'Success', detail: `Check-out successful. Fee: ${feeFormatted} VND`, life: 8000 });
      checkOut.value = { sectionId: '', ticketId: '', plate: '' };
    } else {
      toast.add({ severity: 'error', summary: 'Check-Out Failed', detail: response.message || 'An unknown error occurred.', life: 4000 });
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check out due to a server error.', life: 4000 });
  }
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-300">
      <div class="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">

        <!-- Check In Card -->
        <div class="flex flex-col animate-fade-in delay-200">
          <div>
            <div class=" text-green-600 dark:bg-green-500/20 dark:text-green-400">
              <i class="pi pi-arrow-down text-lg font-bold"></i>
            </div>
            <h2 class="text-green-600 dark:text-green-400">Check In</h2>
          </div>
          <form class="p-6 sm:p-8 flex-1 flex flex-col" @submit="handleCheckIn">
            <div class="space-y-6 flex-1">
              <div class="mb-6">
                <label class="">Section ID</label>
                <div class="relative">
                  <span><i class="pi pi-map-marker"></i></span>
                  <input type="number" v-model="checkIn.sectionId" placeholder="Enter section ID" required />
                </div>
              </div>
              <div class="mb-6">
                <label>Ticket ID</label>
                <div class="relative">
                  <span><i class="pi pi-ticket"></i></span>
                  <input type="number" v-model="checkIn.ticketId" placeholder="Enter ticket ID" required />
                </div>
              </div>
              <div class="mb-6">
                <label>License Plate</label>
                <div class="relative">
                  <span><i class="pi pi-car"></i></span>
                  <input type="text" v-model="checkIn.plate" placeholder="Enter vehicle plate" required />
                </div>
              </div>
              <div class="mb-6">
                <label>Vehicle Type</label>
                <div class="relative">
                  <span><i class="pi pi-truck"></i></span>
                  <input type="text" v-model="checkIn.type" placeholder="e.g., CAR, MOTORBIKE" required />
                </div>
              </div>
            </div>
            <button type="submit" class="w-full mt-6">
              <i class="pi pi-sign-in mr-2"></i> Check In
            </button>
          </form>
        </div>

        <div class="flex flex-col animate-fade-in delay-400">
          <div>
            <div class="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <i class="pi pi-arrow-up text-lg font-bold"></i>
            </div>
            <h2 class="text-red-600 dark:text-red-400">Check Out</h2>
          </div>
          <form class="p-6 sm:p-8 flex-1 flex flex-col" @submit="handleCheckOut">
            <div class="space-y-6 flex-1">
              <div class="mb-6">
                <label>Section ID</label>
                <div class="relative">
                  <span><i class="pi pi-map-marker"></i></span>
                  <input type="number" v-model="checkOut.sectionId" placeholder="Enter section ID" required />
                </div>
              </div>
              <div class="mb-6">
                <label>Ticket ID</label>
                <div class="relative">
                  <span><i class="pi pi-ticket"></i></span>
                  <input type="number" v-model="checkOut.ticketId" placeholder="Enter ticket ID" required />
                </div>
              </div>
              <div class="mb-6">
                <label>License Plate</label>
                <div class="relative">
                  <span><i class="pi pi-car"></i></span>
                  <input type="text" v-model="checkOut.plate" placeholder="Enter vehicle plate" required />
                </div>
              </div>
            </div>
            <button type="submit" class="w-full mt-6">
              <i class="pi pi-sign-out mr-2"></i> Check Out
            </button>
          </form>
        </div>

      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-fade-in.delay-200 {
  animation-delay: 0.2s;
}

.animate-fade-in.delay-400 {
  animation-delay: 0.4s;
}
</style>
