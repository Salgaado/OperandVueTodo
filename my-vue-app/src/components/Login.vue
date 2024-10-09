<template>
  <div class="login-container">
    <el-form @submit.prevent="login">
      <el-form-item label="Email">
        <el-input v-model="email" type="email" placeholder="Enter your email" required></el-input>
      </el-form-item>
      <el-form-item label="Password">
        <el-input v-model="password" type="password" placeholder="Enter your password" required></el-input>
      </el-form-item>
      <el-button type="primary" @click="login">Login</el-button>
      <el-button type="text" @click="resetPassword">Forgot Password?</el-button>
    </el-form>
  </div>
</template>

<script>
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';


export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const router = useRouter();

    const login = async () => {
      try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/todos'); // Redireciona para a página de tarefas após login
      } catch (error) {
        console.error('Erro de login:', error.message);
      }
    };

    const resetPassword = async () => {
      if (email.value) {
        try {
          await sendPasswordResetEmail(auth, email.value);
          alert('Email para redefinir a senha enviado!');
        } catch (error) {
          console.error('Erro ao enviar email de recuperação:', error.message);
        }
      } else {
        alert('Digite seu email para receber a recuperação de senha.');
      }
    };

    return { email, password, login, resetPassword };
  },
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
}
</style>
