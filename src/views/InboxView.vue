<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue';
import { useAuth } from '@/composables/auth';
import axios from 'axios';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { memoryStorage } from '@/storage';
import { useToast } from 'primevue';
import { useRoute, useRouter } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';

interface Notification {
  id: number;
  from: {
    id: number;
    username: string;
    name: string
  };
  message: string;
  status: string;
  createdAt: string;
}

interface Response {
  count: number;
  data: Notification[];
}

const { role } = useAuth();
const notifications: Ref<Notification[]> = ref([]);
const selectedNotification = ref<Notification | null>(null);
const loading = ref(true);
const detailsLoading = ref(false);
const showDetailDialog = ref<boolean>(false);
const showNewNotificationDialog = ref<boolean>(false);
const toast = useToast();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

const newNotification = ref({
  to: '' as string,
  message: ''
});

const totalPages = ref(1);
const currentPage = ref(1);
const rowsPerPage = ref(10);

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const response = await axios.get<Response>(
      '/notifications',
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
    notifications.value = response.data.data;
    totalPages.value = response.data.count;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load notifications',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  currentPage.value = parseInt(newQuery.page as string) || 1;
  fetchNotifications();
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

const fetchNotificationDetails = async (id: number) => {
  detailsLoading.value = true;
  showDetailDialog.value = true;

  try {
    const response = await axios.get<Notification>(`/notifications/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedNotification.value = response.data;

    // Mark notification as read if it's pending
    if (response.data.status === 'PENDING') {
      await markAsRead(id);
    }
  } catch (error) {
    console.error('Error fetching notification details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load notification details',
      life: 3000,
    });
  } finally {
    detailsLoading.value = false;
  }
};

const markAsRead = async (id: number) => {
  try {
    await axios.patch(`/notifications/${id}`,
      { action: "READ" },
      {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
      }
    );

    // Update local notification status in list
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index].status = 'READ';
    }

    // Update selected notification if it's open
    if (selectedNotification.value && selectedNotification.value.id === id) {
      selectedNotification.value.status = 'READ';
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // We don't show toast here to avoid disrupting the user experience
  }
};

const closeDialog = () => {
  showDetailDialog.value = false;
};

const deleteNotification = (id: number) => {
  confirm.require({
    message: 'Are you sure you want to delete this notification?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await axios.delete(`/notifications/${id}`, {
          headers: {
            Authorization: `Bearer ${memoryStorage.getToken()}`,
          },
        });

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Notification deleted successfully',
          life: 3000,
        });

        // Remove from local list and close dialog if open
        notifications.value = notifications.value.filter(n => n.id !== id);
        if (showDetailDialog.value && selectedNotification.value?.id === id) {
          showDetailDialog.value = false;
        }
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
  showNewNotificationDialog.value = true;
  // Reset form
  newNotification.value = {
    to: '',
    message: ''
  };
};

const sendNotification = async () => {
  if (!newNotification.value.message.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please enter a message',
      life: 3000,
    });
    return;
  }

  try {
    const payload: { message: string; to?: number } = {
      message: newNotification.value.message
    };

    // Only add 'to' field if a username was entered
    if (newNotification.value.to.trim()) {
      payload.to = parseInt(newNotification.value.to);
    }

    await axios.post('/notifications', payload, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Notification sent successfully',
      life: 3000,
    });

    // Reset form with empty string
    newNotification.value = { to: '', message: '' };
    showNewNotificationDialog.value = false;

    // Refresh notifications list
    fetchNotifications();
  } catch (error) {
    console.error('Error sending notification:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send notification',
      life: 3000,
    });
  }
};

onMounted(() => {
  if (!route.query.page) {
    updateRouteParams();
  }
});

const isAdmin = computed(() => role.value === 'ADMIN');

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const truncateMessage = (message: string, maxLength = 90) => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

const getInitials = (name: string) => {
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getAvatarColor = (userId: number) => {
  const colors = [
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC',
    '#81C784', '#AED581', '#DCE775', '#FFF176', '#FFD54F'
  ];
  return colors[userId % colors.length];
};

const cancelNewNotification = () => {
  newNotification.value = { to: '', message: '' };
  showNewNotificationDialog.value = false;
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-gray-900 p-4 md:p-6 text-gray-100">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl md:text-3xl font-bold text-green-400">Inbox</h1>
          <Button icon="pi pi-refresh" class="p-button-text text-gray-400 hover:text-green-400"
            @click="fetchNotifications" />
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 5" :key="n"
            class="bg-gray-800 bg-opacity-80 rounded-lg p-4 flex items-start space-x-4 shadow-sm backdrop-blur-sm">
            <Skeleton shape="circle" size="3rem" class="bg-gray-700 flex-shrink-0"></Skeleton>
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Skeleton width="30%" height="1.2rem" class="bg-gray-700"></Skeleton>
                <Skeleton width="20%" height="1rem" class="bg-gray-700"></Skeleton>
              </div>
              <Skeleton width="90%" height="1rem" class="mb-2 bg-gray-700"></Skeleton>
              <Skeleton width="75%" height="1rem" class="bg-gray-700"></Skeleton>
            </div>
          </div>
        </div>

        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div v-for="notification in notifications" :key="notification.id" :class="[
            'bg-gray-800 bg-opacity-80 hover:bg-gray-700 hover:bg-opacity-90 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 shadow-sm border backdrop-blur-sm',
            notification.status === 'READ' ? 'border-gray-700 opacity-80' : 'border-green-700'
          ]">
            <div class="flex-1 flex items-start cursor-pointer" @click="fetchNotificationDetails(notification.id)">
              <!-- Avatar -->
              <Avatar :label="getInitials(notification.from.name)" class="flex-shrink-0 mr-4"
                :style="{ backgroundColor: getAvatarColor(notification.from.id) }" />

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between mb-1">
                  <div class="font-medium text-gray-100">{{ notification.from.name }}</div>
                  <div class="text-xs text-gray-400">{{ formatDate(notification.createdAt) }}</div>
                </div>
                <div class="text-xs text-gray-400 mb-1">@{{ notification.from.username }}</div>
                <div :class="['text-sm', notification.status === 'READ' ? 'text-gray-400' : 'text-gray-300']">
                  {{ truncateMessage(notification.message) }}
                </div>
                <div v-if="notification.status === 'PENDING'" class="mt-2">
                  <span class="inline-block px-2 py-1 text-xs bg-green-900 text-green-300 rounded-full">New</span>
                </div>
              </div>
            </div>

            <!-- Delete button (Admin only) -->
            <div v-if="isAdmin" class="ml-2 flex-shrink-0" @click.stop>
              <Button icon="pi pi-trash"
                class="p-button-text p-button-rounded p-button-sm text-gray-400 hover:text-red-400"
                @click="deleteNotification(notification.id)" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && notifications.length === 0"
          class="text-center py-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
          <i class="pi pi-inbox text-6xl text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-400">Your inbox is empty</p>
          <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600"
            @click="fetchNotifications" />
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

        <!-- Notification Detail Dialog -->
        <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
          class="bg-gray-800 bg-opacity-90 text-gray-100 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm"
          :style="{ width: '90%', maxWidth: '600px' }">
          <div v-if="selectedNotification && !detailsLoading" class="p-4 md:p-6">
            <div class="mb-6">
              <div class="flex items-center space-x-3">
                <Avatar :label="getInitials(selectedNotification.from.name)" class="flex-shrink-0" size="large"
                  :style="{ backgroundColor: getAvatarColor(selectedNotification.from.id) }" />
                <div>
                  <h2 class="text-xl font-bold text-green-400">{{ selectedNotification.from.name }}</h2>
                  <p class="text-sm text-gray-400">@{{ selectedNotification.from.username }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Date</span>
                <span class="font-medium text-gray-100">{{ formatDate(selectedNotification.createdAt) }}</span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Status</span>
                <span :class="[
                  'inline-block px-2 py-1 text-xs rounded-full',
                  selectedNotification.status === 'READ' ? 'bg-gray-700 text-gray-300' : 'bg-green-900 text-green-300'
                ]">
                  {{ selectedNotification.status }}
                </span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-400">Message</span>
                <span class="font-medium text-gray-100 whitespace-pre-line">{{ selectedNotification.message }}</span>
              </div>
            </div>

            <div class="flex justify-end mt-6 space-x-3">
              <Button v-if="isAdmin" label="Reply" icon="pi pi-reply"
                class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
              <Button v-if="isAdmin" icon="pi pi-trash" label="Delete"
                class="p-button-outlined p-button-danger text-red-300 hover:text-red-100 border-red-800 hover:border-red-700"
                @click="deleteNotification(selectedNotification.id)" />
              <Button label="Close" @click="closeDialog"
                class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
            </div>
          </div>

          <!-- Loading state in dialog -->
          <div v-if="detailsLoading" class="p-4 space-y-4">
            <div class="flex items-start space-x-4 mb-6">
              <Skeleton shape="circle" size="3.5rem" class="bg-gray-700"></Skeleton>
              <div class="flex-1">
                <Skeleton width="60%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
                <Skeleton width="40%" height="1rem" class="bg-gray-700"></Skeleton>
              </div>
            </div>
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700"></Skeleton>
            <Skeleton width="60%" height="1.5rem" class="mb-4 bg-gray-700"></Skeleton>
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700"></Skeleton>
            <Skeleton width="100%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
            <Skeleton width="90%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
            <div class="flex justify-end mt-6">
              <Skeleton width="100px" height="2.5rem" class="bg-gray-700"></Skeleton>
            </div>
          </div>
        </Dialog>

        <!-- New Notification Dialog -->
        <Dialog v-model:visible="showNewNotificationDialog" modal header="Create New Notification"
          class="bg-gray-800 bg-opacity-90 text-gray-100 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm"
          :style="{ width: '90%', maxWidth: '500px' }">
          <div class="p-4">
            <!-- Username Input (Admin only) -->
            <div v-if="isAdmin" class="mb-4">
              <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Username (Optional)</label>
              <div class="flex items-center space-x-2">
                <span class="text-gray-400">@</span>
                <InputText v-model="newNotification.to" type="number" placeholder="Enter user ID" class="flex-1"
                  :class="{ 'p-invalid': newNotification.to !== null && parseInt(newNotification.to) <= 0 }" />
              </div>
              <div class="text-xs text-gray-400 mt-2">
                Leave empty to create a notification that will be sent to all administrators.
              </div>
            </div>

            <!-- Message -->
            <div class="mb-4">
              <label for="message" class="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <Textarea id="message" v-model="newNotification.message" rows="5" class="w-full"
                placeholder="Type your message here..." />
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 mt-6">
              <Button label="Cancel" class="p-button-outlined text-gray-300 border-gray-600"
                @click="cancelNewNotification" />
              <Button label="Send" icon="pi pi-send" class="bg-green-600 hover:bg-green-700 border-green-600"
                @click="sendNotification" />
            </div>
          </div>
        </Dialog>

        <!-- Confirm Dialog -->
        <ConfirmDialog></ConfirmDialog>
      </div>
    </div>

    <!-- Floating Action Button for new notification -->
    <button @click="openNewNotificationDialog"
      class="floating-btn bg-green-600 hover:bg-green-700 text-white shadow-lg">
      <i class="pi pi-plus"></i>
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

:deep(.p-dialog-header) {
  background-color: rgba(31, 41, 55, 0.9);
  color: #f3f4f6;
  border-bottom: 1px solid rgba(55, 65, 81, 0.8);
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

:deep(.p-textarea) {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

:deep(.p-textarea:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.2);
}

:deep(.p-confirm-dialog .p-dialog-content) {
  background-color: rgba(31, 41, 55, 0.95);
  color: #f3f4f6;
}

:deep(.p-confirm-dialog .p-dialog-footer) {
  background-color: rgba(31, 41, 55, 0.95);
  border-top: 1px solid rgba(55, 65, 81, 0.8);
}

:deep(.p-confirm-dialog .p-dialog-header) {
  background-color: rgba(31, 41, 55, 0.95);
  border-bottom: 1px solid rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}
</style>
