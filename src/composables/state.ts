import { ref } from "vue";

export function useState<T>() {
  const isLoading = ref(false);
  const isMutated = ref(false);
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
  const page = ref(1);
  const limit = ref(10);
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
