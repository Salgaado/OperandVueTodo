import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { auth } from './firebase';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'; // Importa o Pinia

const pinia = createPinia(); // Cria a instância do Pinia

// Verifique o estado da autenticação antes de montar o app
let app;
auth.onAuthStateChanged(() => {
  if (!app) {
    app = createApp(App)
      .use(router)
      .use(ElementPlus)
      .use(pinia) // Usa o Pinia no app
      .mount('#app'); // Só monta o app depois de verificar a autenticação
  }
});

