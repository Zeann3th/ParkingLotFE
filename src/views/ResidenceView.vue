<script setup lang="ts">
import { watch } from 'vue';
import { Dialog, Button, useToast } from 'primevue';
import Skeleton from '@/components/Skeleton.vue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Residence } from '@/types';
import { residenceService } from '@/services/residence.service';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import { useState } from '@/composables/state';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Residence>();
const toast = useToast();
const route = useRoute();

const getAllResidences = async () => {
  isLoading.value = true;
  try {
    const response = await residenceService.getAll(page.value, limit.value, { cache: !isMutated.value && !!route.query.page });
    itemList.value = response.data;
    maxPage.value = response.count;
    isMutated.value = false;
  } catch (error) {
    console.error("Failed to load residences:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load residences', life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query, (newQuery, oldQuery) => {
  const newPage = parseInt(newQuery.page as string) || 1;
  if (newPage !== page.value || oldQuery?.page === undefined) {
    page.value = newPage;
    getAllResidences();
  }
}, { immediate: true });

const getResidenceDetail = async (id: number) => {
  openDialog("view");
  isDetailLoading.value = true;
  selectedItem.value = null;

  try {
    const response = await residenceService.getById(id);
    selectedItem.value = response;
  } catch (error) {
    console.error('Error fetching residence details:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load residence details', life: 3000 });
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const updateResidence = (id: number) => {
  console.log('Navigate to edit residence:', id);
  closeDialog('view');
  toast.add({ severity: 'info', summary: 'Info', detail: 'Edit functionality not yet implemented.', life: 3000 });
};

const createResidence = () => {
  console.log('Navigate to create residence');
  toast.add({ severity: 'info', summary: 'Info', detail: 'Create functionality not yet implemented.', life: 3000 });
};

const refreshData = () => {
  isMutated.value = true;
  getAllResidences();
  toast.add({ severity: 'success', summary: 'Refreshed', detail: 'Residence list updated.', life: 1500 });
}

const getVehicleTypeIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'CAR': return 'pi pi-car';
    case 'MOTORBIKE': return 'pi pi-bolt';
    default: return 'pi pi-question-circle';
  }
};
</script>

<template>
  <MenuLayout>
    <div
      class="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Residences Management" @refresh="refreshData" class="mb-6" />
        <Skeleton v-if="isLoading" type="grid" :count="limit" />
        <div v-else-if="itemList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <!-- Residence Card -->
          <div v-for="residence in itemList" :key="residence.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-primary/30 flex flex-col"
            @click="getResidenceDetail(residence.id)" role="button"
            :aria-label="`View details for Residence ${residence.building}-${residence.room}`">
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 break-all flex-1"
                :title="`Building ${residence.building}, Room ${residence.room}`">
                {{ `Bldg ${residence.building} / Room ${residence.room}` }}
              </h2>
              <!-- Optional: Status Badge can be added here if needed -->
            </div>

            <!-- Card Body Info -->
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div v-if="residence.residents?.length" class="mt-1 text-xs">
                {{ residence.residents.length }} Resident(s)
              </div>
              <!-- Add other brief info if necessary -->
            </div>

            <!-- Card Footer -->
            <div
              class="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
              ID: {{ residence.id }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else message="No Residences Found." @refresh="refreshData" icon="pi pi-building" />

        <!-- Residence Detail Dialog -->
        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '600px' }"
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0" <!--
          Apply styles to contentClass, remove internal padding -->
          :dismissableMask="true">

          <div>
            <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Residence Details</h2>
              <Button icon="pi pi-times"
                class="p-button-text p-button-rounded !w-8 !h-8 !text-gray-500 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-primary-500/50"
                @click="closeDialog('view')" aria-label="Close dialog" />
            </div>

            <div v-if="isDetailLoading" class="p-6 text-center text-gray-500 dark:text-gray-400">
              Loading details...
              <div class="mt-4 space-y-3">
                <Skeleton width="60%" height="1.5rem" class="mb-4 bg-gray-200 dark:bg-gray-700 mx-auto" />
                <Skeleton width="100%" height="1rem" class="mb-2 bg-gray-200 dark:bg-gray-700" />
                <Skeleton width="80%" height="1rem" class="mb-2 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <!-- Main Content Area (shows when NOT loading) -->
            <div v-if="selectedItem && !isDetailLoading" class="p-5 md:p-6">
              <div class="space-y-3">
                <!-- Detail Row: ID -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">ID</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right break-all">{{ selectedItem.id
                  }}</span>
                </div>
                <!-- Detail Row: Building -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Building</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ selectedItem.building }}</span>
                </div>
                <!-- Detail Row: Room -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Room</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ selectedItem.room }}</span>
                </div>
                <div class="pt-2">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Residents</span>
                  <div v-if="selectedItem.residents?.length" class="space-y-2">
                    <div v-for="resident in selectedItem.residents" :key="resident.id"
                      class="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-700/50">
                      <i class="pi pi-user mr-2 text-primary dark:text-primary-300"></i>
                      <span class="text-sm text-gray-700 dark:text-gray-200">{{ resident.name }}</span>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-400 dark:text-gray-500 italic">No residents assigned</div>
                </div>
                <div class="pt-2">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Vehicles</span>
                  <div v-if="selectedItem.vehicles?.length" class="space-y-2">
                    <div v-for="vehicle in selectedItem.vehicles" :key="vehicle.id"
                      class="flex items-center p-2 rounded bg-gray-100 dark:bg-gray-700/50">
                      <i :class="[getVehicleTypeIcon(vehicle.type), 'mr-2 text-primary dark:text-primary-300']"></i>
                      <div class="flex flex-col leading-tight">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ vehicle.plate }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ vehicle.type }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-400 dark:text-gray-500 italic">No vehicles registered</div>
                </div>

              </div>
            </div>

            <div v-if="selectedItem && !isDetailLoading"
              class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <Button label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-outlined
                           !border-primary-500 !text-primary-600 hover:!bg-primary-50
                           dark:!border-primary-400 dark:!text-primary-300 dark:hover:!bg-primary-900/20
                           focus:!ring-2 focus:!ring-primary-500/50" @click="updateResidence(selectedItem.id)" />
              <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('view')" />
            </div>
          </div>
        </Dialog>
      </div>
    </div>

    <FloatingButton icon="+" @click="createResidence" aria-label="Add new residence" />
  </MenuLayout>
</template>
