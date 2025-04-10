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
        // Assuming 'to' should be treated as a number (User ID) based on original InputText type='number'
        const toValue = parseInt(newNotification.value.to);
        if (!isNaN(toValue) && toValue > 0) {
            payload.to = toValue;
        } else {
             // Optionally handle invalid input (e.g., show toast)
             console.warn('Invalid User ID entered');
             // Consider preventing send or showing a warning if ID is required and invalid
        }
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
  // fetchNotifications is called by the watch effect on route.query
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
  // Keep colors vibrant enough for both light and dark backgrounds
  const colors = [
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC',
    '#81C784', '#AED581', '#FFB74D', '#FF8A65', '#A1887F'
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
    <!-- Base theme classes -->
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6 text-gray-800 dark:text-gray-100">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">Inbox</h1>
          <Button icon="pi pi-refresh"
            class="p-button-text text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
            @click="fetchNotifications" />
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 5" :key="n"
            class="bg-white dark:bg-gray-800 dark:bg-opacity-80 rounded-lg p-4 flex items-start space-x-4 shadow border border-gray-200 dark:border-transparent dark:backdrop-blur-sm">
            <Skeleton shape="circle" size="3rem" class="bg-gray-300 dark:bg-gray-700 flex-shrink-0"></Skeleton>
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Skeleton width="30%" height="1.2rem" class="bg-gray-300 dark:bg-gray-700"></Skeleton>
                <Skeleton width="20%" height="1rem" class="bg-gray-300 dark:bg-gray-700"></Skeleton>
              </div>
              <Skeleton width="90%" height="1rem" class="mb-2 bg-gray-300 dark:bg-gray-700"></Skeleton>
              <Skeleton width="75%" height="1rem" class="bg-gray-300 dark:bg-gray-700"></Skeleton>
            </div>
          </div>
        </div>

        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div v-for="notification in notifications" :key="notification.id" :class="[
            'bg-white dark:bg-gray-800 dark:bg-opacity-80 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-90 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 shadow border dark:backdrop-blur-sm',
            notification.status === 'READ'
              ? 'border-gray-200 dark:border-gray-700 opacity-80 dark:opacity-70'
              : 'border-green-500 dark:border-green-700'
          ]">
            <div class="flex-1 flex items-start cursor-pointer" @click="fetchNotificationDetails(notification.id)">
              <!-- Avatar -->
              <Avatar :label="getInitials(notification.from.name)" class="flex-shrink-0 mr-4"
                :style="{ backgroundColor: getAvatarColor(notification.from.id), color: '#fff' }" /> <!-- Ensure text is white -->

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between mb-1">
                  <div class="font-medium text-gray-900 dark:text-gray-100">{{ notification.from.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(notification.createdAt) }}</div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">@{{ notification.from.username }}</div>
                <div :class="['text-sm', notification.status === 'READ' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300']">
                  {{ truncateMessage(notification.message) }}
                </div>
                <div v-if="notification.status === 'PENDING'" class="mt-2">
                  <span class="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">New</span>
                </div>
              </div>
            </div>

            <!-- Delete button (Admin only) -->
            <div v-if="isAdmin" class="ml-2 flex-shrink-0" @click.stop>
              <Button icon="pi pi-trash"
                class="p-button-text p-button-rounded p-button-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                @click="deleteNotification(notification.id)" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && notifications.length === 0"
          class="text-center py-12 bg-white dark:bg-gray-800 dark:bg-opacity-80 rounded-lg shadow border border-gray-200 dark:border-transparent dark:backdrop-blur-sm">
          <i class="pi pi-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-500 dark:text-gray-400">Your inbox is empty</p>
          <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600 text-white"
            @click="fetchNotifications" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center">
           <!-- Apply theme classes to the Paginator itself -->
           <Paginator :rows="1" :totalRecords="totalPages" :first="currentPage - 1" @page="onPageChange"
             :rowsPerPageOptions="[]" template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
             class="bg-white dark:bg-gray-800 dark:bg-opacity-80 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:backdrop-blur-sm">
              <template #start>
                 <!-- Ensure text color matches theme -->
                <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">Page {{ currentPage }} of {{ totalPages }}</span>
              </template>
          </Paginator>
        </div>

        <!-- Notification Detail Dialog -->
        <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
          # Apply theme classes here
          class="dialog-themed bg-white dark:bg-gray-800 dark:bg-opacity-90 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:backdrop-blur-sm"
          :style="{ width: '90%', maxWidth: '600px' }">

          <!-- Detail Content -->
          <div v-if="selectedNotification && !detailsLoading" class="p-4 md:p-6">
            <div class="mb-6">
              <div class="flex items-center space-x-3">
                <Avatar :label="getInitials(selectedNotification.from.name)" class="flex-shrink-0" size="large"
                  :style="{ backgroundColor: getAvatarColor(selectedNotification.from.id), color: '#fff' }" />
                <div>
                  <h2 class="text-xl font-bold text-green-600 dark:text-green-400">{{ selectedNotification.from.name }}</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">@{{ selectedNotification.from.username }}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-500 dark:text-gray-400">Date</span>
                <span class="font-medium text-gray-800 dark:text-gray-100">{{ formatDate(selectedNotification.createdAt) }}</span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span :class="[
                  'inline-block px-2 py-1 text-xs rounded-full',
                  selectedNotification.status === 'READ'
                   ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                   : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                ]">
                  {{ selectedNotification.status }}
                </span>
              </div>

              <div class="flex flex-col space-y-1">
                <span class="text-sm text-gray-500 dark:text-gray-400">Message</span>
                <span class="font-medium text-gray-800 dark:text-gray-100 whitespace-pre-line">{{ selectedNotification.message }}</span>
              </div>
            </div>

            <div class="flex justify-end mt-6 space-x-3">
              <!-- Update Button Classes -->
               <Button v-if="isAdmin" label="Reply" icon="pi pi-reply"
                 class="p-button-outlined text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" />
               <Button v-if="isAdmin" icon="pi pi-trash" label="Delete"
                 class="p-button-outlined p-button-danger text-red-600 dark:text-red-300 border-red-400 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/50"
                 @click="deleteNotification(selectedNotification.id)" />
               <Button label="Close" @click="closeDialog"
                 class="p-button-outlined text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" />
            </div>
          </div>

          <!-- Loading state in dialog -->
          <div v-if="detailsLoading" class="p-4 space-y-4">
            <div class="flex items-start space-x-4 mb-6">
              <Skeleton shape="circle" size="3.5rem" class="bg-gray-300 dark:bg-gray-700"></Skeleton>
              <div class="flex-1">
                <Skeleton width="60%" height="1.5rem" class="mb-2 bg-gray-300 dark:bg-gray-700"></Skeleton>
                <Skeleton width="40%" height="1rem" class="bg-gray-300 dark:bg-gray-700"></Skeleton>
              </div>
            </div>
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-300 dark:bg-gray-700"></Skeleton>
            <Skeleton width="60%" height="1.5rem" class="mb-4 bg-gray-300 dark:bg-gray-700"></Skeleton>
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-300 dark:bg-gray-700"></Skeleton>
            <Skeleton width="100%" height="1.5rem" class="mb-2 bg-gray-300 dark:bg-gray-700"></Skeleton>
            <Skeleton width="90%" height="1.5rem" class="mb-2 bg-gray-300 dark:bg-gray-700"></Skeleton>
            <div class="flex justify-end mt-6">
              <Skeleton width="100px" height="2.5rem" class="bg-gray-300 dark:bg-gray-700"></Skeleton>
            </div>
          </div>
        </Dialog>

        <!-- New Notification Dialog -->
        <Dialog v-model:visible="showNewNotificationDialog" modal header="Create New Notification"
           # Apply theme classes here
           class="dialog-themed bg-white dark:bg-gray-800 dark:bg-opacity-90 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:backdrop-blur-sm"
           :style="{ width: '90%', maxWidth: '500px' }">

          <!-- Dialog Content -->
          <div class="p-4">
            <!-- Username Input (Admin only) -->
            <div v-if="isAdmin" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient User ID (Optional)</label>
              <div class="flex items-center space-x-2">
                 <!-- Theme InputText via :deep or add class -->
                 <InputText v-model="newNotification.to" type="number" placeholder="Enter user ID" class="flex-1 input-themed"
                    :class="{ 'p-invalid': newNotification.to !== null && newNotification.to.length > 0 && parseInt(newNotification.to) <= 0 }" />
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Leave empty to create a notification for all administrators.
              </div>
            </div>

            <!-- Message -->
            <div class="mb-4">
              <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
               <!-- Theme Textarea via :deep or add class -->
               <Textarea id="message" v-model="newNotification.message" rows="5" class="w-full textarea-themed"
                 placeholder="Type your message here..." />
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 mt-6">
              <!-- Update Button Classes -->
               <Button label="Cancel"
                 class="p-button-outlined text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                 @click="cancelNewNotification" />
               <Button label="Send" icon="pi pi-send"
                 class="bg-green-600 hover:bg-green-700 border-green-600 text-white"
                 @click="sendNotification" />
            </div>
          </div>
        </Dialog>

        <!-- Confirm Dialog -->
         <!-- Theming for ConfirmDialog is primarily handled through scoped CSS :deep selectors -->
        <ConfirmDialog></ConfirmDialog>
      </div>
    </div>

    <!-- Floating Action Button -->
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
  z-index: 99; /* Ensure it's above other content */
}

/* --- Light Mode Base Styles --- */
:deep(.p-dialog) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); /* Lighter shadow */
}

/* Use Tailwind classes on the dialog directly where possible (added dialog-themed class) */
/* Base styles for elements within Dialog using :deep if Tailwind classes aren't enough */
:deep(.dialog-themed .p-dialog-header) {
   background-color: #fff; /* Light bg */
   color: #1f2937; /* Dark text */
   border-bottom: 1px solid #e5e7eb; /* Light border */
   padding: 1rem 1.5rem; /* PrimeVue defaults, adjust if needed */
   border-top-left-radius: 0.5rem; /* Match parent */
   border-top-right-radius: 0.5rem; /* Match parent */
}
:deep(.dialog-themed .p-dialog-content) {
   background-color: #fff; /* Light bg */
   color: #1f2937; /* Dark text */
   padding: 1rem 1.5rem; /* PrimeVue defaults */
   border-bottom-left-radius: 0.5rem; /* Match parent */
   border-bottom-right-radius: 0.5rem; /* Match parent */
}

:deep(.p-paginator) {
  background: #fff; /* Light bg */
  border: 1px solid #e5e7eb; /* Light border */
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev) {
  color: #6b7280; /* Gray text */
  border: none;
  background: transparent;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: #10b981; /* Green */
  color: white;
}

:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover),
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover) {
  color: #059669; /* Darker green */
  background: #f0fdfa; /* Very light green bg */
}

/* Theme input/textarea directly or add class + :deep */
:deep(.input-themed),
:deep(.p-inputtext) {
  background-color: #fff; /* Light bg */
  border: 1px solid #d1d5db; /* Gray border */
  color: #111827; /* Darker text */
}
:deep(.textarea-themed),
:deep(.p-textarea) {
  background-color: #fff; /* Light bg */
  border: 1px solid #d1d5db; /* Gray border */
  color: #111827; /* Darker text */
}

:deep(.input-themed:focus),
:deep(.p-inputtext:focus),
:deep(.textarea-themed:focus),
:deep(.p-textarea:focus) {
  border-color: #10b981; /* Green focus */
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.2); /* Green focus ring */
}
/* Input/Textarea placeholder color */
:deep(.input-themed::placeholder),
:deep(.p-inputtext::placeholder),
:deep(.textarea-themed::placeholder),
:deep(.p-textarea::placeholder) {
  color: #9ca3af; /* Lighter gray for placeholder */
}


:deep(.p-button.p-button-text) {
  color: #6b7280; /* Gray text */
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(0, 0, 0, 0.03); /* Subtle dark hover */
  color: #10b981; /* Green */
}

/* Base Skeleton for Light Mode */
:deep(.p-skeleton) {
   background-color: #e5e7eb; /* Light gray base */
   background-image: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
   opacity: 0.7;
}

:deep(.p-confirm-dialog .p-dialog-content) {
   background-color: #fff; /* Light bg */
   color: #1f2937; /* Dark text */
}
:deep(.p-confirm-dialog .p-dialog-footer) {
  background-color: #f9fafb; /* Slightly off-white footer bg */
  border-top: 1px solid #e5e7eb; /* Light border */
   padding: 1rem 1.5rem;
}
:deep(.p-confirm-dialog .p-dialog-header) {
   background-color: #fff; /* Light bg */
   color: #1f2937; /* Dark text */
   border-bottom: 1px solid #e5e7eb; /* Light border */
   padding: 1rem 1.5rem;
   font-weight: 600;
}
:deep(.p-confirm-dialog .p-confirm-dialog-icon) {
  color: #f59e0b; /* Amber color for warning icon */
}


/* --- Dark Mode Overrides (Applied when html has 'dark' class) --- */
/* Use html.dark to increase specificity over base PrimeVue styles */

/* Re-apply original dark :deep styles */
html.dark :deep(.p-dialog) {
   box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

html.dark :deep(.dialog-themed .p-dialog-header) {
   background-color: rgba(31, 41, 55, 0.9); /* Dark Gray Header */
   color: #f3f4f6; /* Light Text */
   border-bottom: 1px solid rgba(55, 65, 81, 0.8);
}

html.dark :deep(.dialog-themed .p-dialog-content) {
  background-color: rgba(31, 41, 55, 0.9); /* Dark Gray Content */
  color: #f3f4f6; /* Light text */
  /* border radius is handled by the main element now */
}

html.dark :deep(.p-dialog-mask) {
   background-color: rgba(0, 0, 0, 0.7);
}

html.dark :deep(.p-paginator) {
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.8);
}

html.dark :deep(.p-paginator .p-paginator-page),
html.dark :deep(.p-paginator .p-paginator-next),
html.dark :deep(.p-paginator .p-paginator-last),
html.dark :deep(.p-paginator .p-paginator-first),
html.dark :deep(.p-paginator .p-paginator-prev) {
  color: #9ca3af; /* Light gray */
}

html.dark :deep(.p-paginator .p-paginator-page.p-highlight) {
  background: #10b981; /* Green */
  color: white;
}

html.dark :deep(.p-paginator .p-paginator-page:not(.p-highlight):hover),
html.dark :deep(.p-paginator .p-paginator-next:hover),
html.dark :deep(.p-paginator .p-paginator-last:hover),
html.dark :deep(.p-paginator .p-paginator-first:hover),
html.dark :deep(.p-paginator .p-paginator-prev:hover) {
  color: #10b981; /* Green */
  background: rgba(16, 185, 129, 0.1); /* Transparent green */
}

html.dark :deep(.input-themed),
html.dark :deep(.p-inputtext),
html.dark :deep(.textarea-themed),
html.dark :deep(.p-textarea) {
  background-color: rgba(55, 65, 81, 0.8); /* Dark input bg */
  border-color: rgba(75, 85, 99, 0.8);  /* Dark border */
  color: #f3f4f6; /* Light text */
}

/* Dark mode placeholder color */
html.dark :deep(.input-themed::placeholder),
html.dark :deep(.p-inputtext::placeholder),
html.dark :deep(.textarea-themed::placeholder),
html.dark :deep(.p-textarea::placeholder) {
  color: #9ca3af; /* Slightly lighter gray for placeholder in dark */
}

html.dark :deep(.input-themed:focus),
html.dark :deep(.p-inputtext:focus),
html.dark :deep(.textarea-themed:focus),
html.dark :deep(.p-textarea:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.2);
}

html.dark :deep(.p-button.p-button-text) {
  color: #9ca3af;
}

html.dark :deep(.p-button.p-button-text:hover) {
  background: rgba(255, 255, 255, 0.05);
  color: #10b981;
}

/* Skeleton for Dark Mode */
html.dark :deep(.p-skeleton) {
   background-color: rgba(55, 65, 81, 0.5); /* Dark gray base */
   background-image: linear-gradient(90deg,
       rgba(55, 65, 81, 0.5) 0%,
       rgba(75, 85, 99, 0.5) 50%,
       rgba(55, 65, 81, 0.5) 100%);
   opacity: 1.0; /* Keep opacity normal */
}

html.dark :deep(.p-confirm-dialog .p-dialog-content) {
   background-color: rgba(31, 41, 55, 0.95); /* Darker dialog */
   color: #f3f4f6;
}

html.dark :deep(.p-confirm-dialog .p-dialog-footer) {
   background-color: rgba(31, 41, 55, 0.95); /* Darker footer */
   border-top: 1px solid rgba(55, 65, 81, 0.8); /* Dark border */
}

html.dark :deep(.p-confirm-dialog .p-dialog-header) {
   background-color: rgba(31, 41, 55, 0.95); /* Darker header */
   border-bottom: 1px solid rgba(55, 65, 81, 0.8);
   color: #f3f4f6;
}
html.dark :deep(.p-confirm-dialog .p-confirm-dialog-icon) {
  color: #fbbf24; /* Keep warning icon color similar */
}

</style>
