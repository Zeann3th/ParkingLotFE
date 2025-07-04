<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router';
import { Warehouse } from "lucide-vue-next";
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import type { CreateSection, Section } from '@/types';
import { sectionService } from '@/services/section.service';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import { useState } from '@/composables/state';
import { useAuth } from '@/composables/auth';
import InputText from '@/components/InputText.vue';
import InputNumber from '@/components/InputNumber.vue';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {PlayIcon, Pencil, Save, Trash2, X, ClipboardPlus} from "lucide-vue-next";

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Section>();
const router = useRouter();

const isEditing = ref(false);

const { role } = useAuth();
const isAdmin = computed(() => role.value === "ADMIN");
const isPrivilleged = computed(() => role.value === "ADMIN" || role.value === "SECURITY");

const users = ref('');

const handleEdit = () => {
  if (selectedItem.value?.name) createSectionPayload.value.name = selectedItem.value.name;
  if (selectedItem.value?.capacity) createSectionPayload.value.capacity = selectedItem.value.capacity;
  isEditing.value = true;
}

const createSectionPayload = ref<CreateSection>({
  name: '',
  capacity: 0,
})

const getAllSections = async () => {
  isLoading.value = true;
  try {
    itemList.value = await sectionService.getAll(page.value, limit.value, { cache: !isMutated.value });
    maxPage.value = 1;
    isMutated.value = false;
  } catch (error) {
    toast.error(error?.toString() ?? 'Error loading sections');
  } finally {
    isLoading.value = false;
  }
};

const getSectionDetail = async (id: number) => {
  openDialog("view");
  isDetailLoading.value = true;
  selectedItem.value = null;
  isEditing.value = false;
  try {
    selectedItem.value = await sectionService.getById(id);
  } catch (error) {
    toast.error(error?.toString() ?? 'Error loading section');
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const updateSection = async () => {
  if (!selectedItem.value?.id) return;
  try {
    const userList = users.value.split(",").map(u => u.trim()).filter(Boolean);
    if (userList.length === 0) {
      await sectionService.update(selectedItem.value.id, createSectionPayload.value);
    } else {
      const userIds = userList.map(user => {
        const userId = parseInt(user);
        return isNaN(userId) ? null : userId;
      }).filter(userId => userId !== null);
      await sectionService.update(selectedItem.value.id, createSectionPayload.value, userIds);
    }
    refreshData();
    toast.success('Section updated');
  } catch (error) {
    toast.error('Failed to update section');
    return;
  } finally {
    closeDialog('view');
    isEditing.value = false;
  }
};

const deleteSection = async (id: number | undefined) => {
  if (!id) return;
  if (!window.confirm('Are you sure you want to delete this section?')) return;
  try {
    await sectionService.delete(id);
    refreshData();
    toast.success('Section deleted');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error deleting section');
  } finally {
    closeDialog("view");
  }
};

const createSection = async () => {
  if (createSectionPayload.value.name.trim() === '' || createSectionPayload.value.capacity == 0) return;
  try {
    await sectionService.create(createSectionPayload.value);
    refreshData();
    toast.success('Section created');
  } catch (error) {
    toast.error('Failed to create section');
    return;
  } finally {
    closeDialog('create');
    createSectionPayload.value = { name: '', capacity: 0 };
  }
};

const startParkingSession = () => {
  if (!selectedItem.value?.id) return;
  router.push({ name: 'parking', params: { sectionId: selectedItem.value.id } });
}

const refreshData = () => {
  isMutated.value = true;
  getAllSections();
}

onMounted(() => {
  getAllSections();
  isMutated.value = false;
});

const reportRevenue = ref<number|null>(null);
const showReport = ref(false);
const reportDates = ref<{from: string|null, to: string|null}>({ from: null, to: null });

const fetchReport = async () => {
  if (!selectedItem.value?.id) return;
  try {
    const fromISO = reportDates.value.from ? new Date(reportDates.value.from).toISOString() : undefined;
    const toISO = reportDates.value.to ? new Date(reportDates.value.to).toISOString() : undefined;
    const res = await sectionService.report(selectedItem.value.id, { from: fromISO, to: toISO });
    reportRevenue.value = res.revenue;
  } catch (error) {
    toast.error('Failed to fetch report');
  }
};

const openReport = () => {
  showReport.value = true;
  reportRevenue.value = null;
  reportDates.value = { from: null, to: null };
};

const closeReport = () => {
  showReport.value = false;
  reportRevenue.value = null;
  reportDates.value = { from: null, to: null };
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen p-4 md:p-6 bg-white text-gray-900 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Sections" @click="refreshData" class="mb-6" />
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <Skeleton v-for="i in limit" :key="i" class="h-32 w-full rounded-lg" />
        </div>
        <div v-else-if="itemList.length > 0"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <div v-for="section in itemList" :key="section.id"
               class="bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-blue-100 flex flex-col"
               @click="getSectionDetail(section.id)" role="button"
               :aria-label="`View details for Section ${section.name}`">
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="font-semibold text-black line-clamp-1 break-all flex-1"
                  :title="section.name">
                {{ section.name }}
              </h2>
            </div>
            <div class="text-sm text-gray-600 mb-3">
              <span class="mr-1">🚗</span>
              <span>Capacity: {{ section.capacity }}</span>
            </div>
            <div class="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
              ID: {{ section.id }}
            </div>
          </div>
        </div>
        <EmptyMessage v-else message="No Sections Found." @refresh="refreshData" :icon="Warehouse" />

        <!-- Section Detail Dialog -->
        <Dialog v-model:open="dialogs.view">
          <DialogContent class="max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div class="flex-1 overflow-y-auto">
              <div class="flex justify-between items-center p-5 border-b border-blue-100">
                <h2 class="text-xl font-semibold text-gray-800">Section Details</h2>
              </div>
              <div v-if="isDetailLoading" class="p-6 text-center text-gray-500">
                <Skeleton class="h-6 w-2/5 mb-4 mx-auto" />
                <Skeleton class="h-4 w-full mb-2" />
                <Skeleton class="h-16 w-full mb-4" />
                <Skeleton class="h-5 w-3/5 mx-auto" />
                <p>Loading Details...</p>
              </div>
              <div v-if="selectedItem && !isDetailLoading" class="p-5 md:p-6">
                <div class="space-y-3">
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">ID</span>
                    <span class="text-sm text-gray-800 text-right break-all">{{ selectedItem.id }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Name</span>
                    <span v-if="!isEditing" class="text-sm text-gray-800 text-right">{{ selectedItem.name }}</span>
                    <InputText v-else v-model="createSectionPayload.name" inputId="updateSectionName" />
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Capacity</span>
                    <span v-if="!isEditing" class="text-sm text-gray-800 text-right">{{ selectedItem.capacity }}</span>
                    <InputNumber v-else v-model="createSectionPayload.capacity" inputId="updateSectionCapacity" />
                  </div>
                  <div v-if="isEditing" class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Assign to user(s)</span>
                    <InputText v-model="users" inputId="updateSectionUser" placeholder="User IDs separated by commas" />
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Created At</span>
                    <span class="text-sm text-gray-800 text-right">{{ new Date(selectedItem.createdAt).toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="text-sm font-medium text-gray-500 w-1/3">Updated At</span>
                    <span class="text-sm text-gray-800 text-right">{{ new Date(selectedItem.updatedAt).toLocaleString() }}</span>
                  </div>

                  <!-- Report Section -->
                  <div v-if="showReport" class="mt-6 p-4 border rounded-lg bg-gray-50">
                    <div class="flex justify-between items-center mb-3">
                      <h3 class="text-lg font-medium text-gray-800">Revenue Report</h3>
                      <Button variant="ghost" size="sm" @click="closeReport" class="h-8 w-8 p-0">
                        <X class="w-4 h-4" />
                      </Button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            v-model="reportDates.from"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            v-model="reportDates.to"
                            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <Button @click="fetchReport" class="bg-blue-600 hover:bg-blue-700 text-white">
                        Generate Report
                      </Button>
                      <div v-if="reportRevenue !== null" class="text-green-700 font-semibold">
                        Revenue: ${{ reportRevenue.toLocaleString() }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter class="flex-shrink-0 flex flex-wrap justify-end gap-2 p-4 border-t border-blue-100 bg-blue-50 rounded-b-lg">
              <template v-if="selectedItem && !isDetailLoading">
                <Button v-if="isPrivilleged && !isEditing" variant="secondary" @click="startParkingSession" class="bg-green-600 hover:bg-green-700 text-white">
                  <PlayIcon class="w-4 h-4 mr-1"/>
                  Start Session
                </Button>
                <Button v-if="isPrivilleged && !isEditing" variant="secondary" @click="openReport" class="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <ClipboardPlus class="w-4 h-4 mr-1"/>
                  Report
                </Button>
                <Button v-if="isAdmin && !isEditing" variant="secondary" @click="handleEdit" class="bg-blue-600 hover:bg-blue-700 text-white">
                  <Pencil class="w-4 h-4 mr-1"/>
                  Edit
                </Button>
                <Button v-else-if="isAdmin && isEditing" variant="secondary" @click="updateSection" class="bg-green-600 hover:bg-green-700 text-white">
                  <Save class="w-4 h-4 mr-1"/>
                  Save
                </Button>
                <Button v-if="isAdmin" variant="destructive" @click="deleteSection(selectedItem.id)">
                  <Trash2 class="w-4 h-4 mr-1"/>
                  Delete
                </Button>
                <Button variant="ghost" @click="() => { closeDialog('view'); isEditing = false; closeReport(); }">
                  <X class="w-4 h-4 mr-1"/>
                  Close
                </Button>
              </template>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Create Section Dialog-->
        <Dialog v-model:open="dialogs.create">
          <DialogContent class="max-w-md w-full p-0">
            <div class="flex justify-between items-center p-5 border-b border-blue-100">
              <h2 class="text-xl font-semibold text-gray-800">Create New Section</h2>
            </div>
            <div class="p-5 md:p-6 space-y-4">
              <InputText v-model="createSectionPayload.name" inputId="createSectionName" placeholder="Enter section name" />
              <InputNumber v-model="createSectionPayload.capacity" inputId="createSectionCapacity" placeholder="Enter capacity" />
            </div>
            <DialogFooter class="flex justify-end gap-3 p-4 border-t border-blue-100 bg-blue-50 rounded-b-xl">
              <Button v-if="isAdmin" variant="secondary" @click="createSection"
                      :disabled="!createSectionPayload.name || createSectionPayload.capacity <= 0" class="bg-green-600 hover:bg-green-700 text-white">
                <Save class="w-5 h-5 mr-2"/>
                Save
              </Button>
              <Button variant="ghost" @click="closeDialog('create')">
                <X class="w-5 h-5 mr-2"/>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <FloatingButton v-if="isAdmin" icon="+" @click="openDialog('create')" aria-label="Add new section" />
  </MenuLayout>
</template>