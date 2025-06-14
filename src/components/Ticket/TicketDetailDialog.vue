<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Save, Trash2, X, CalendarMinus, ListChecks } from 'lucide-vue-next';

const props = defineProps({
  open: Boolean,
  ticket: Object,
  user: Object,
  vehicle: Object,
  isPrivileged: Boolean,
  isAdmin: Boolean,
  isEditing: Boolean,
});
const emit = defineEmits(['close', 'edit', 'save', 'delete', 'cancel', 'reserve']);

const localEditing = ref(props.isEditing);

watch(() => props.isEditing, (val) => {
  localEditing.value = val;
});

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'DAILY': return 'Daily Pass';
    case 'MONTHLY': return 'Monthly Subscription';
    case 'RESERVED': return 'Reserved Spot';
    default: return type;
  }
};

const getStatusTextClasses = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'font-medium text-green-600 dark:text-green-400';
    case 'INUSE': return 'font-medium text-blue-600 dark:text-blue-400';
    case 'LOST': return 'font-medium text-red-600 dark:text-red-400';
    default: return 'font-medium text-gray-600 dark:text-gray-400';
  }
};
</script>

<template>
  <Dialog v-model:open="props.open" class="rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black" :style="{ width: '95%', maxWidth: '550px' }">
    <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Ticket Details</h2>
      <Button variant="ghost" @click="emit('close')">
        <X class="w-4 h-4" />
      </Button>
    </div>
    <div v-if="props.ticket" class="p-5 md:p-6">
      <div class="grid grid-cols-3 gap-x-4 gap-y-4">
        <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">ID</span>
        <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ props.ticket.id }}</span>

        <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Type</span>
        <span v-if="!localEditing" class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ getTypeLabel(props.ticket.type) }}</span>
        <select v-else v-model="props.ticket.type" class="col-span-2 text-sm bg-white text-black">
          <option disabled value="">Select Type</option>
          <option v-for="type in ['DAILY', 'MONTHLY', 'RESERVED']" :key="type" :value="type">
            {{ getTypeLabel(type) }}
          </option>
        </select>

        <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
        <span v-if="!localEditing" :class="getStatusTextClasses(props.ticket.status)" class="col-span-2 text-sm">{{ props.ticket.status }}</span>
        <select v-else v-model="props.ticket.status" class="col-span-2 text-sm bg-white text-black">
          <option disabled value="">Select Status</option>
          <option v-for="status in ['AVAILABLE', 'INUSE', 'LOST', 'CANCELED']" :key="status" :value="status">
            {{ status }}
          </option>
        </select>

        <template v-if="props.vehicle">
          <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle</span>
          <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ props.vehicle.plate }} ({{ props.vehicle.type.toLowerCase() }})</span>
        </template>
        <template v-if="props.user">
          <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">User</span>
          <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ props.user.name }} ({{ props.user.username }})</span>
        </template>

        <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Created At</span>
        <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ new Date(props.ticket.createdAt).toLocaleString() }}</span>
        <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Updated At</span>
        <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ new Date(props.ticket.updatedAt).toLocaleString() }}</span>
      </div>
    </div>
    <div v-else class="p-6 text-center text-gray-500 dark:text-gray-400">
      Loading ticket details...
    </div>
    <div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
      <Button
          v-if="(props.ticket?.type === 'MONTHLY' || props.ticket?.type === 'RESERVED') && props.ticket.status !== 'CANCELED'"
          @click="emit('cancel', props.ticket.id)" variant="outline" class="border-blue-600 text-blue-600">
        <CalendarMinus class="w-4 h-4 mr-2" /> Cancel
      </Button>
      <Button
          v-else-if="props.ticket?.status === 'CANCELED'"
          @click="emit('reserve', props.ticket.id)" variant="outline" class="border-blue-600 text-blue-600">
        <ListChecks class="w-4 h-4 mr-2" /> Reserve
      </Button>
      <Button
          v-if="props.isPrivileged && !localEditing"
          @click="localEditing = true; emit('edit')" variant="outline" class="border-blue-600 text-blue-600">
        <Pencil class="w-4 h-4 mr-2" /> Edit
      </Button>
      <Button
          v-else-if="props.isPrivileged && localEditing"
          @click="emit('save', props.ticket)" variant="outline" class="border-green-500 text-green-600">
        <Save class="w-4 h-4 mr-2" /> Save
      </Button>
      <Button
          v-if="props.isAdmin"
          @click="emit('delete', props.ticket.id)" variant="outline" class="border-red-500 text-red-600">
        <Trash2 class="w-4 h-4 mr-2" /> Delete
      </Button>
      <Button @click="emit('close')" variant="ghost">
        <X class="w-4 h-4 mr-2" /> Close
      </Button>
    </div>
  </Dialog>
</template>