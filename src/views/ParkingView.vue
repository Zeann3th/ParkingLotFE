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
        <div class="card-themed flex flex-col animate-fade-in delay-200">
          <div class="card-header-themed">
            <div class="icon-circle bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
              <i class="pi pi-arrow-down text-lg font-bold"></i>
            </div>
            <h2 class="card-title-themed text-green-600 dark:text-green-400">Check In</h2>
          </div>
          <form class="p-6 sm:p-8 flex-1 flex flex-col" @submit="handleCheckIn">
            <div class="space-y-6 flex-1">
              <div class="mb-6">
                <label class="label-themed">Section ID</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-map-marker"></i></span>
                  <input type="number" v-model="checkIn.sectionId" class="input-themed" placeholder="Enter section ID"
                    required />
                </div>
              </div>
              <div class="mb-6">
                <label class="label-themed">Ticket ID</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-ticket"></i></span>
                  <input type="number" v-model="checkIn.ticketId" class="input-themed" placeholder="Enter ticket ID"
                    required />
                </div>
              </div>
              <div class="mb-6">
                <label class="label-themed">License Plate</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-car"></i></span>
                  <input type="text" v-model="checkIn.plate" class="input-themed" placeholder="Enter vehicle plate"
                    required />
                </div>
              </div>
              <div class="mb-6">
                <label class="label-themed">Vehicle Type</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-truck"></i></span>
                  <input type="text" v-model="checkIn.type" class="input-themed" placeholder="e.g., CAR, MOTORBIKE"
                    required />
                </div>
              </div>
            </div>
            <button type="submit" class="button-themed-primary w-full mt-6">
              <i class="pi pi-sign-in mr-2"></i> Check In
            </button>
          </form>
        </div>

        <div class="card-themed flex flex-col animate-fade-in delay-400">
          <div class="card-header-themed">
            <div class="icon-circle bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <i class="pi pi-arrow-up text-lg font-bold"></i>
            </div>
            <h2 class="card-title-themed text-red-600 dark:text-red-400">Check Out</h2>
          </div>
          <form class="p-6 sm:p-8 flex-1 flex flex-col" @submit="handleCheckOut">
            <div class="space-y-6 flex-1">
              <div class="mb-6">
                <label class="label-themed">Section ID</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-map-marker"></i></span>
                  <input type="number" v-model="checkOut.sectionId" class="input-themed" placeholder="Enter section ID"
                    required />
                </div>
              </div>
              <div class="mb-6">
                <label class="label-themed">Ticket ID</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-ticket"></i></span>
                  <input type="number" v-model="checkOut.ticketId" class="input-themed" placeholder="Enter ticket ID"
                    required />
                </div>
              </div>
              <div class="mb-6">
                <label class="label-themed">License Plate</label>
                <div class="relative">
                  <span class="input-icon"><i class="pi pi-car"></i></span>
                  <input type="text" v-model="checkOut.plate" class="input-themed" placeholder="Enter vehicle plate"
                    required />
                </div>
              </div>
            </div>
            <button type="submit" class="button-themed-danger w-full mt-6">
              <i class="pi pi-sign-out mr-2"></i> Check Out
            </button>
          </form>
        </div>

      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
:root {
  --text-color: #1f2937;
  --text-color-secondary: #6b7280;
  --surface-ground: #f3f4f6;
  --surface-card: #ffffff;
  --surface-section: #f9fafb;
  --surface-input: #ffffff;
  --surface-border: #d1d5db;
  --surface-border-hover: #9ca3af;
  --surface-focus-border: var(--primary-color);
  --surface-hover: #f3f4f6;
  --focus-ring-color: #16a34a;
  --primary-color: #16a34a;
  --primary-color-hover: #15803d;
  --primary-gradient-from: #10b981;
  --primary-gradient-to: #059669;
  --button-primary-text: #1f2937;
  --danger-color: #dc2626;
  --danger-color-hover: #b91c1c;
  --danger-gradient-from: #ef4444;
  --danger-gradient-to: #dc2626;
  --button-danger-text: #1f2937;

  --shadow-light: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-light-hover: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  --toast-bg: rgba(255, 255, 255, 0.95);
  --toast-border: rgba(229, 231, 235, 0.8);
  --toast-text: #374151;
  --toast-success-border: #10b981;
  --toast-warn-border: #f59e0b;
  --toast-error-border: #ef4444;
}

html.dark {
  --text-color: #f3f4f6;
  --text-color-secondary: #9ca3af;
  --surface-ground: #111827;
  --surface-card: #1f2937;
  --surface-section: #1f2937;
  --surface-input: #374151;
  --surface-border: #4b5563;
  --surface-border-hover: #6b7280;
  --surface-focus-border: var(--focus-ring-color);
  --surface-hover: #374151;
  --focus-ring-color: #34d399;
  --primary-color: #34d399;
  --primary-color-hover: #10b981;
  --primary-gradient-from: #10b981;
  --primary-gradient-to: #34d399;
  --button-primary-text: #ffffff;
  --danger-color: #f87171;
  --danger-color-hover: #ef4444;
  --danger-gradient-from: #f87171;
  --danger-gradient-to: #ef4444;
  --button-danger-text: #ffffff;

  --shadow-light: 0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.15);
  --shadow-light-hover: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2);


  --toast-bg: rgba(31, 41, 55, 0.95);
  --toast-border: rgba(55, 65, 81, 0.8);
  --toast-text: #f3f4f6;
  --toast-success-border: #34d399;
  --toast-warn-border: #fbbf24;
  --toast-error-border: #f87171;
}

.card-themed {
  background-color: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  box-shadow: var(--shadow-light);
  overflow: hidden;
  transition: all 0.3s ease-out;
}

.card-themed:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-light-hover);
  border-color: var(--surface-border-hover);
}

/* Card Header */
.card-header-themed {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background-color: var(--surface-section);
  border-bottom: 1px solid var(--surface-border);
  transition: background-color 0.3s, border-color 0.3s;
}

html.dark .card-header-themed {
  background-color: var(--surface-card);
  border-bottom-color: var(--surface-border);
}

.icon-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  transition: background-color 0.3s, color 0.3s;
}

.card-title-themed {
  font-size: 1.5rem;
  font-weight: 600;
  transition: color 0.3s;
}

.form-fields-container {
  margin-bottom: 0;
}

.label-themed {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  transition: color 0.3s;
}

.input-themed {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.75rem;
  color: var(--text-color);
  background-color: var(--surface-input);
  border: 1px solid var(--surface-border);
  border-radius: 0.375rem;
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out, background-color 0.3s, color 0.3s;
  appearance: textfield;
}

.input-themed::-webkit-outer-spin-button,
.input-themed::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
  pointer-events: none;
}


.input-themed::placeholder {
  color: var(--text-color-secondary);
  opacity: 0.7;
}

.input-themed:focus {
  outline: none;
  border-color: var(--surface-focus-border);
  box-shadow: 0 0 0 2px var(--focus-ring-color);
}

.button-themed-primary,
.button-themed-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-weight: 600;
  padding: 0.875rem 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  border: none;
  color: var(--button-primary-text);
}

.button-themed-danger {
  color: var(--button-danger-text);
}

.button-themed-primary:hover,
.button-themed-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  filter: brightness(1.05);
}

.button-themed-primary:active,
.button-themed-danger:active {
  transform: translateY(0px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  filter: brightness(1);
}

.button-themed-primary {
  background-image: linear-gradient(to right, var(--primary-gradient-from), var(--primary-gradient-to));
}

.button-themed-danger {
  background-image: linear-gradient(to right, var(--danger-gradient-from), var(--danger-gradient-to));
}

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

:deep(.p-toast) {
  opacity: 0.98;
}

:deep(.p-toast .p-toast-message) {
  background-color: var(--toast-bg);
  border: 1px solid var(--toast-border);
  color: var(--toast-text);
  border-width: 0 0 0 6px;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

:deep(.p-toast .p-toast-message-content) {
  align-items: center;
}

:deep(.p-toast .p-toast-summary) {
  font-weight: 600;
}

:deep(.p-toast .p-toast-detail) {
  margin-top: 0.25rem;
  opacity: 0.9;
}

:deep(.p-toast .p-toast-message-success) {
  border-left-color: var(--primary-color);
}

:deep(.p-toast .p-toast-message-success .p-toast-message-icon) {
  color: var(--primary-color);
}

:deep(.p-toast .p-toast-message-info) {
  border-left-color: #3b82f6;
}

:deep(.p-toast .p-toast-message-info .p-toast-message-icon) {
  color: #3b82f6;
}

:deep(.p-toast .p-toast-message-warn) {
  border-left-color: #f59e0b;
}

:deep(.p-toast .p-toast-message-warn .p-toast-message-icon) {
  color: #f59e0b;
}

:deep(.p-toast .p-toast-message-error) {
  border-left-color: var(--danger-color);
}

:deep(.p-toast .p-toast-message-error .p-toast-message-icon) {
  color: var(--danger-color);
}

:deep(.p-toast .p-toast-icon-close) {
  color: var(--text-color-secondary);
  transition: color 0.2s;
}

:deep(.p-toast .p-toast-icon-close:hover) {
  color: var(--text-color);
}
</style>
