<template>
  <el-button @click="logout" type="danger">Sair</el-button>
</template>

<script>
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();

    const logout = async () => {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error('Erro ao sair:', error.message);
      }
    };

    return { logout };
  },
};
</script>
