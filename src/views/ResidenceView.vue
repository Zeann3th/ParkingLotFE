<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Dialog, Button, useToast } from 'primevue';
import Skeleton from '@/components/Skeleton.vue';
import MenuLayout from '@/components/MenuLayout.vue';
import type { CreateResidence, Residence } from '@/types';
import { residenceService } from '@/services/residence.service';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import { useState } from '@/composables/state';
import { useAuth } from '@/composables/auth';
import InputText from '@/components/InputText.vue';
import InputNumber from '@/components/InputNumber.vue';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Residence>();
const toast = useToast();
const scrollContainer = ref<HTMLElement | null>(null);

const isPrivilleged = computed(() => {
  const { role } = useAuth();
  return role.value === "ADMIN" || role.value === "SECURITY";
})

const createResidencePayload = ref<CreateResidence>({
  building: '',
  room: 0,
})

const getAllResidences = async () => {
  isLoading.value = true;
  try {
    const response = await residenceService.getAll(page.value, limit.value, { cache: !isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.count;
    isMutated.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

const getResidenceDetail = async (id: number) => {
  openDialog("view");
  isDetailLoading.value = true;
  selectedItem.value = null;

  try {
    const response = await residenceService.getById(id);
    selectedItem.value = response;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const updateResidence = () => {
  closeDialog('view');
  toast.add({ severity: 'info', summary: 'Info', detail: 'Edit functionality not yet implemented.', life: 3000 });
};

const createResidence = async () => {
  try {
    await residenceService.create(createResidencePayload.value);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    return;
  } finally {
    closeDialog('create');
    createResidencePayload.value = { building: '', room: 0 };
  }
};

const refreshData = () => {
  isMutated.value = true;
  getAllResidences();
}

const getVehicleTypeIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'CAR': return 'pi pi-car';
    case 'MOTORBIKE': return 'pi pi-';
    default: return 'pi pi-question-circle';
  }
};

const handleScroll = () => {
  if (!isLoading.value && page.value < maxPage.value) {
    console.log("Reached bottom, loading more...");
    page.value += 1;
    isLoading.value = true;

    residenceService.getAll(page.value, limit.value, { cache: !isMutated.value })
      .then((response) => {
        if (response.data && response.data.length > 0) {
          itemList.value.push(...response.data);
        }
        maxPage.value = response.count;
      })
      .catch(() => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load more tickets', life: 3000 });
      })
      .finally(() => {
        isLoading.value = false;
      });
  }
};

onMounted(() => {
  getAllResidences();
  scrollContainer.value?.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <MenuLayout>
    <div ref="scrollContainer"
      class="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Residences" @click="refreshData" class="mb-6" />
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
                {{ `Building ${residence.building} / Room ${residence.room}` }}
              </h2>
            </div>

            <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div v-if="residence.users?.length" class="mt-1 text-xs">
                {{ residence.users.length }} Resident(s)
              </div>
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
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0">

          <div>
            <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Residence Details</h2>
              <Button icon="pi pi-times"
                class="p-button-text p-button-rounded !w-8 !h-8 !text-gray-500 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-primary-500/50"
                @click="closeDialog('view')" aria-label="Close dialog" />
            </div>

            <div v-if="isDetailLoading" class="p-6 text-center text-gray-500 dark:text-gray-400">
              <Skeleton />
            </div>

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
                  <div v-if="selectedItem.users?.length" class="space-y-2">
                    <div v-for="resident in selectedItem.users" :key="resident.id"
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

                <!-- Detail Row: Created At -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Created At</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ new
                    Date(selectedItem.createdAt).toLocaleString() }}</span>
                </div>
                <!-- Detail Row: Updated At -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Updated At</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ new
                    Date(selectedItem.updatedAt).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedItem && !isDetailLoading"
              class="flex justify-end gap-3 p-4 border-t border-gray-200  bg-gray-50 rounded-b-lg">
              <Button v-if="isPrivilleged" label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-outlined
                           !border-accent !bg-accent !text-white hover:!bg-accent/80
                           focus:!ring-2 focus:!ring-accent/50" @click="updateResidence" />
              <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700  hover:!bg-gray-100 
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('view')" />
            </div>
          </div>
        </Dialog>

        <!-- Create Residence Dialog-->
        <Dialog v-model:visible="dialogs.create" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '600px' }"
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0">
          <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Create New Residence</h2>
            <Button icon="pi pi-times"
              class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
              @click="closeDialog('create')" aria-label="Close dialog" unstyled />
          </div>
          <div class="p-5 md:p-6 space-y-4">
            <InputText v-model="createResidencePayload.building" inputId="createResidenceBuilding"
              placeholder="Enter residence building" />
            <InputNumber v-model="createResidencePayload.room" inputId="createResidenceRoom"
              placeholder="Enter residence room" />
          </div>
          <div
            class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <Button v-if="isPrivilleged" label="Save" icon="pi pi-save" class="p-button-sm p-button-outlined
                           !border-green-500 !bg-green-500 !text-white hover:!bg-green-700
                           focus:!ring-2 focus:!ring-accent/50" @click="createResidence" />
            <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700  hover:!bg-gray-100 
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('create')" />
          </div>
        </Dialog>
      </div>
    </div>

    <FloatingButton v-if="isPrivilleged" icon="+" @click="openDialog('create')" aria-label="Add new residence" />
  </MenuLayout>
</template>
