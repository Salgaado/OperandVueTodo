import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { auth } from './firebase';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'


// Verifique o estado da autenticação antes de montar o app
let app;
auth.onAuthStateChanged(() => {
  if (!app) {
    app = createApp(App).use(router).use(ElementPlus).mount('#app'); // Só monta o app depois de verificar a autenticação
  }
});

