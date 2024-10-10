import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { auth } from './firebase';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia'; 
import './assets/css/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'; 

const pinia = createPinia(); 

let app;
auth.onAuthStateChanged(() => {
  if (!app) {
    app = createApp(App)
      .use(router)
      .use(ElementPlus)
      .use(pinia); 

    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }

    app.mount('#app');
  }
});
