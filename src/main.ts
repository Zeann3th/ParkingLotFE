import { createApp } from 'vue'
import App from './App.vue'
import ToastService from 'primevue/toastservice'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import router from './router'
import "./interceptors/axios"

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Aura
    }
  })
  .use(ToastService)
  .use(router)
  .mount('#app')
