<script setup lang="ts">
import { watch } from 'vue';
import axios from 'axios';
import Dialog from 'primevue/dialog';
import Skeleton from '@/components/Skeleton.vue';
import Title from '@/components/Title.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Button from 'primevue/button';
import { memoryStorage } from '@/storage';
import { useToast } from 'primevue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Transaction, TransactionResponse } from '@/types';
import { useState } from '@/composables/state';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, isDetailLoading, closeDialog, selectedItem, itemList } = useState<Transaction>();
const toast = useToast();
const route = useRoute();

const getAllTransactions = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get<TransactionResponse>('/transactions', {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
      params: {
        page: page.value,
        limit: limit.value,
      }
    });
    itemList.value = response.data.data;
    maxPage.value = response.data.count;
  } catch (error: any) {
    const detail = error?.response?.data?.message || 'Failed to load transactions';
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 3000 });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  page.value = parseInt(newQuery.page as string) || 1;
  getAllTransactions();
}, { immediate: true });

const getTransactionDetails = async (id: number) => {
  isDetailLoading.value = true;
  selectedItem.value = null;
  openDialog("view");

  try {
    const response = await axios.get<Transaction>(`/transactions/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedItem.value = response.data;
  } catch (error: any) {
    console.error("Failed to load transaction details:", error);
    const detail = error?.response?.data?.message || 'Failed to load transaction details';
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 3000 });
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const checkout = async (transactionId: number, event?: Event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  try {
    const response = await axios.post(`/transactions/${transactionId}/checkout`, {}, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      }
    });

    if (response.data?.order_url) {
      window.location.href = response.data.order_url;
    }
    else {
      toast.add({ severity: 'warn', summary: 'Info', detail: 'Checkout processed, no redirect needed.', life: 3000 });
      isMutated.value = true;
      getAllTransactions();
      closeDialog("view");
    }
  } catch (error: any) {
    const detail = error?.response?.data?.message || 'Failed to initiate payment';
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 3000 });
  }
};

const formatDate = (month: number, year: number) => {
  if (!month || !year) return 'N/A';
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatAmount = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getStatusClass = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'text-green-600 dark:text-green-400';
    case 'PENDING':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'FAILED':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'pi pi-check-circle';
    case 'PENDING':
      return 'pi pi-clock';
    case 'FAILED':
      return 'pi pi-times-circle';
    default:
      return 'pi pi-question-circle';
  }
};

const refreshData = () => {
  getAllTransactions();
}

</script>

<template>
  <MenuLayout>
    <div
      class="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div class="max-w-4xl mx-auto">
        <Title name="Transactions" @click="refreshData" class="mb-6" />
        <Skeleton v-if="isLoading" type="list" :count="limit" />
        <div v-else-if="itemList.length > 0" class="space-y-3">
          <div v-for="transaction in itemList" :key="transaction.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 border border-transparent flex items-start space-x-4"
            @click="getTransactionDetails(transaction.id)" role="button"
            :aria-label="`View details for transaction ${transaction.id}`">

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <div class="font-medium text-gray-800 dark:text-gray-100 truncate"
                  :title="`User #${transaction.userId}`">
                  User #{{ transaction.userId }}
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">{{ formatDate(transaction.month,
                    transaction.year) }}</span>
                </div>
                <div class="text-sm font-semibold whitespace-nowrap pl-2" :class="getStatusClass(transaction.status)">
                  {{ formatAmount(transaction.amount) }}
                </div>
              </div>
              <!-- Status Row -->
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center space-x-1.5" :class="getStatusClass(transaction.status)">
                  <i class="text-xs" :class="getStatusIcon(transaction.status)"></i>
                  <span class="capitalize text-xs font-medium">{{ transaction.status?.toLowerCase() || 'N/A' }}</span>
                </div>
                <Button v-if="transaction.status === 'PENDING'" label="Pay Now" icon="pi pi-credit-card"
                  class="p-button-sm p-button-raised !bg-primary hover:!bg-primary/80 !border-primary !text-white !py-1 !px-2.5"
                  :loading="selectedItem?.id === transaction.id" @click.stop="checkout(transaction.id, $event)" />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else message="No transactions found" icon="pi pi-exclamation-triangle" @click="refreshData" />

        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '550px' }"
          class="!bg-secondary !text-black !rounded-xl !shadow-xl !border !border-gray-200" :dismissableMask="true">

          <!-- Dialog Content Wrapper -->
          <div>
            <!-- Custom Header -->
            <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Transaction Details</h2>
              <Button icon="pi pi-times"
                class="p-button-text p-button-rounded !w-8 !h-8 !text-gray-500 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-primary-500/50"
                @click="closeDialog('view')" aria-label="Close dialog" />
            </div>

            <!-- Loading State inside Dialog -->
            <div v-if="isDetailLoading" class="p-6 text-center text-gray-500 dark:text-gray-400">
              Loading details...
              <!-- Optional: Add Skeleton here -->
              <div class="mt-4 space-y-3">
                <Skeleton width="60%" height="1.5rem" class="mb-4 bg-gray-200 dark:bg-gray-700 mx-auto" />
                <Skeleton width="100%" height="1rem" class="mb-2 bg-gray-200 dark:bg-gray-700" />
                <Skeleton width="80%" height="1rem" class="mb-2 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <!-- Content Area -->
            <div v-if="selectedItem && !isDetailLoading" class="p-5 md:p-6">
              <div class="flex items-center mb-6 space-x-4">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(selectedItem.month, selectedItem.year) }}
                  </p>
                </div>
              </div>

              <div class="space-y-3">
                <!-- Detail Row: Amount -->
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Amount</span>
                  <span class="text-lg font-semibold text-right" :class="getStatusClass(selectedItem.status)">
                    {{ formatAmount(selectedItem.amount) }}
                  </span>
                </div>
                <!-- Detail Row: Status -->
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Status</span>
                  <div class="flex items-center space-x-1.5 text-right" :class="getStatusClass(selectedItem.status)">
                    <i class="text-sm" :class="getStatusIcon(selectedItem.status)"></i>
                    <span class="text-sm font-medium capitalize">{{ selectedItem.status?.toLowerCase() || 'N/A'
                    }}</span>
                  </div>
                </div>
                <!-- Detail Row: Period -->
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Period</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">
                    {{ formatDate(selectedItem.month, selectedItem.year) }}
                  </span>
                </div>
                <!-- Detail Row: Transaction ID -->
                <div class="flex justify-between items-center py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Transaction ID</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right font-mono break-all">{{
                    selectedItem.id }}</span>
                </div>
              </div>
            </div>

            <!-- Dialog Footer/Actions -->
            <div v-if="selectedItem && !isDetailLoading"
              class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <Button v-if="selectedItem.status === 'PENDING'" label="Proceed to Payment" icon="pi pi-credit-card"
                class="p-button-sm !bg-primary-600 hover:!bg-primary-700 !border-primary-600 !text-white"
                @click="checkout(selectedItem.id)" />
              <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('view')" />
            </div>
          </div>
        </Dialog>

      </div>
    </div>
  </MenuLayout>
</template>
