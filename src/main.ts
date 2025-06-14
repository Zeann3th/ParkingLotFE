import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import "./interceptors/axios";
import 'vue-sonner/style.css';

createApp(App)
  .use(router)
  .mount('#app');
