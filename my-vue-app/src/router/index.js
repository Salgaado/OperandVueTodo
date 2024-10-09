import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase'; // Importa o auth do Firebase para verificar o estado de autenticação
import Login from '../components/Login.vue'; // Página de login
import TodoList from '../components/TodoList.vue'; // Página de lista de tarefas

const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/todos',
    component: TodoList,
    meta: { requiresAuth: true }, // Protege essa rota
  },
  {
    path: '/',
    redirect: '/login', // Redireciona para o login por padrão
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Verifica se o usuário está autenticado antes de acessar uma rota protegida
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser; // Verifica o estado de autenticação

  // Se a rota requer autenticação e o usuário não está autenticado, redireciona para a página de login
  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next(); // Continua a navegação para a rota desejada
  }
});

export default router;
