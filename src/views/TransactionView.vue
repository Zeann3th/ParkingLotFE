<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';
import { memoryStorage } from '@/storage';
import { useToast } from 'primevue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Transaction, TransactionResponse } from '@/types';
import { getRandomColor, getInitials } from '@/utils';

const isLoading = ref<boolean>(false);
const isMutated = ref<boolean>(false);
const showDetailDialog = ref<boolean>(false);
const closeDialog = () => {
  showDetailDialog.value = false;
  selectedTransaction.value = null;
};
const currentPage = ref<number>(1);
const rowsPerPage = ref<number>(10);
const totalPages = ref<number>(0);
const transactions = ref<Transaction[]>([]);
const selectedTransaction = ref<Transaction | null>(null);
const detailsLoading = ref<boolean>(false);
const processingCheckout = ref<boolean>(false);
const toast = useToast();
const skeletonItems = Array(5).fill({});
const route = useRoute();

console.log(isLoading, isMutated);

const fetchTransactions = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get<TransactionResponse>('/transactions', {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
      params: {
        page: currentPage.value,
        limit: rowsPerPage.value,
      }
    });
    transactions.value = response.data.data;
    totalPages.value = response.data.count;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load transactions',
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  currentPage.value = parseInt(newQuery.page as string) || 1;
  fetchTransactions();
}, { immediate: true });

onMounted(() => {
});

const loadTransactionDetails = async (id: number) => {
  detailsLoading.value = true;
  showDetailDialog.value = true;

  try {
    const response = await axios.get<Transaction>(`/transactions/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedTransaction.value = response.data;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load transaction details',
      life: 3000,
    });
  } finally {
    detailsLoading.value = false;
  }
};

const initiateCheckout = async (transactionId: number, event?: Event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  processingCheckout.value = true;
  try {
    const response = await axios.post(`/transactions/${transactionId}/checkout`, {}, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });

    if (response.data?.order_url) {
      window.location.href = response.data.order_url;
    } else {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Redirecting to payment gateway...',
        life: 3000,
      });
      setTimeout(fetchTransactions, 2000);
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to initiate payment',
      life: 3000,
    });
  } finally {
    processingCheckout.value = false;
  }
};

const formatDate = (month: number, year: number) => {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const getStatusIcon = (status: string) => {
  return status === 'PAID' ? 'pi pi-check-circle' : 'pi pi-clock';
};

const getStatusColor = (status: string) => {
  return status === 'PAID' ? 'text-green-400' : 'text-yellow-400';
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-gray-900 p-4 md:p-6 text-gray-100">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-green-400">Transaction History</h1>
          <Button icon="pi pi-refresh" class="p-button-text text-gray-400 hover:text-green-400"
            @click="fetchTransactions" />
        </div>

        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="(_, index) in skeletonItems" :key="index"
            class="bg-gray-800 bg-opacity-80 rounded-lg p-4 flex items-start space-x-4 shadow-sm backdrop-blur-sm">
            <Skeleton shape="circle" size="3rem" class="bg-gray-700"></Skeleton>
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

        <!-- Transactions List -->
        <div v-else class="space-y-3">
          <div v-for="transaction in transactions" :key="transaction.id"
            class="bg-gray-800 bg-opacity-80 hover:bg-gray-700 hover:bg-opacity-90 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 cursor-pointer shadow-sm border border-gray-700 backdrop-blur-sm"
            @click="loadTransactionDetails(transaction.id)">

            <!-- Avatar -->
            <Avatar :label="getInitials(`User${transaction.userId}`)" class="flex-shrink-0"
              :style="{ backgroundColor: getRandomColor(transaction.userId) }" />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between mb-1">
                <div class="font-medium text-gray-100">
                  User #{{ transaction.userId }}
                </div>
                <div class="text-sm" :class="getStatusColor(transaction.status)">
                  {{ formatAmount(transaction.amount) }}
                </div>
              </div>
              <div class="text-xs text-gray-400 mb-1">
                {{ formatDate(transaction.month, transaction.year) }}
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <i class="pi text-sm"
                    :class="[getStatusIcon(transaction.status), getStatusColor(transaction.status)]"></i>
                  <span class="text-sm text-gray-300 capitalize">{{ transaction.status.toLowerCase() }}</span>
                </div>
                <Button v-if="transaction.status === 'PENDING'" label="Pay Now" icon="pi pi-credit-card"
                  class="p-button-sm bg-green-600 hover:bg-green-700 border-green-600"
                  @click.stop="initiateCheckout(transaction.id, $event)" />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && transactions.length === 0"
          class="text-center py-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
          <i class="pi pi-wallet text-6xl text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-400">No transactions found</p>
          <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600"
            @click="fetchTransactions" />
        </div>

        <!-- Transaction Detail Dialog -->
        <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
          class="bg-gray-800 bg-opacity-90 text-gray-100 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm"
          :style="{ width: '90%', maxWidth: '600px' }">

          <!-- Transaction details content -->
          <div v-if="selectedTransaction && !detailsLoading" class="p-4 md:p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <Avatar :label="getInitials(`User${selectedTransaction.userId}`)" size="large"
                  :style="{ backgroundColor: getRandomColor(selectedTransaction.userId) }" shape="circle" />
                <div>
                  <h2 class="text-xl font-bold text-green-400">User #{{ selectedTransaction.userId }}</h2>
                  <p class="text-sm text-gray-400">
                    {{ formatDate(selectedTransaction.month, selectedTransaction.year) }}
                  </p>
                </div>
              </div>
              <div class="text-2xl font-bold" :class="getStatusColor(selectedTransaction.status)">
                {{ formatAmount(selectedTransaction.amount) }}
              </div>
            </div>

            <div class="space-y-4">
              <div class="border-b border-gray-700 pb-4">
                <h3 class="text-sm text-gray-400 mb-1">Status</h3>
                <div class="flex items-center space-x-2">
                  <i class="pi"
                    :class="[getStatusIcon(selectedTransaction.status), getStatusColor(selectedTransaction.status)]"></i>
                  <span class="capitalize">{{ selectedTransaction.status.toLowerCase() }}</span>
                </div>
              </div>

              <div class="border-b border-gray-700 pb-4">
                <h3 class="text-sm text-gray-400 mb-1">Period</h3>
                <p class="text-gray-300">
                  {{ formatDate(selectedTransaction.month, selectedTransaction.year) }}
                </p>
              </div>

              <div class="border-b border-gray-700 pb-4">
                <h3 class="text-sm text-gray-400 mb-1">Amount</h3>
                <p class="text-gray-300">{{ formatAmount(selectedTransaction.amount) }}</p>
              </div>

              <div class="border-b border-gray-700 pb-4">
                <h3 class="text-sm text-gray-400 mb-1">Transaction ID</h3>
                <p class="text-gray-300 font-mono">{{ selectedTransaction.id }}</p>
              </div>
            </div>

            <div class="flex justify-end mt-6 space-x-3">
              <Button v-if="selectedTransaction.status === 'PENDING'" label="Proceed to Payment"
                icon="pi pi-credit-card" class="bg-green-600 hover:bg-green-700 border-green-600"
                :loading="processingCheckout" @click="initiateCheckout(selectedTransaction.id)" />
              <Button label="Close" @click="closeDialog"
                class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
            </div>
          </div>

          <!-- Loading state in dialog -->
          <div v-if="detailsLoading" class="p-4 space-y-4">
            <div class="flex items-center space-x-3 mb-6">
              <Skeleton shape="circle" size="4rem" class="bg-gray-700"></Skeleton>
              <div class="flex-1">
                <Skeleton width="60%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
                <Skeleton width="40%" height="1rem" class="bg-gray-700"></Skeleton>
              </div>
              <Skeleton width="25%" height="2rem" class="bg-gray-700"></Skeleton>
            </div>

            <Skeleton width="100%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
            <Skeleton width="80%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
            <Skeleton width="90%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>
            <Skeleton width="70%" height="1.5rem" class="mb-2 bg-gray-700"></Skeleton>

            <div class="flex justify-end mt-6">
              <Skeleton width="120px" height="2.5rem" class="bg-gray-700"></Skeleton>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
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

:deep(.p-skeleton) {
  background-color: rgba(55, 65, 81, 0.5);
  background-image: linear-gradient(90deg,
      rgba(55, 65, 81, 0.5) 0%,
      rgba(75, 85, 99, 0.5) 50%,
      rgba(55, 65, 81, 0.5) 100%);
}
</style>
