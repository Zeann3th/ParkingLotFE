<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Dialog, Button, useToast, useConfirm, ConfirmDialog } from 'primevue';
import MenuLayout from '@/components/MenuLayout.vue';
import { type Vehicle, type CreateVehicle } from '@/types';
import { vehicleService } from '@/services/vehicle.service';
import Skeleton from '@/components/Skeleton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import { useState } from '@/composables/state';
import Title from '@/components/Title.vue';
import InputText from '@/components/InputText.vue';
import { useAuth } from '@/composables/auth';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Vehicle>({ limit: 20 });
const isEditing = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const createVehiclePayload = ref<CreateVehicle>({
    plate: '',
    type: '',
});

const toast = useToast();
const confirm = useConfirm();

const { role } = useAuth();
const isPrivilledged = computed(() => {
    return role.value === 'ADMIN' || role.value === 'SECURITY';
});

const isAdmin = computed(() => {
    return role.value === 'ADMIN';
});

const getAllVehicles = async () => {
    isLoading.value = true;
    try {
        const response = await vehicleService.getAll(page.value, limit.value, { cache: !isMutated.value });
        itemList.value = response.data;
        maxPage.value = response.maxPage;
        isMutated.value = false;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error Loading Vehicles', detail: error as string, life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

const getVehicleDetail = async (id: number) => {
    selectedItem.value = null;
    openDialog("view");
    try {
        selectedItem.value = await vehicleService.getById(id);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error Fetching Details', detail: error as string, life: 3000 });
        closeDialog("view");
    }
};

const createVehicle = async () => {
    if (!createVehiclePayload.value.plate || !createVehiclePayload.value.type) {
        toast.add({ severity: 'warn', summary: 'Missing Information', detail: 'Please fill in both Plate and Type.', life: 3000 });
        return;
    }
    isMutated.value = true;
    try {
        await vehicleService.create(createVehiclePayload.value);
        toast.add({ severity: 'success', summary: 'Vehicle Created', detail: 'New vehicle added successfully.', life: 3000 });
        closeDialogAndResetCreateForm();
        page.value = 1;
        await getAllVehicles();
    } catch (error) {
        isMutated.value = false;
        toast.add({ severity: 'error', summary: 'Creation Failed', detail: error as string, life: 3000 });
    }
};

const updateVehicle = async () => {
    if (!selectedItem.value) return;
    if (!selectedItem.value.plate || !selectedItem.value.type) {
        toast.add({ severity: 'warn', summary: 'Missing Information', detail: 'Plate and Type cannot be empty.', life: 3000 });
        return;
    }
    isMutated.value = true;
    try {
        await vehicleService.update(selectedItem.value.id, selectedItem.value.plate);
        toast.add({ severity: 'success', summary: 'Vehicle Updated', detail: 'Vehicle details saved.', life: 3000 });
        isEditing.value = false;
        closeDialog("view");
        await getAllVehicles();
    } catch (error) {
        isMutated.value = false;
        toast.add({ severity: 'error', summary: 'Update Failed', detail: error as string, life: 3000 });
    }
};

const deleteVehicle = (id: number | undefined) => {
    if (!id) return;
    confirm.require({
        message: 'Are you sure you want to delete this vehicle?',
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            isMutated.value = true;
            try {
                await vehicleService.delete(id);
                toast.add({ severity: 'info', summary: 'Vehicle Deleted', detail: 'The vehicle has been removed.', life: 3000 });
                closeDialog("view");
                page.value = 1;
                await getAllVehicles();
            } catch (error) {
                isMutated.value = false;
                toast.add({ severity: 'error', summary: 'Deletion Failed', detail: error as string, life: 3000, });
            }
        },
        reject: () => {
        }
    });
};

const handleScroll = () => {
    const container = scrollContainer.value;
    if (!container || isLoading.value || page.value >= maxPage.value) return;

    const bottomOffset = 150;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < bottomOffset;

    if (isNearBottom) {
        console.log("Reached bottom, loading more vehicles...");
        page.value += 1;
        isLoading.value = true;

        vehicleService.getAll(page.value, limit.value, { cache: !isMutated.value })
            .then((response) => {
                if (response.data && response.data.length > 0) {
                    itemList.value.push(...response.data);
                }
                maxPage.value = response.maxPage;
            })
            .catch((error) => {
                console.error("Failed to load more vehicles:", error);
                toast.add({ severity: 'error', summary: 'Error Loading More', detail: 'Failed to load more vehicles.', life: 3000 });
                page.value -= 1;
            })
            .finally(() => {
                isLoading.value = false;
            });
    }
};


onMounted(() => {
    getAllVehicles();
    const debouncedScrollHandler = debounce(handleScroll, 200);
    scrollContainer.value?.addEventListener('scroll', debouncedScrollHandler);
    const cleanupScroll = () => {
        scrollContainer.value?.removeEventListener('scroll', debouncedScrollHandler);
    };
    onBeforeUnmount(cleanupScroll);
});

function debounce(func: Function, wait: number) {
    let timeout: number | undefined;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
    };
}


const closeDialogAndResetCreateForm = () => {
    closeDialog("create");
    createVehiclePayload.value = { plate: '', type: '' };
};

const closeViewDialog = () => {
    closeDialog('view');
    isEditing.value = false;
}

</script>

<template>
    <MenuLayout>
        <div ref="scrollContainer"
            class="h-screen overflow-y-auto !bg-gray-50 dark:!bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div class="max-w-7xl mx-auto">
                <Title name="Vehicles" subtext="Manage registered vehicles" @click="getAllVehicles"
                    class="mb-6 md:mb-8" />

                <!-- Skeleton Loading -->
                <Skeleton v-if="isLoading && page === 1" type="grid-card" :count="limit" />

                <!-- Vehicles Grid -->
                <div v-else-if="itemList.length > 0"
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">

                    <!-- === Vehicle Card Start === -->
                    <div v-for="vehicle in itemList" :key="vehicle.id" class="
              card relative
              !bg-white dark:!bg-gray-800
              rounded-lg shadow-sm hover:shadow-md
              border border-gray-200 dark:border-gray-700
              flex flex-col
              transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer
            " @click="getVehicleDetail(vehicle.id)" role="button" tabindex="0">

                        <div class="p-5 flex-grow">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 truncate"
                                :title="vehicle.plate">
                                {{ vehicle.plate }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                {{ vehicle.type || 'N/A' }}
                            </p>
                        </div>

                        <div
                            class="border-t border-gray-200 dark:border-gray-700 mt-auto px-5 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                            <p class="text-xs text-gray-500 dark:text-gray-400 text-right font-mono tracking-tight">
                                ID: {{ vehicle.id }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading && page > 1" class="text-center py-6 text-gray-500 dark:text-gray-400">
                    Loading more vehicles...
                </div>

                <!-- Empty State -->
                <EmptyMessage v-else-if="!isLoading && itemList.length === 0" message="No vehicles found."
                    @refresh="getAllVehicles" class="mt-10" />

                <!-- Vehicle Detail Dialog -->
                <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
                    class="!bg-white dark:!bg-gray-800 !text-black !rounded-xl !shadow-xl !border !border-gray-200 dark:!border-gray-700"
                    :style="{ width: '95%', maxWidth: '500px' }">
                    <!-- Custom Header -->
                    <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Vehicle Details</h2>
                        <Button icon="pi pi-times"
                            class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
                            @click="closeViewDialog" aria-label="Close dialog" unstyled />
                    </div>

                    <!-- Content Area -->
                    <div v-if="selectedItem" class="p-5 md:p-6 space-y-4">
                        <!-- ID (Read Only) -->
                        <div class="grid grid-cols-3 gap-x-4 items-center">
                            <label class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
                            <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ selectedItem.id
                            }}</span>
                        </div>
                        <!-- Plate -->
                        <div class="grid grid-cols-3 gap-x-4 items-center">
                            <label for="view-plate"
                                class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Plate</label>
                            <span v-if="!isEditing" class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{
                                selectedItem.plate }}</span>
                            <InputText v-else inputId="view-plate" v-model="selectedItem.plate"
                                class="col-span-2 text-sm" />
                        </div>
                        <!-- Type -->
                        <div class="grid grid-cols-3 gap-x-4 items-center">
                            <label for="view-type"
                                class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                            <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{{
                                selectedItem.type }}</span>
                        </div>
                        <!-- Created At -->
                        <div class="grid grid-cols-3 gap-x-4 items-center">
                            <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Created
                                At</span>
                            <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ new
                                Date(selectedItem.createdAt).toLocaleString() }}</span>
                        </div>
                        <!-- Updated At -->
                        <div class="grid grid-cols-3 gap-x-4 items-center">
                            <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Updated
                                At</span>
                            <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ new
                                Date(selectedItem.updatedAt).toLocaleString() }}</span>
                        </div>
                    </div>
                    <div v-else class="p-6 text-center text-gray-500 dark:text-gray-400">
                        Loading vehicle details...
                    </div>

                    <!-- Footer/Actions -->
                    <div
                        class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                        <Button v-if="isPrivilledged && !isEditing" label="Edit" icon="pi pi-pencil"
                            class="p-button-sm p-button-outlined !border-accent !bg-accent !text-white hover:!bg-aceent/80 focus:!ring-2 focus:!ring-aceent"
                            @click="isEditing = true" />
                        <Button v-if="isPrivilledged && isEditing" label="Save" icon="pi pi-save"
                            class="p-button-sm !border-green-500 !bg-green-500 !text-white hover:!bg-green-700 focus:!ring-2 focus:!ring-green-500/50"
                            @click="updateVehicle" />
                        <Button v-if="isAdmin" label="Delete" icon="pi pi-trash"
                            class="p-button-sm p-button-danger !bg-red-500 !border-red-500 !text-white hover:!bg-red-700 focus:!ring-2 focus:!ring-red-500/50"
                            @click="deleteVehicle(selectedItem?.id)" />
                        <Button label="Close"
                            class="p-button-sm p-button-text !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-gray-500/50"
                            @click="closeViewDialog" />
                    </div>
                </Dialog>

                <!-- Create Vehicle Dialog -->
                <Dialog v-model:visible="dialogs.create" modal :closable="false" :showHeader="false" class="!bg-white dark:!bg-gray-800 !text-black !rounded-xl !shadow-xl !border !border-gray-200
                    dark:!border-gray-700" :style="{ width: '95%', maxWidth: '500px' }">
                    <!-- Custom Header -->
                    <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Register New Vehicle</h2>
                        <Button icon="pi pi-times"
                            class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
                            @click="closeDialogAndResetCreateForm" aria-label="Close dialog" unstyled />
                    </div>

                    <div class="p-5 md:p-6 space-y-4">
                        <div>
                            <label for="create-plate"
                                class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                License Plate <span class="text-red-500">*</span>
                            </label>
                            <InputText v-model="createVehiclePayload.plate" inputId="create-plate"
                                placeholder="Enter license plate" />
                        </div>

                        <div>
                            <label for="create-type"
                                class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                Vehicle Type <span class="text-red-500">*</span>
                            </label>
                            <select v-model="createVehiclePayload.type" inputId="create-type"
                                class="!w-full p-inputtext-sm p-inputtext !bg-white !text-black border-white !rounded-md !shadow-sm !focus:ring-primary !focus:ring-primary/50"
                                placeholder="Select vehicle type">
                                <option value="" disabled>Select vehicle type</option>
                                <option value="CAR">CAR</option>
                                <option value="MOTORBIKE">MOTORBIKE</option>
                            </select>
                        </div>
                    </div>

                    <!-- Footer/Actions -->
                    <div
                        class="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                        <Button v-if="isAdmin" label="Save" icon="pi pi-save" class="p-button-sm p-button-outlined
                           !border-green-500 !bg-green-500 !text-white hover:!bg-green-700
                           focus:!ring-2 focus:!ring-accent/50" @click="createVehicle" />
                        <Button label="Cancel"
                            class="p-button-sm p-button-text !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-gray-500/50"
                            @click="closeDialogAndResetCreateForm" />
                    </div>
                </Dialog>

            </div>
        </div>

        <FloatingButton v-if="isPrivilledged" icon="+" @click="openDialog('create')" aria-label="Add new vehicle" />

    </MenuLayout>
    <ConfirmDialog></ConfirmDialog>
</template>

<style scoped>
.card h3 {
    overflow-wrap: break-word;
}

.p-button-sm {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}
</style>