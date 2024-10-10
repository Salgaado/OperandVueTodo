<template>
  <div class="login-container">
    <el-form @submit.prevent="login">
      <!-- alert de deu ruim -->
      <el-alert  
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
      />

      <el-form-item label="Email">
        <el-input
          v-model="email"
          type="email"
          placeholder="Digite seu email"
          required
        ></el-input>
      </el-form-item>
      <el-form-item label="Senha">
        <el-input
          v-model="password"
          type="password"
          placeholder="Digite sua senha"
          required
        ></el-input>
      </el-form-item>
      <el-button type="primary" @click="login">Login</el-button>
      <el-button type="text" @click="resetPassword">Esqueceu a senha?</el-button>
    </el-form>
  </div>
</template>


<script>
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const errorMessage = ref(''); 
    const router = useRouter();

    
    const errorMessages = {
      'auth/invalid-email': 'O endereço de email não é válido.',
      'auth/user-disabled': 'Este usuário foi desativado.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
    };

    const login = async () => {
      errorMessage.value = ''; 
      try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        router.push('/todos'); 
      } catch (error) {
        const errorCode = error.code;
        errorMessage.value =
          errorMessages[errorCode] || 'Ocorreu um erro ao fazer login.';
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

    return {
      email,
      password,
      login,
      resetPassword,
      errorMessage,
    };
  },
};
</script>


<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  
}

.el-form {
  margin-top: 20px;
}
</style>
