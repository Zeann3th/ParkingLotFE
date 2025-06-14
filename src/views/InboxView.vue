<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import type { Notification } from '@/types';
import { notificationService } from '@/services/notification.service';
import { formatDate, truncateStr } from '@/utils';
import Title from '@/components/Title.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import { useState } from '@/composables/state';
import Avatar from '@/components/Avatar.vue';
import InputText from '@/components/InputText.vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trash2, X, Send } from 'lucide-vue-next';

import { useAuth } from '@/composables/auth';
import { Bell } from 'lucide-vue-next';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Notification>();
const { role } = useAuth();

const newNotification = ref({
  to: '' as string,
  message: ''
});

const getAllNotifications = async () => {
  isLoading.value = true;
  try {
    const response = await notificationService.getAll(page.value, limit.value, { cache: !isMutated.value });
    if (response.message) {
      toast.error(response.message);
    } else {
      itemList.value = response.data;
      maxPage.value = response.maxPage;
    }
  } catch (error) {
    toast.error(error?.toString() ?? 'Error loading notifications');
  } finally {
    isLoading.value = false;
  }
};

const getNotificationDetail = async (id: number) => {
  isDetailLoading.value = true;
  openDialog("view");

  try {
    const response = await notificationService.getById(id);
    selectedItem.value = response;

    if (response.status === 'PENDING') {
      await readNotification(id);
    }
  } catch (error) {
    toast.error(error?.toString() ?? 'Error loading notification');
  } finally {
    isDetailLoading.value = false;
  }
};

const readNotification = async (id: number) => {
  try {
    await notificationService.update(id)
    refreshData();
  } catch (error) {
    toast.error(error?.toString() ?? 'Error updating notification');
  }
};

const deleteNotification = async (id: number) => {
  if (!confirm('Are you sure you want to delete this notification?')) return;
  try {
    await notificationService.delete(id);
    refreshData();
    toast.success('Notification deleted');
    closeDialog('view');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error deleting notification');
  }
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
    toast.warning('Please enter a message');
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
    refreshData();
    toast.success('Notification sent');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error sending notification');
  }
};

const isAdmin = computed(() => role.value === 'ADMIN');
const isPrivilleged = computed(() => role.value === 'ADMIN' || role.value === 'SECURITY');

const refreshData = () => {
  isMutated.value = true;
  getAllNotifications();
}

const cancelNewNotification = () => {
  newNotification.value = { to: '', message: '' };
  closeDialog('create');
};

onMounted(() => {
  getAllNotifications();
});
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-white px-4 md:px-6 py-8">
      <div class="max-w-4xl mx-auto">
        <Title name="Notifications" @click="getAllNotifications" />

        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="space-y-3">
          <Skeleton v-for="i in 4" :key="i" class="h-16 w-full rounded" />
        </div>

        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div v-for="notification in itemList" :key="notification.id" :class="[
            'bg-white hover:bg-blue-50/30 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 shadow border',
            notification.status === 'READ'
              ? 'border-gray-200 opacity-80'
              : 'border-blue-400'
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
                  <Badge variant="secondary" class="bg-green-100 text-green-800 border-green-200">New</Badge>
                </div>
              </div>
            </div>

            <!-- Delete button (Admin only) -->
            <div v-if="isAdmin" class="ml-2 flex-shrink-0" @click.stop>
              <Button variant="destructive" size="icon" @click="deleteNotification(notification.id)">
                <Trash2 class="w-4 h-4" />
                <span class="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && itemList.length === 0">
          <EmptyMessage :icon="Bell" message="No Notifications Found" @click="getAllNotifications" />
        </div>

        <!-- Notification Detail Dialog -->
        <Dialog v-model:open="dialogs.view">
          <DialogContent class="max-w-lg w-full p-0">
            <div class="p-6">
              <div v-if="isDetailLoading">
                <Skeleton class="h-6 w-2/5 mb-4" />
                <Skeleton class="h-4 w-full mb-2" />
                <Skeleton class="h-16 w-full mb-4" />
                <Skeleton class="h-5 w-3/5" />
              </div>
              <div v-else-if="selectedItem">
                <DialogHeader>
                  <div class="flex items-center space-x-3 mb-4">
                    <Avatar :name="selectedItem.from.username" :id="selectedItem.from.id" />
                    <div>
                      <DialogTitle class="text-xl font-bold text-blue-700">{{ selectedItem.from.name }}</DialogTitle>
                      <p class="text-sm text-gray-500">@{{ selectedItem.from.username }}</p>
                    </div>
                  </div>
                </DialogHeader>
                <div class="space-y-4">
                  <div class="flex flex-col space-y-1">
                    <span class="text-sm text-gray-500">Date</span>
                    <span class="font-medium text-gray-800">{{ formatDate(selectedItem.createdAt) }}</span>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <span class="text-sm text-gray-500">Status</span>
                    <Badge :variant="selectedItem.status === 'READ' ? 'outline' : 'secondary'"
                           :class="selectedItem.status === 'READ'
                        ? 'bg-gray-200 text-gray-800 border-gray-200'
                        : 'bg-green-100 text-green-800 border-green-200'">
                      {{ selectedItem.status }}
                    </Badge>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <span class="text-sm text-gray-500">Message</span>
                    <span class="font-medium text-gray-800 whitespace-pre-line">{{ selectedItem.message }}</span>
                  </div>
                </div>
                <DialogFooter class="flex justify-end mt-6 space-x-3">
                  <Button v-if="isAdmin" variant="destructive" @click="deleteNotification(selectedItem.id)">
                    <Trash2 class="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button variant="outline" @click="closeDialog('view')">
                    <X class="w-4 h-4 mr-1" />
                    Close
                  </Button>
                </DialogFooter>
              </div>
              <div v-else class="text-center text-red-500 py-4">
                Failed to load notification details.
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <!-- New Notification Dialog -->
        <Dialog v-model:open="dialogs.create">
          <DialogContent class="max-w-md w-full p-0">
            <div class="p-6">
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
              </DialogHeader>
              <div v-if="isPrivilleged" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Recipient User ID (Optional)</label>
                <div class="flex items-center space-x-2">
                  <InputText v-model="newNotification.to" inputId="userId" placeholder="Enter user ID" />
                </div>
                <div class="text-xs text-gray-500 mt-2">
                  Leave empty to create a notification for all administrators.
                </div>
              </div>
              <div class="mb-4">
                <label for="message" class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea id="message" v-model="newNotification.message" rows="5"
                          class="w-full bg-white text-black border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Type your message here..." />
              </div>
              <DialogFooter class="flex justify-end space-x-3 mt-6">
                <Button variant="outline" @click="cancelNewNotification">
                  <X class="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button class="bg-blue-600 hover:bg-blue-700 text-white shadow" @click="sendNotification">
                  <Send class="w-4 h-4 mr-1" />
                  Send
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <FloatingButton icon="+" @click="openNewNotificationDialog" />
  </MenuLayout>
</template>