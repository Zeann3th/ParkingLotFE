<script setup lang="ts">
import { computed, watch } from 'vue';
import axios from 'axios';
import { toast } from 'vue-sonner';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import type { Transaction, TransactionResponse } from '@/types';
import { useState } from '@/composables/state';
import { useAuth } from '@/composables/auth';
import Title from '@/components/Title.vue';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import EmptyMessage from '@/components/EmptyMessage.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { X, Trash2 } from 'lucide-vue-next';
import { memoryStorage } from '@/storage';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, isDetailLoading, closeDialog, selectedItem, itemList } = useState<Transaction>();
const route = useRoute();

const { role } = useAuth();
const isAdmin = computed(() => role.value === 'ADMIN');

const getAllTransactions = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get<TransactionResponse>('/transactions', {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` },
      params: { page: page.value, limit: limit.value }
    });
    itemList.value = response.data.data;
    maxPage.value = response.data.maxPage;
  } catch (error) {
    toast.error('Failed to load transactions');
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
    const response = await axios.get(`/transactions/${id}`, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });
    selectedItem.value = response.data;
  } catch (error) {
    toast.error('Failed to load transaction details');
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const deleteTransaction = async (id: number | undefined) => {
  if (!id) return;
  if (!window.confirm('Are you sure you want to delete this transaction?')) return;
  try {
    await axios.delete(`/transactions/${id}`, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });
    toast.success('Transaction deleted');
    closeDialog('view');
    await getAllTransactions();
  } catch (error) {
    toast.error('Failed to delete transaction');
  }
};

const checkout = async (transactionId: number, event?: Event) => {
  if (event) event.stopPropagation();
  try {
    await axios.post(`/transactions/${transactionId}/checkout`, {}, {
      headers: { Authorization: `Bearer ${memoryStorage.getToken()}` }
    });
    toast.success('Checkout successful');
    await getAllTransactions();
    closeDialog('view');
  } catch (error) {
    toast.error('Checkout failed');
  }
};

const formatDate = (month: number, year: number) => {
  if (!month || !year) return 'N/A';
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatAmount = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};

const getStatusClass = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'bg-green-50 text-green-700 border-green-200';
    case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'PAID': return '✔️';
    case 'PENDING': return '⏳';
    case 'FAILED': return '❌';
    default: return 'ℹ️';
  }
};

const refreshData = () => {
  isMutated.value = true;
  getAllTransactions();
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-white p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Transactions" @click="refreshData" class="mb-6" />

        <!-- Loading Skeletons -->
        <div v-if="isLoading && itemList.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <Skeleton v-for="i in limit" :key="i" class="h-32 w-full rounded-lg" />
        </div>

        <!-- Transaction List -->
        <div v-else-if="itemList.length > 0"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <div v-for="transaction in itemList" :key="transaction.id"
               class="bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-blue-100 flex flex-col"
               @click="getTransactionDetails(transaction.id)" role="button"
               :aria-label="`View details for transaction ${transaction.id}`">
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="font-semibold text-black line-clamp-1 break-all flex-1">
                #{{ transaction.id }}
              </h2>
              <Badge :class="getStatusClass(transaction.status)">
                <span class="mr-1">{{ getStatusIcon(transaction.status) }}</span>
                {{ transaction.status }}
              </Badge>
            </div>
            <div class="text-sm text-gray-600 mb-3">
              {{ formatAmount(transaction.amount) }}
            </div>
            <div class="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
              {{ transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A' }}
            </div>
          </div>
          <div v-if="isLoading && itemList.length > 0" class="col-span-full text-center py-4">
            <Skeleton class="h-6 w-24 mx-auto" />
            <span class="text-gray-500 ml-2">Loading more...</span>
          </div>
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else message="No Transactions Found." @refresh="refreshData" />

        <!-- Transaction Detail Dialog -->
        <Dialog v-model:open="dialogs.view">
          <DialogContent class="max-w-md w-full p-0">
            <div>
              <div class="flex justify-between items-center p-5 border-b border-blue-100">
                <h2 class="text-xl font-semibold text-gray-800">Transaction Details</h2>
                <Button variant="ghost" size="icon" @click="closeDialog('view')" aria-label="Close dialog">
                  <X class="w-5 h-5" />
                </Button>
              </div>
              <div v-if="isDetailLoading" class="p-6 text-center text-gray-500">
                <Skeleton class="h-6 w-2/5 mb-4 mx-auto" />
                <Skeleton class="h-4 w-full mb-2" />
                <Skeleton class="h-16 w-full mb-4" />
                <Skeleton class="h-5 w-3/5 mx-auto" />
                <p>Loading Details...</p>
              </div>
              <div v-else-if="selectedItem" class="p-5 md:p-6">
                <div class="space-y-3">
                  <div class="flex justify-between items-start py-1">
                    <span class="font-medium text-gray-700">ID:</span>
                    <span>#{{ selectedItem.id }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="font-medium text-gray-700">Status:</span>
                    <Badge :class="getStatusClass(selectedItem.status)">
                      <span class="mr-1">{{ getStatusIcon(selectedItem.status) }}</span>
                      {{ selectedItem.status }}
                    </Badge>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="font-medium text-gray-700">Amount:</span>
                    <span>{{ formatAmount(selectedItem.amount) }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1">
                    <span class="font-medium text-gray-700">Created:</span>
                    <span>{{ selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between items-start py-1" v-if="selectedItem.month && selectedItem.year">
                    <span class="font-medium text-gray-700">Period:</span>
                    <span>{{ formatDate(selectedItem.month, selectedItem.year) }}</span>
                  </div>
                </div>
              </div>
              <DialogFooter class="flex justify-end gap-3 p-4 border-t border-blue-100 bg-blue-50 rounded-b-lg">
                <template v-if="selectedItem">
                  <Button v-if="selectedItem.status === 'PENDING'" variant="secondary" @click="checkout(selectedItem.id)">
                    Checkout
                  </Button>
                  <Button v-if="isAdmin" variant="destructive" @click="deleteTransaction(selectedItem.id)">
                    <Trash2 class="w-4 h-4 mr-1" /> Delete
                  </Button>
                  <Button variant="ghost" @click="closeDialog('view')">
                    Close
                  </Button>
                </template>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
* { font-family: 'Inter', sans-serif; }
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>