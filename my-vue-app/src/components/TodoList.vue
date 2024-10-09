
<template>
  <div class="todo-list-container">
    <logout/>
    <h1 v-if="loading">Loading: {{ loading }}</h1>
    <el-row :gutter="20">
      <el-col :span="24">
        <el-input
          v-model="newListTitle"
          placeholder="Nova Lista de Tarefas"
          clearable
          @keyup.enter="createTaskList"
        ></el-input>
        <el-button @click="createTaskList" type="primary">Criar uma Lista de Tarefas</el-button>
      </el-col>
    </el-row>

    
    <el-row :gutter="20" class="task-lists">
      <el-col
        v-for="(list, index) in taskLists"
        :key="index"
        :span="24"
        class="task-list"
      >
        <div class="list-header">
          <h3>{{ list.title }}</h3>
          <el-button @click="removeTaskList(list.id)" type="danger">Excluir Lista</el-button>
        </div>

        <el-input
          v-model="list.newTaskDescription"
          placeholder="Descrição da Tarefa"
          clearable
          @keyup.enter="addTask(index)"
        ></el-input>
        <el-button @click="addTask(index)" type="primary">Nova Tarefa</el-button>

        
        <el-table :data="list.tasks" style="width: 100%">
          <el-table-column label="Tarefa" prop="description"></el-table-column>
          <el-table-column label="Status" width="150">
            <template #default="scope">
              <el-checkbox v-model="scope.row.completed" @change="updateTaskStatus(index, scope.$index, scope.row.completed)">{{ scope.row.completed ? 'Completo' : 'Pendente' }}</el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="Ações" width="150">
            <template #default="scope">
              <el-button @click="removeTask(index, scope.$index)" type="danger">Excluir</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import logout from './logout.vue';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default {
  components:{logout},

  data() {
    return {
      newListTitle: '',
      newTaskDescription: '',
      taskLists: [],
      userId: null,
      loading: false,
    };
  },
  async mounted() {
    
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userId = user.uid;
        await this.loadTaskLists();
      } else {
        this.$router.push('/login'); 
      }
    });
  },


  methods: {
    // Método para carregar as listas de tarefas do Firestore
    async loadTaskLists() {
    try {
    const q = query(collection(db, 'taskLists'), where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);

    // Carregue as listas de tarefas e garanta que o id do documento seja atribuído
    this.taskLists = querySnapshot.docs.map(doc => ({
      id: doc.id,  // Atribua o ID do documento
      ...doc.data() // Todos os outros dados da lista
    }));
    } catch (error) {
    console.error('Erro ao carregar as listas de tarefas:', error);
    }
    },

    // Método para criar uma nova lista de tarefas com o campo newTaskDescription
    async createTaskList() {
    if (this.newListTitle.trim()) {
    const newList = {
      title: this.newListTitle,
      tasks: [],
      newTaskDescription: '',  // Campo específico para a nova descrição de tarefas
      userId: this.userId,  // Associando o ID do usuário à lista
    };

    try {
      // Adiciona a lista ao Firestore e obtém o ID do documento
      const docRef = await addDoc(collection(db, 'taskLists'), newList);
      newList.id = docRef.id;  // Armazena o ID do documento Firestore

      // Adiciona a lista localmente
      this.taskLists.push(newList);

      // Limpa o campo de input para o nome da lista
      this.newListTitle = '';
    } catch (error) {
      console.error('Erro ao criar a lista de tarefas:', error);
        }
      }
    },


    // Método para adicionar uma nova tarefa a uma lista específica
    async addTask(listIndex) {
    const list = this.taskLists[listIndex];

    // Verifique se list.id existe
    if (!list.id) {
      console.error('Erro: O ID da lista está indefinido.');
      return;
    }

    if (list.newTaskDescription.trim()) {
      const updatedTasks = [...list.tasks, { description: list.newTaskDescription, completed: false }];

      try {
      // Certifique-se de que list.id está corretamente definido
      const listRef = doc(db, 'taskLists', list.id); // Verifique se list.id é válido aqui
      await updateDoc(listRef, { tasks: updatedTasks });

      // Atualiza localmente a lista de tarefas
      this.taskLists[listIndex].tasks = updatedTasks;

      // Limpa o campo de input de nova tarefa
      list.newTaskDescription = '';
      } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        }
      }
    },



    // Método para remover uma tarefa específica de uma lista
    async removeTask(listIndex, taskIndex) {
    const list = this.taskLists[listIndex];

    // Crie uma nova lista de tarefas sem a tarefa a ser removida
    const updatedTasks = list.tasks.filter((_, i) => i !== taskIndex);

    try {
    // Atualiza o Firestore com a nova lista de tarefas
    const listRef = doc(db, 'taskLists', list.id);
    await updateDoc(listRef, { tasks: updatedTasks });

    // Atualiza localmente a lista de tarefas
    this.taskLists[listIndex].tasks = updatedTasks;
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
    }
  },


    // Método para atualizar o status da tarefa (completa ou pendente) no Firestore
    async updateTaskStatus(listIndex, taskIndex, completed) {
      try {
        // Pega a lista e a tarefa específica
        const list = this.taskLists[listIndex];
        const updatedTasks = [...list.tasks]; // Cria uma cópia das tarefas
        updatedTasks[taskIndex].completed = completed; // Atualiza o status da tarefa

        // Atualiza o Firestore com a nova lista de tarefas
        const listRef = doc(db, 'taskLists', list.id);
        await updateDoc(listRef, { tasks: updatedTasks });

        // Atualiza localmente a lista
        this.taskLists[listIndex].tasks = updatedTasks;
      } catch (error) {
        console.error('Erro ao atualizar o estado da tarefa no Firestore:', error);
      }
    },

    // Método para remover uma lista de tarefas inteira
    async removeTaskList(listId) {
  // Verifique se o listId é uma string válida
    if (typeof listId !== 'string') {
    console.error('Erro: listId inválido. Esperado uma string, mas recebido:', listId);
    return;
    }

    try {
    // Deletar a lista do Firestore usando o ID correto
    const listRef = doc(db, 'taskLists', listId);
    await deleteDoc(listRef);

    // Atualizar localmente, removendo a lista da interface do usuário
    this.taskLists = this.taskLists.filter(list => list.id !== listId);
    } catch (error) {
    console.error('Erro ao remover a lista de tarefas:', error);
      } 
    }
  }
};
</script>

<style scoped>
.todo-list-container {
  padding: 20px;
}

.task-lists {
  margin-top: 20px;
}

.task-list {
  background-color: #f5f5f5;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 5px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
</style>
