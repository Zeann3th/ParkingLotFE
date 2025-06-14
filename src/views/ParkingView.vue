<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import type { CheckIn as OriginalCheckIn, CheckOut as OriginalCheckOut } from '@/types';
import { parkingService } from '@/services/parking.service';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const props = defineProps({
  sectionId: {
    type: Number,
    required: true,
    validator: (value: number) => value > 0
  }
});

type CheckInFormState = { ticketId: string; plate: string; type: string };
type CheckOutFormState = { ticketId: string; plate: string };

const checkIn = ref<CheckInFormState>({ ticketId: '', plate: '', type: '' });
const checkOut = ref<CheckOutFormState>({ ticketId: '', plate: '' });

const validateCheckIn = () => {
  const ticketIdNum = Number(checkIn.value.ticketId);

  if (!checkIn.value.ticketId || ticketIdNum <= 0 ||
      !checkIn.value.plate.trim() || !checkIn.value.type.trim()) {
    toast.error('Ticket ID, License Plate, and Vehicle Type are required and must be valid.');
    return false;
  }
  return true;
}

const validateCheckOut = () => {
  const ticketIdNum = Number(checkOut.value.ticketId);

  if (!checkOut.value.ticketId || ticketIdNum <= 0 ||
      !checkOut.value.plate.trim()) {
    toast.error('Ticket ID and License Plate are required and must be valid.');
    return false;
  }
  return true;
}

const handleCheckIn = async (event: Event) => {
  event.preventDefault();
  if (!validateCheckIn()) return;
  try {
    const payload: OriginalCheckIn = {
      sectionId: props.sectionId,
      ticketId: Number(checkIn.value.ticketId),
      plate: checkIn.value.plate.toUpperCase(),
      type: checkIn.value.type.toUpperCase()
    };
    await parkingService.checkIn(payload);
    toast.success(`Check-in successful for section ${props.sectionId}.`);
    checkIn.value = { ticketId: '', plate: '', type: '' };
  } catch (error: any) {
    const detail = error?.message || error || 'Failed to check in due to a server error.';
    toast.error(detail);
  }
};

const handleCheckOut = async (event: Event) => {
  event.preventDefault();
  if (!validateCheckOut()) return;
  try {
    const payload: OriginalCheckOut = {
      sectionId: props.sectionId,
      ticketId: Number(checkOut.value.ticketId),
      plate: checkOut.value.plate.toUpperCase()
    };
    const response = await parkingService.checkOut(payload);
    const feeFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(response.fee);
    toast.success(`Check-out successful for section ${props.sectionId}. Fee: ${feeFormatted}`);
    checkOut.value = { ticketId: '', plate: '' };
  } catch (error: any) {
    const detail = error?.message || error || 'Failed to check out due to a server error.';
    toast.error(detail);
  }
};

const vehicleTypes = [
  { value: 'CAR', label: '🚗 Car' },
  { value: 'MOTORBIKE', label: '🏍️ Motorbike' }
];
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-white">
      <!-- Header Section -->
      <header class="max-w-4xl mx-auto px-6 py-16 text-center">
        <div class="space-y-8">
          <Badge variant="secondary" class="px-4 py-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            Section {{ sectionId }}
          </Badge>

          <h1 class="text-5xl md:text-6xl font-light text-gray-900 leading-tight">
            Vehicle
            <span class="font-medium bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Management</span>
          </h1>
        </div>
      </header>

      <!-- Main Content -->
      <section class="max-w-5xl mx-auto px-6 pb-20">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <!-- Check In Card -->
          <Card class="group hover:shadow-lg transition-all duration-300 border-blue-100">
            <CardHeader class="pb-6">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200">
                  <span class="text-green-600 text-xl">🚗</span>
                </div>
                <div>
                  <CardTitle class="text-xl font-medium text-gray-900">Check In</CardTitle>
                  <CardDescription class="text-gray-600">Register vehicle entry</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form @submit="handleCheckIn" class="space-y-6">
                <!-- Ticket ID -->
                <div class="space-y-2">
                  <Label for="checkin-ticket" class="text-sm font-medium text-gray-700">
                    Ticket ID
                  </Label>
                  <Input
                      id="checkin-ticket"
                      type="number"
                      v-model="checkIn.ticketId"
                      placeholder="Enter ticket ID"
                      required
                      min="1"
                      class="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>

                <!-- License Plate -->
                <div class="space-y-2">
                  <Label for="checkin-plate" class="text-sm font-medium text-gray-700">
                    License Plate
                  </Label>
                  <Input
                      id="checkin-plate"
                      type="text"
                      v-model="checkIn.plate"
                      placeholder="Enter vehicle plate"
                      required
                      @input="checkIn.plate = checkIn.plate.toUpperCase()"
                      class="border-gray-200 focus:border-blue-300 focus:ring-blue-200 uppercase"
                  />
                </div>

                <!-- Vehicle Type -->
                <div class="space-y-2">
                  <Label for="checkin-type" class="text-sm font-medium text-gray-700">
                    Vehicle Type
                  </Label>
                  <Select v-model="checkIn.type">
                    <SelectTrigger class="border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                          v-for="vType in vehicleTypes"
                          :key="vType.value"
                          :value="vType.value"
                      >
                        {{ vType.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                    type="submit"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                >
                  Check In Vehicle
                </Button>
              </form>
            </CardContent>
          </Card>

          <!-- Check Out Card -->
          <Card class="group hover:shadow-lg transition-all duration-300 border-blue-100">
            <CardHeader class="pb-6">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors duration-200">
                  <span class="text-red-600 text-xl">🚙</span>
                </div>
                <div>
                  <CardTitle class="text-xl font-medium text-gray-900">Check Out</CardTitle>
                  <CardDescription class="text-gray-600">Process vehicle exit</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form @submit="handleCheckOut" class="space-y-6">
                <!-- Ticket ID -->
                <div class="space-y-2">
                  <Label for="checkout-ticket" class="text-sm font-medium text-gray-700">
                    Ticket ID
                  </Label>
                  <Input
                      id="checkout-ticket"
                      type="number"
                      v-model="checkOut.ticketId"
                      placeholder="Enter ticket ID"
                      required
                      min="1"
                      class="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>

                <!-- License Plate -->
                <div class="space-y-2">
                  <Label for="checkout-plate" class="text-sm font-medium text-gray-700">
                    License Plate
                  </Label>
                  <Input
                      id="checkout-plate"
                      type="text"
                      v-model="checkOut.plate"
                      placeholder="Enter vehicle plate"
                      required
                      @input="checkOut.plate = checkOut.plate.toUpperCase()"
                      class="border-gray-200 focus:border-blue-300 focus:ring-blue-200 uppercase"
                  />
                </div>

                <!-- Spacer to align with check-in form -->
                <div class="h-16"></div>

                <Button
                    type="submit"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                >
                  Check Out Vehicle
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  </MenuLayout>
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

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

.group:hover .group-hover\:bg-green-100 {
  background-color: #dcfce7;
}

.group:hover .group-hover\:bg-red-100 {
  background-color: #fee2e2;
}
</style>