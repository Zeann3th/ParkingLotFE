import { ref } from "vue";

export function useState<T>(opts?: { page?: number; limit?: number; }) {
  const isLoading = ref(false);
  const isMutated = ref(true);
  const isDetailLoading = ref(false);
  const dialogs = ref({
    view: false,
    create: false,
    update: false,
  });
  const openDialog = (dialogName: "view" | "create" | "update") => {
    dialogs.value[dialogName] = true;
  };
  const closeDialog = (dialogName: "view" | "create" | "update") => {
    dialogs.value[dialogName] = false;
    selectedItem.value = null;
  };
  const selectedItem = ref<T | null>(null);
  const itemList = ref<T[]>([]);
  const page = ref(opts?.page || 1);
  const limit = ref(opts?.limit || 10);
  const maxPage = ref(1);

  return {
    isLoading,
    isMutated,
    isDetailLoading,
    dialogs,
    openDialog,
    closeDialog,
    selectedItem,
    itemList,
    page,
    limit,
    maxPage,
  };
}
