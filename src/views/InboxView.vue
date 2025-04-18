<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuth } from '@/composables/auth';
import { Dialog, Skeleton, Button, InputText, Textarea, ConfirmDialog, useToast, useConfirm } from 'primevue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Notification } from '@/types';
import { notificationService } from '@/services/notification.service';
import { formatDate, truncateStr } from '@/utils';
import Title from '@/components/Title.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import { useState } from '@/composables/state';
import Avatar from '@/components/Avatar.vue';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Notification>();
const { role } = useAuth();
const toast = useToast();
const route = useRoute();
const confirm = useConfirm();

const newNotification = ref({
  to: '' as string,
  message: ''
});

const getAllNotifications = async () => {
  isLoading.value = true;
  try {
    const response = await notificationService.getAll(page.value, limit.value, { cache: isMutated.value });
    if (response.message) {
      toast.add({ severity: 'error', summary: 'Error', detail: response.message, life: 3000, });
    } else {
      itemList.value = response.data;
      maxPage.value = response.count;
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load notifications', life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  page.value = parseInt(newQuery.page as string) || 1;
  getAllNotifications();
}, { immediate: true });

const getNotificationDetail = async (id: number) => {
  isDetailLoading.value = true;
  openDialog("view");

  try {
    const response = await notificationService.getById(id);
    selectedItem.value = response;

    if (response.status === 'PENDING') {
      readNotification(id);
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load notification details', life: 3000, });
  } finally {
    isDetailLoading.value = false;
  }
};

const readNotification = async (id: number) => {
  try {
    await notificationService.update(id)
    isMutated.value = true;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to mark notification as read', life: 3000, });
  }
};

const deleteNotification = (id: number) => {
  confirm.require({
    message: 'Are you sure you want to delete this notification?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await notificationService.delete(id);
        isMutated.value = true;
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete notification',
          life: 3000,
        });
      }
    }
  });
};

const openNewNotificationDialog = () => {
  openDialog("create");
  newNotification.value = {
    to: '',
    message: ''
  };
};

const sendNotification = async () => {
  if (!newNotification.value.message.trim()) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter a message', life: 3000, });
    return;
  }

  try {
    const payload: { message: string; to?: number } = {
      message: newNotification.value.message
    };

    if (newNotification.value.to.trim()) {
      const toValue = parseInt(newNotification.value.to);
      if (!isNaN(toValue) && toValue > 0) {
        payload.to = toValue;
      }
    }
    await notificationService.create(payload.message, payload.to);
    newNotification.value = { to: '', message: '' };
    closeDialog('create');
    isMutated.value = true;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to send notification', life: 3000, });
  }
};

const isAdmin = computed(() => role.value === 'ADMIN');

const cancelNewNotification = () => {
  newNotification.value = { to: '', message: '' };
  closeDialog('create');
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen p-4 md:p-6">
      <div class="max-w-4xl mx-auto">
        <Title name="Notifications" @click="getAllNotifications" />

        <!-- Skeleton Loading -->
        <Skeleton v-if="isLoading" />

        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div v-for="notification in itemList" :key="notification.id" :class="[
            'bg-white hover:bg-gray-50 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 shadow border',
            notification.status === 'READ'
              ? 'border-gray-200 opacity-80'
              : 'border-green-500'
          ]">
            <div class="flex-1 flex items-start cursor-pointer" @click="getNotificationDetail(notification.id)">
              <!-- Avatar -->
              <Avatar :name="notification.from.username" :id="notification.from.id" />

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between mb-1">
                  <div class="font-medium text-gray-900">{{ notification.from.name }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(notification.createdAt) }}</div>
                </div>
                <div class="text-xs text-gray-500 mb-1">@{{ notification.from.username }}</div>
                <div :class="['text-sm', notification.status === 'READ' ? 'text-gray-500' : 'text-gray-700']">
                  {{ truncateStr(notification.message) }}
                </div>
                <div v-if="notification.status === 'PENDING'" class="mt-2">
                  <span class="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">New</span>
                </div>
              </div>
            </div>

            <!-- Delete button (Admin only) -->
            <div v-if="isAdmin" class="ml-2 flex-shrink-0" @click.stop>
              <Button icon="pi pi-trash"
                class="p-button-text p-button-rounded p-button-sm text-gray-500 hover:text-red-600"
                @click="deleteNotification(notification.id)" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && itemList.length === 0">
          <EmptyMessage icon="pi pi-bell" message="No Notifications Found" @click="getAllNotifications" />
        </div>

        <!-- Notification Detail Dialog -->
        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
          class="bg-white text-gray-900 border border-gray-200 rounded-lg shadow-lg"
          :style="{ width: '90%', maxWidth: '600px' }">

          <!-- Detail Content -->
          <div v-if="selectedItem && !isDetailLoading" class="p-4 md:p-6">
            <div class="mb-6">
              <div class="flex items-center space-x-3">
                <Avatar :name="selectedItem.from.username" :id="selectedItem.from.id" />
                <div>
                  <h2 class="text-xl font-bold text-green-600">{{ selectedItem.from.name }}
                  </h2>
                  <p class="text-sm text-gray-500">@{{ selectedItem.from.username }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-500">Date</span>
                <span class="font-medium text-gray-800">{{ formatDate(selectedItem.createdAt)
                }}</span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-500">Status</span>
                <span :class="[
                  'inline-block px-2 py-1 text-xs rounded-full',
                  selectedItem.status === 'READ'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-green-100 text-green-800'
                ]">
                  {{ selectedItem.status }}
                </span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-500">Message</span>
                <span class="font-medium text-gray-800 whitespace-pre-line">{{
                  selectedItem.message
                }}</span>
              </div>
            </div>

            <div class="flex justify-end mt-6 space-x-3">
              <Button v-if="isAdmin" label="Reply" icon="pi pi-reply"
                class="p-button-outlined text-gray-700 border-gray-400 hover:bg-gray-100" />
              <Button v-if="isAdmin" icon="pi pi-trash" label="Delete"
                class="p-button-outlined p-button-danger text-red-600 border-red-400 hover:bg-red-50"
                @click="deleteNotification(selectedItem.id)" />
              <Button label="Close" @click="closeDialog('view')"
                class="p-button-outlined text-gray-700 border-gray-400 hover:bg-gray-100" />
            </div>
          </div>

          <!-- Loading state in dialog -->
          <div v-if="isDetailLoading" class="p-4 space-y-4">
            <div class="flex items-start space-x-4 mb-6">
              <Skeleton shape="circle" size="3.5rem" class="bg-gray-300"></Skeleton>
              <div class="flex-1">
                <Skeleton width="60%" height="1.5rem" class="mb-2 bg-gray-300"></Skeleton>
                <Skeleton width="40%" height="1rem" class="bg-gray-300"></Skeleton>
              </div>
            </div>
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-300"></Skeleton>
            <Skeleton width="60%" height="1.5rem" class="mb-4 bg-gray-300"></Skeleton>
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-300"></Skeleton>
            <Skeleton width="100%" height="1.5rem" class="mb-2 bg-gray-300"></Skeleton>
            <Skeleton width="90%" height="1.5rem" class="mb-2 bg-gray-300"></Skeleton>
            <div class="flex justify-end mt-6">
              <Skeleton width="100px" height="2.5rem" class="bg-gray-300"></Skeleton>
            </div>
          </div>
        </Dialog>

        <!-- New Notification Dialog -->
        <Dialog v-model:visible="dialogs.create" modal header="Create New Notification"
          class="bg-white text-gray-900 border border-gray-200 rounded-lg shadow-lg"
          :style="{ width: '90%', maxWidth: '500px' }">

          <!-- Dialog Content -->
          <div class="p-4">
            <!-- Username Input (Admin only) -->
            <div v-if="isAdmin" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Recipient User ID
                (Optional)</label>
              <div class="flex items-center space-x-2">
                <InputText v-model="newNotification.to" type="number" placeholder="Enter user ID" class="flex-1"
                  :class="{ 'p-invalid': newNotification.to !== null && newNotification.to.length > 0 && parseInt(newNotification.to) <= 0 }" />
              </div>
              <div class="text-xs text-gray-500 mt-2">
                Leave empty to create a notification for all administrators.
              </div>
            </div>

            <!-- Message -->
            <div class="mb-4">
              <label for="message" class="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <Textarea id="message" v-model="newNotification.message" rows="5" class="w-full"
                placeholder="Type your message here..." />
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 mt-6">
              <Button label="Cancel" class="p-button-outlined text-gray-700 border-gray-400 hover:bg-gray-100"
                @click="cancelNewNotification" />
              <Button label="Send" icon="pi pi-send" class="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                @click="sendNotification" />
            </div>
          </div>
        </Dialog>

        <ConfirmDialog></ConfirmDialog>
      </div>
    </div>

    <FloatingButton icon="+" @click="openNewNotificationDialog" />
  </MenuLayout>
</template>

<style scoped>
:deep(.p-dialog) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

:deep(.p-dialog-header) {
  background-color: #fff;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

:deep(.p-dialog-content) {
  background-color: #fff;
  color: #1f2937;
  padding: 1rem 1.5rem;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

:deep(.p-paginator) {
  background: #fff;
  border: 1px solid #e5e7eb;
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev) {
  color: #6b7280;
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
  color: #059669;
  background: #f0fdfa;
}

:deep(.p-inputtext),
:deep(.p-textarea) {
  background-color: #fff;
  border: 1px solid #d1d5db;
  color: #111827;
}

:deep(.p-inputtext:focus),
:deep(.p-textarea:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.2);
}

:deep(.p-inputtext::placeholder),
:deep(.p-textarea::placeholder) {
  color: #9ca3af;
}

:deep(.p-button.p-button-text) {
  color: #6b7280;
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(0, 0, 0, 0.03);
  color: #10b981;
}

:deep(.p-skeleton) {
  background-color: #e5e7eb;
  background-image: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
  opacity: 0.7;
}

:deep(.p-confirm-dialog .p-dialog-content) {
  background-color: #fff;
  color: #1f2937;
}

:deep(.p-confirm-dialog .p-dialog-footer) {
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
}

:deep(.p-confirm-dialog .p-dialog-header) {
  background-color: #fff;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  font-weight: 600;
}

:deep(.p-confirm-dialog .p-confirm-dialog-icon) {
  color: #f59e0b;
}
</style>
