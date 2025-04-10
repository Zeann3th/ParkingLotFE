<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue';
import { useAuth } from '@/composables/auth';
import axios from 'axios';
import { memoryStorage } from '@/storage';
import Skeleton from 'primevue/skeleton';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { useToast } from 'primevue';
import { useRoute, useRouter } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Residence, ResidenceDetail, ResidenceResponse } from '@/types';

const { role } = useAuth();
const residences: Ref<Residence[]> = ref([]);
const selectedResidence = ref<ResidenceDetail | null>(null);
const loading = ref(true);
const detailsLoading = ref(false);
const showDetailDialog = ref<boolean>(false);
const toast = useToast();
const route = useRoute();
const router = useRouter();

const totalPages = ref(1);
const currentPage = ref(1);
const rowsPerPage = ref(10);

const fetchResidences = async () => {
  loading.value = true;
  try {
    const response = await axios.get<ResidenceResponse>(
      '/residences',
      {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
        params: {
          page: currentPage.value,
          limit: rowsPerPage.value,
        }
      }
    );
    residences.value = response.data.data;
    totalPages.value = response.data.count;
  } catch (error) {
    console.error('Error fetching residences:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load residences',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  currentPage.value = parseInt(newQuery.page as string) || 1;
  fetchResidences();
}, { immediate: true });

const updateRouteParams = () => {
  router.push({
    query: {
      page: currentPage.value,
    }
  });
};

const onPageChange = (event: { page: number }) => {
  currentPage.value = event.page + 1;
  updateRouteParams();
};

const fetchResidenceDetails = async (id: number) => {
  detailsLoading.value = true;
  showDetailDialog.value = true;

  try {
    const response = await axios.get<ResidenceDetail>(`/residences/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedResidence.value = response.data;
  } catch (error) {
    console.error('Error fetching residence details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load residence details',
      life: 3000,
    });
  } finally {
    detailsLoading.value = false;
  }
};

const closeDialog = () => {
  showDetailDialog.value = false;
};

onMounted(() => {
  if (!route.query.page) {
    updateRouteParams();
  }
});

const isAdmin = computed(() => role.value === 'ADMIN');

const getBuildingColor = (building: string) => {
  const buildings = ['A', 'B', 'C', 'D', 'E', 'F'];
  const colors = [
    'bg-blue-900 bg-opacity-30 text-blue-400',
    'bg-green-900 bg-opacity-30 text-green-400',
    'bg-purple-900 bg-opacity-30 text-purple-400',
    'bg-yellow-900 bg-opacity-30 text-yellow-400',
    'bg-red-900 bg-opacity-30 text-red-400',
    'bg-cyan-900 bg-opacity-30 text-cyan-400'
  ];

  const index = buildings.indexOf(building);
  return index >= 0 ? colors[index] : 'bg-gray-900 bg-opacity-30 text-gray-400';
};

const getVehicleTypeIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'CAR':
      return 'pi pi-car';
    case 'MOTORCYCLE':
      return 'pi pi-bolt';
    case 'TRUCK':
      return 'pi pi-truck';
    default:
      return 'pi pi-car';
  }
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-gray-900 p-4 md:p-6 text-gray-100">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl md:text-3xl font-bold text-green-400">Residences</h1>
          <Button icon="pi pi-refresh" class="p-button-text text-gray-400 hover:text-green-400"
            @click="fetchResidences" />
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="n in 12" :key="n" class="bg-gray-800 bg-opacity-80 rounded-lg shadow p-4 backdrop-blur-sm">
            <Skeleton width="40%" height="2rem" class="mb-2 bg-gray-700" />
            <div class="flex space-x-6">
              <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700" />
              <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700" />
            </div>
          </div>
        </div>

        <!-- Residences Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="residence in residences" :key="residence.id"
            class="bg-gray-800 bg-opacity-80 hover:bg-gray-700 hover:bg-opacity-90 transition-all duration-200 rounded-lg shadow-sm p-4 cursor-pointer border border-gray-700 backdrop-blur-sm"
            @click="fetchResidenceDetails(residence.id)">
            <div class="flex justify-between items-start mb-2">
              <h2 class="text-lg font-semibold text-gray-100">Building {{ residence.building }}</h2>
              <span class="text-xs font-bold px-2 py-1 rounded-full" :class="getBuildingColor(residence.building)">
                {{ residence.building }}
              </span>
            </div>
            <div class="text-sm text-gray-400 mb-1">Room: {{ residence.room }}</div>
            <div class="text-xs text-gray-500 mt-2">ID: {{ residence.id }}</div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && residences.length === 0"
          class="text-center py-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
          <i class="pi pi-building text-6xl text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-400">No residences found</p>
          <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600"
            @click="fetchResidences" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center">
          <Paginator :rows="1" :totalRecords="totalPages" :first="currentPage - 1" @page="onPageChange"
            :rowsPerPageOptions="[]" template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            class="bg-gray-800 bg-opacity-80 border border-gray-700 rounded-lg shadow-sm backdrop-blur-sm">
            <template #start>
              <span class="text-sm text-gray-400 mr-2">Page {{ currentPage }} of {{ totalPages }}</span>
            </template>
          </Paginator>
        </div>

        <!-- Residence Detail Dialog -->
        <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
          class="bg-gray-800 bg-opacity-90 text-gray-100 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm"
          :style="{ width: '90%', maxWidth: '600px' }">
          <div v-if="selectedResidence && !detailsLoading" class="p-4 md:p-6">
            <div class="mb-6">
              <h2 class="text-xl font-bold border-b border-gray-700 pb-2 text-green-400">Residence Details</h2>
            </div>

            <div class="space-y-4">
              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">ID</span>
                <span class="font-medium text-gray-100">{{ selectedResidence.id }}</span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Building</span>
                <div class="flex items-center">
                  <span class="font-medium text-gray-100 mr-2">{{ selectedResidence.building }}</span>
                  <span class="text-xs px-2 py-1 rounded-full" :class="getBuildingColor(selectedResidence.building)">
                    {{ selectedResidence.building }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Room</span>
                <span class="font-medium text-gray-100">{{ selectedResidence.room }}</span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Residents</span>
                <div v-if="selectedResidence.residents.length > 0" class="mt-1">
                  <div v-for="resident in selectedResidence.residents" :key="resident.id"
                    class="flex items-center px-3 py-2 mb-1 rounded-md bg-gray-700 bg-opacity-50">
                    <i class="pi pi-user mr-2 text-green-400"></i>
                    <span class="font-medium text-gray-100">{{ resident.name }}</span>
                  </div>
                </div>
                <div v-else class="text-gray-400 italic">No residents assigned</div>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Vehicles</span>
                <div v-if="selectedResidence.vehicles.length > 0" class="mt-1">
                  <div v-for="vehicle in selectedResidence.vehicles" :key="vehicle.id"
                    class="flex items-center px-3 py-2 mb-1 rounded-md bg-gray-700 bg-opacity-50">
                    <i :class="[getVehicleTypeIcon(vehicle.type), 'mr-2 text-green-400']"></i>
                    <div class="flex flex-col">
                      <span class="font-medium text-gray-100">{{ vehicle.plate }}</span>
                      <span class="text-xs text-gray-400">{{ vehicle.type }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-gray-400 italic">No vehicles registered</div>
              </div>
            </div>

            <div class="flex justify-end mt-6 space-x-3">
              <Button v-if="isAdmin" label="Edit" icon="pi pi-pencil"
                class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
              <Button label="Close" @click="closeDialog"
                class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
            </div>
          </div>

          <!-- Loading state in dialog -->
          <div v-if="detailsLoading" class="p-4 space-y-4">
            <Skeleton width="60%" height="2rem" class="mb-6 bg-gray-700" />
            <Skeleton width="100%" height="1.5rem" class="mb-2 bg-gray-700" />
            <Skeleton width="80%" height="1.5rem" class="mb-2 bg-gray-700" />
            <Skeleton width="90%" height="1.5rem" class="mb-2 bg-gray-700" />
            <Skeleton width="70%" height="1.5rem" class="mb-2 bg-gray-700" />
            <div class="flex justify-end mt-6">
              <Skeleton width="100px" height="2.5rem" class="bg-gray-700" />
            </div>
          </div>
        </Dialog>
      </div>
    </div>

    <button v-if="isAdmin" class="floating-btn bg-green-600 hover:bg-green-700 text-white shadow-lg">
      +
    </button>
  </MenuLayout>
</template>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s ease;
}

:deep(.p-dialog-content) {
  background-color: rgba(31, 41, 55, 0.9);
  border-radius: 0.5rem;
  color: #f3f4f6;
  border: 1px solid rgba(55, 65, 81, 0.8);
}

:deep(.p-dialog) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

:deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.7);
}

:deep(.p-paginator) {
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.8);
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev) {
  color: #9ca3af;
  border: none;
  background: transparent;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: #10b981;
  color: white;
}

:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover),
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

:deep(.p-inputtext) {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

:deep(.p-inputtext:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.2);
}

:deep(.p-button.p-button-text) {
  color: #9ca3af;
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(255, 255, 255, 0.05);
  color: #10b981;
}

:deep(.p-skeleton) {
  background-color: rgba(55, 65, 81, 0.5);
  background-image: linear-gradient(90deg,
      rgba(55, 65, 81, 0.5) 0%,
      rgba(75, 85, 99, 0.5) 50%,
      rgba(55, 65, 81, 0.5) 100%);
}
</style>
