import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface PageChangeEvent {
  page: number;
}

export function usePagination(defaultRowsPerPage = 10) {
  const route = useRoute();
  const router = useRouter();

  const isLoading = ref(true);
  const isMutated = ref(false);
  const totalPages = ref(1);
  const currentPage = ref(1);
  const rowsPerPage = ref(defaultRowsPerPage);
  const showDetailDialog = ref(false);

  const updateRouteParams = (page = currentPage.value) => {
    router.push({
      query: {
        ...route.query,
        page: page,
      },
    }).catch(() => { });
  };

  const onPageChange = (event: PageChangeEvent) => {
    const newPage = event.page + 1;
    if (newPage !== currentPage.value) {
      currentPage.value = newPage;
      updateRouteParams(newPage);
    }
  };

  const closeDialog = () => {
    showDetailDialog.value = false;
  };

  return {
    // State
    isLoading,
    isMutated,
    totalPages,
    currentPage,
    rowsPerPage,
    showDetailDialog,

    // Methods
    updateRouteParams,
    onPageChange,
    closeDialog,
  };
}
