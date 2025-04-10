import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function usePagination(defaultRowsPerPage = 10) {
  const route = useRoute();
  const router = useRouter();

  const isLoading = ref(true);
  const isMutated = ref(false);
  const totalPages = ref(1);
  const currentPage = ref(1);
  const rowsPerPage = ref(defaultRowsPerPage);
  const showDetailDialog = ref(false);

  const updateRouteParams = () => {
    router.push({
      query: {
        ...route.query,
        page: currentPage.value,
      },
    });
  };

  const onPageChange = (event: { page: number; }) => {
    currentPage.value = event.page + 1;
    updateRouteParams();
  };

  const closeDialog = () => {
    showDetailDialog.value = false;
  };

  onMounted(() => {
    if (route.query.page) {
      const parsedPage = parseInt(route.query.page as string);
      if (!isNaN(parsedPage)) {
        currentPage.value = parsedPage;
      }
    } else {
      updateRouteParams();
    }
  });

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
