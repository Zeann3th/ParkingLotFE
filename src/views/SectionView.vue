<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Dialog, Button, useToast, useConfirm, ConfirmDialog } from 'primevue';
import Skeleton from '@/components/Skeleton.vue';
import MenuLayout from '@/components/MenuLayout.vue';
import type { CreateSection, Section } from '@/types';
import { sectionService } from '@/services/section.service';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import { useState } from '@/composables/state';
import { useAuth } from '@/composables/auth';
import InputText from '@/components/InputText.vue';
import InputNumber from '@/components/InputNumber.vue';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Section>();

const toast = useToast();
const confirm = useConfirm();

const isEditing = ref(false);

const isAdmin = computed(() => {
  const { role } = useAuth();
  return role.value === "ADMIN";
})

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
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

const getSectionDetail = async (id: number) => {
  openDialog("view");
  isDetailLoading.value = true;
  selectedItem.value = null;

  try {
    const response = await sectionService.getById(id);
    selectedItem.value = response;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const updateSection = async () => {
  if (!selectedItem.value?.id) return;
  try {
    const userList = users.value.split(",");
    if (userList.length === 0) {
      await sectionService.update(selectedItem.value.id, createSectionPayload.value);
    } else {
      const userIds = userList.map(user => {
        const userId = parseInt(user.trim());
        return isNaN(userId) ? null : userId;
      }).filter(userId => userId !== null);
      await sectionService.update(selectedItem.value.id, createSectionPayload.value, userIds);
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update section', life: 3000 });
    return;
  } finally {
    closeDialog('view');
    isEditing.value = false;
    isMutated.value = true;
    getAllSections();
  }
};

const deleteSection = (id: number | undefined) => {
  if (!id) return;
  confirm.require({
    message: 'Are you sure you want to delete this ticket?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await sectionService.delete(id);
        isMutated.value = true;
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error,
          life: 3000,
        });
      } finally {
        closeDialog("view");
        getAllSections();
      }
    }
  });
};

const createSection = async () => {
  if (createSectionPayload.value.name.trim() === '' || createSectionPayload.value.capacity == 0) return;
  try {
    await sectionService.create(createSectionPayload.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Section created successfully', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create section', life: 3000 });
    return;
  } finally {
    closeDialog('create');
    createSectionPayload.value = { name: '', capacity: 0 };
    isMutated.value = true;
    getAllSections();
  }
};

const refreshData = () => {
  isMutated.value = true;
  getAllSections();
}

onMounted(() => {
  getAllSections();
  isMutated.value = false;
});
</script>

<template>
  <MenuLayout>
    <div
      class="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Sections" @click="refreshData" class="mb-6" />
        <Skeleton v-if="isLoading" type="grid" :count="limit" />
        <div v-else-if="itemList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <!-- Section Card -->
          <div v-for="section in itemList" :key="section.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-primary/30 flex flex-col"
            @click="getSectionDetail(section.id)" role="button"
            :aria-label="`View details for Section ${section.name}`">
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 break-all flex-1"
                :title="section.name">
                {{ section.name }}
              </h2>
            </div>

            <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div class="mt-1">
                <i class="pi pi-car mr-1"></i>
                <span>Capacity: {{ section.capacity }}</span>
              </div>
            </div>

            <!-- Card Footer -->
            <div
              class="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
              ID: {{ section.id }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else message="No Sections Found." @refresh="refreshData" icon="pi pi-th-large" />

        <!-- Section Detail Dialog -->
        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '600px' }"
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0">

          <div>
            <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Section Details</h2>
              <Button icon="pi pi-times"
                class="p-button-text p-button-rounded !w-8 !h-8 !text-gray-500 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-primary-500/50"
                @click="() => { closeDialog('view'), isEditing = false }" aria-label="Close dialog" />
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
                <!-- Detail Row: Name -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Name</span>
                  <span v-if="!isEditing" class="text-sm text-gray-800 dark:text-gray-100 text-right">{{
                    selectedItem.name }}</span>
                  <InputText v-else v-model="createSectionPayload.name" inputId="updateSectionName" />
                </div>
                <!-- Detail Row: Capacity -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Capacity</span>
                  <span v-if="!isEditing" class="text-sm text-gray-800 dark:text-gray-100 text-right">{{
                    selectedItem.capacity
                  }}</span>
                  <InputNumber v-else v-model="createSectionPayload.capacity" inputId="updateSectionCapacity" />
                </div>
                <div v-if="isEditing" class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Assign to user(s)</span>
                  <InputText v-model="users" inputId="updateSectionUser" />
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
              class="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">

              <Button v-if="isAdmin && !isEditing" label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-outlined
                           !border-accent !bg-accent !text-white hover:!bg-accent/80
                           focus:!ring-2 focus:!ring-accent/50" @click="handleEdit" />
              <Button v-else-if="isAdmin && isEditing" label="Save" icon="pi pi-save" class="p-button-sm p-button-outlined
                           !border-green-500 !bg-green-500 !text-white hover:!bg-green-700
                           focus:!ring-2 focus:!ring-accent/50" @click="updateSection" />
              <Button v-if="isAdmin" label="Delete" icon="pi pi-trash" class="p-button-sm p-button-outlined
                           !border-red-500 !bg-red-500 !text-white hover:!bg-red-700
                           focus:!ring-2 focus:!ring-red-500/50" @click="deleteSection(selectedItem.id)" />
              <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700  hover:!bg-gray-100 
                           focus:!ring-2 focus:!ring-gray-500/50"
                @click="() => { closeDialog('view'); isEditing = false }" />
            </div>
          </div>
        </Dialog>

        <!-- Create Section Dialog-->
        <Dialog v-model:visible="dialogs.create" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '600px' }"
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0">
          <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Create New Section</h2>
            <Button icon="pi pi-times"
              class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
              @click="closeDialog('create')" aria-label="Close dialog" unstyled />
          </div>
          <div class="p-5 md:p-6 space-y-4">
            <InputText v-model="createSectionPayload.name" inputId="createSectionName" placeholder="Enter section name"
              label="Section Name" />
            <InputNumber v-model="createSectionPayload.capacity" inputId="createSectionCapacity"
              placeholder="Enter capacity" label="Capacity" />
          </div>
          <div
            class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <Button v-if="isAdmin" label="Save" icon="pi pi-save" class="p-button-sm p-button-outlined
                           !border-green-500 !bg-green-500 !text-white hover:!bg-green-700
                           focus:!ring-2 focus:!ring-accent/50" @click="createSection" />
            <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700  hover:!bg-gray-100 
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('create')" />
          </div>
        </Dialog>
      </div>
    </div>

    <FloatingButton v-if="isAdmin" icon="+" @click="openDialog('create')" aria-label="Add new section" />
    <ConfirmDialog class="!bg-white !text-black" acceptClass="!bg-green-500 !hover:bg-green-700 !text-white"
      rejectClass="!bg-red-500 !hover:bg-red-700 !text-white" />
  </MenuLayout>
</template>