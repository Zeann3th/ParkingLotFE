<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import { type CreateVehicle, type Vehicle } from '@/types';
import { vehicleService } from '@/services/vehicle.service';
import EmptyMessage from '@/components/EmptyMessage.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import { useState } from '@/composables/state';
import Title from '@/components/Title.vue';
import InputText from '@/components/InputText.vue';
import { useAuth } from '@/composables/auth';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pencil, X, Save } from 'lucide-vue-next';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Vehicle>({ limit: 20 });
const isEditing = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const isSearching = ref(false);

const createVehiclePayload = ref<CreateVehicle>({
  plate: '',
  type: '',
});

const { role } = useAuth();
const isPrivileged = computed(() => role.value === 'ADMIN' || role.value === 'SECURITY');
const isAdmin = computed(() => role.value === 'ADMIN');

const getAllVehicles = async () => {
  isLoading.value = true;
  try {
    const response = await vehicleService.getAll(page.value, limit.value, { cache: !isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.maxPage;
    isMutated.value = false;
  } catch (error) {
    toast.error('Error loading vehicles');
  } finally {
    isLoading.value = false;
  }
};

const searchVehicles = async (query: string) => {
  if (!query.trim()) {
    page.value = 1;
    await getAllVehicles();
    return;
  }
  isSearching.value = true;
  try {
    itemList.value = await vehicleService.search(query.trim());
    maxPage.value = 1;
    page.value = 1;
  } catch (error) {
    toast.error('Search failed');
  } finally {
    isSearching.value = false;
  }
};

const getVehicleDetail = async (id: number) => {
  selectedItem.value = null;
  openDialog("view");
  try {
    selectedItem.value = await vehicleService.getById(id);
  } catch (error) {
    toast.error('Error fetching details');
    closeDialog("view");
  }
};

const createVehicle = async () => {
  if (!createVehiclePayload.value.plate || !createVehiclePayload.value.type) {
    toast.warning('Please fill in both Plate and Type.');
    return;
  }
  isMutated.value = true;
  try {
    await vehicleService.create(createVehiclePayload.value);
    toast.success('New vehicle added successfully.');
    closeDialogAndResetCreateForm();
    page.value = 1;
    if (searchQuery.value.trim()) {
      await searchVehicles(searchQuery.value);
    } else {
      await getAllVehicles();
    }
  } catch (error) {
    isMutated.value = false;
    toast.error('Creation failed');
  }
};

const updateVehicle = async () => {
  if (!selectedItem.value) return;
  if (!selectedItem.value.plate || !selectedItem.value.type) {
    toast.warning('Plate and Type cannot be empty.');
    return;
  }
  isMutated.value = true;
  try {
    await vehicleService.update(selectedItem.value.id, selectedItem.value.plate);
    toast.success('Vehicle details saved.');
    isEditing.value = false;
    closeDialog("view");
    if (searchQuery.value.trim()) {
      await searchVehicles(searchQuery.value);
    } else {
      await getAllVehicles();
    }
  } catch (error) {
    isMutated.value = false;
    toast.error('Update failed');
  }
};

const deleteVehicle = async (id: number | undefined) => {
  if (!id) return;
  if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
  isMutated.value = true;
  try {
    await vehicleService.delete(id);
    toast.success('Vehicle deleted');
    if (searchQuery.value.trim()) {
      await searchVehicles(searchQuery.value);
    } else {
      await getAllVehicles();
    }
    closeDialog("view");
  } catch (error) {
    isMutated.value = false;
    toast.error('Delete failed');
  }
};

const handleScroll = () => {
  const container = scrollContainer.value;
  if (!container || isLoading.value || page.value >= maxPage.value || searchQuery.value.trim()) return;
  const bottomOffset = 150;
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < bottomOffset;
  if (isNearBottom) {
    page.value += 1;
    isLoading.value = true;
    vehicleService.getAll(page.value, limit.value, { cache: !isMutated.value })
        .then((response) => {
          if (response.data && response.data.length > 0) {
            itemList.value.push(...response.data);
          }
          maxPage.value = response.maxPage;
        })
        .catch(() => {
          page.value -= 1;
          toast.error('Failed to load more vehicles');
        })
        .finally(() => {
          isLoading.value = false;
        });
  }
};

function debounce(func: Function, wait: number) {
  let timeout: number | undefined;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}

const debouncedSearch = debounce((query: string) => {
  searchVehicles(query);
}, 300);

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery);
});

const clearSearch = () => {
  searchQuery.value = '';
};

const refreshData = () => {
  if (searchQuery.value.trim()) {
    searchVehicles(searchQuery.value);
  } else {
    getAllVehicles();
  }
};

onMounted(() => {
  getAllVehicles();
  const debouncedScrollHandler = debounce(handleScroll, 200);
  scrollContainer.value?.addEventListener('scroll', debouncedScrollHandler);
  onBeforeUnmount(() => {
    scrollContainer.value?.removeEventListener('scroll', debouncedScrollHandler);
  });
});

const closeDialogAndResetCreateForm = () => {
  closeDialog("create");
  createVehiclePayload.value = { plate: '', type: '' };
};

const closeViewDialog = () => {
  closeDialog('view');
  isEditing.value = false;
};

const getVehicleTypeIcon = (type: string | undefined) => {
  if (!type) return '❓';
  switch (type.toUpperCase()) {
    case 'CAR': return '🚗';
    case 'MOTORBIKE': return '🏍️';
    default: return '❓';
  }
};
</script>

<template>
  <MenuLayout>
    <div ref="scrollContainer"
         class="min-h-screen bg-white p-4 sm:p-6 lg:p-8 transition-colors duration-300 overflow-y-auto">
      <div class="max-w-7xl mx-auto">
        <Title name="Vehicles" @click="refreshData" class="mb-6" />

        <!-- Search Bar -->
        <div class="mb-6 flex items-center gap-3">
          <InputText v-model="searchQuery" inputId="vehicleSearch" placeholder="Search by plate or type..." class="w-full" />
          <Button variant="ghost" @click="clearSearch" v-if="searchQuery" size="icon" aria-label="Clear search">
            <X class="w-4 h-4" />
          </Button>
        </div>

        <!-- Loading Skeletons -->
        <div v-if="isLoading && itemList.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <Skeleton v-for="i in limit" :key="i" class="h-32 w-full rounded-lg" />
        </div>

        <!-- Vehicle List -->
        <div v-else-if="itemList.length > 0"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <div v-for="vehicle in itemList" :key="vehicle.id"
               class="bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-blue-100 flex flex-col"
               @click="getVehicleDetail(vehicle.id)" role="button"
               :aria-label="`View details for vehicle ${vehicle.plate}`">
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="font-semibold text-black line-clamp-1 break-all flex-1">
                <span class="mr-2 text-xl">{{ getVehicleTypeIcon(vehicle.type) }}</span>
                {{ vehicle.plate }}
              </h2>
            </div>
            <div class="text-sm text-gray-600 mb-3">
              <Badge variant="secondary" class="bg-blue-50 text-blue-700 border-blue-200">
                {{ vehicle.type }}
              </Badge>
            </div>
            <div class="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
              ID: {{ vehicle.id }}
            </div>
          </div>
          <div v-if="isLoading && itemList.length > 0" class="col-span-full text-center py-4">
            <Skeleton class="h-6 w-24 mx-auto" />
            <span class="text-gray-500 ml-2">Loading more...</span>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else-if="!isLoading && itemList.length === 0" message="No Vehicles Found." @refresh="refreshData" />

        <!-- Vehicle Detail Dialog -->
        <Dialog v-model:open="dialogs.view">
          <DialogContent class="max-w-md w-full p-0">
            <div>
              <div class="flex justify-between items-center p-5 border-b border-blue-100">
                <h2 class="text-xl font-semibold text-gray-800">Vehicle Details</h2>
              </div>
              <div v-if="!selectedItem" class="p-6 text-center text-gray-500">
                <Skeleton class="h-6 w-2/5 mb-4 mx-auto" />
                <Skeleton class="h-4 w-full mb-2" />
                <Skeleton class="h-16 w-full mb-4" />
                <Skeleton class="h-5 w-3/5 mx-auto" />
                <p>Loading Details...</p>
              </div>
              <div v-else class="p-5 md:p-6">
                <div class="space-y-3">
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">ID</span>
                    <span class="text-sm text-gray-800 text-right break-all">{{ selectedItem.id }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Plate</span>
                    <span v-if="!isEditing" class="text-sm text-gray-800 text-right">{{ selectedItem.plate }}</span>
                    <InputText v-else v-model="selectedItem.plate" inputId="updateVehiclePlate" />
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Type</span>
                    <span v-if="!isEditing" class="text-sm text-gray-800 text-right">{{ selectedItem.type }}</span>
                    <InputText v-else v-model="selectedItem.type" inputId="updateVehicleType"/>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Created At</span>
                    <span class="text-sm text-gray-800 text-right">{{ new Date(selectedItem.createdAt).toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Updated At</span>
                    <span class="text-sm text-gray-800 text-right">{{ new Date(selectedItem.updatedAt).toLocaleString() }}</span>
                  </div>
                </div>
              </div>
              <DialogFooter class="flex justify-end gap-3 p-4 border-t border-blue-100 bg-blue-50 rounded-b-lg">
                <template v-if="selectedItem">
                  <Button v-if="isAdmin && !isEditing" variant="secondary" @click="isEditing = true" class="bg-blue-600 text-white hover:bg-blue-700">
                    <Pencil class="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button v-else-if="isAdmin && isEditing" variant="secondary" @click="updateVehicle" class="bg-green-600 text-white hover:bg-green-700" :disabled="!selectedItem.plate || !selectedItem.type">
                    <Save class="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button v-if="isAdmin" variant="destructive" @click="deleteVehicle(selectedItem.id)">
                    <Trash2 class="w-4 h-4 mr-1" /> Delete
                  </Button>
                  <Button variant="ghost" @click="closeViewDialog">
                    Close
                  </Button>
                </template>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Create Vehicle Dialog -->
        <Dialog v-model:open="dialogs.create">
          <DialogContent class="max-w-md w-full p-0">
            <div class="flex justify-between items-center p-5 border-b border-blue-100">
              <h2 class="text-xl font-semibold text-gray-800">Create New Vehicle</h2>
            </div>
            <div class="p-5 md:p-6 space-y-4">
              <InputText v-model="createVehiclePayload.plate" inputId="createVehiclePlate" placeholder="Enter vehicle plate" />
              <InputText v-model="createVehiclePayload.type" inputId="createVehicleType" placeholder="Enter vehicle type" />
            </div>
            <DialogFooter class="flex justify-end gap-3 p-4 border-t border-blue-100 bg-blue-50 rounded-b-xl">
              <Button v-if="isPrivileged" variant="secondary" @click="createVehicle"
                      :disabled="!createVehiclePayload.plate || !createVehiclePayload.type">
                <Save class="w-4 h-4 mr-1"/>
                Save
              </Button>
              <Button variant="ghost" @click="closeDialogAndResetCreateForm">
                <X class="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <FloatingButton v-if="isPrivileged" icon="+" @click="openDialog('create')" aria-label="Add new vehicle" />
  </MenuLayout>
</template>