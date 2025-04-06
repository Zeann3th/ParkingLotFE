import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, ToastService } from 'primevue';
import router from './router';
import "./interceptors/axios";

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Aura
    }
  })
  .use(ConfirmationService)
  .use(ToastService)
  .use(router)
  .mount('#app');
