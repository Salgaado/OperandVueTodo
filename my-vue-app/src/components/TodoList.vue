
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
          v-model="list.newTaskTitle"
          placeholder="Título da nova tarefa"
          clearable
          @keyup.enter="addTask(index)"
        ></el-input>
        <el-input
          v-model="list.newTaskDescription"
          placeholder="Descrição da nova tarefa"
          clearable
          @keyup.enter="addTask(index)"
        ></el-input>
        <el-button @click="addTask(index)" type="primary">Adicionar Tarefa</el-button>

        <!-- Exibir tarefas dentro da lista -->
        <el-table :data="list.tasks" style="width: 100%">
          <el-table-column label="Título" prop="title"></el-table-column>
          <el-table-column label="Descrição" prop="description"></el-table-column>
          <el-table-column label="Status" prop="status" width="120">
            <template #default="scope">
              <el-checkbox
                v-model="scope.row.status"
                :true-label="'concluída'"
                :false-label="'pendente'"
                @change="updateTaskStatus(index, scope.$index, scope.row.status)"
              >
                {{ scope.row.status === 'concluída' ? 'Concluída' : 'Pendente' }}
              </el-checkbox>
            </template>
          </el-table-column>
          <el-table-column label="Criado em" prop="createdAt" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="Ações" width="150">
            <template #default="scope">
              <!-- Botão para editar a tarefa -->
              <el-button @click="editTask(index, scope.$index)" type="primary">Editar</el-button>
              <!-- Botão para remover a tarefa -->
              <el-button @click="removeTask(index, scope.$index)" type="danger">Excluir</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <!-- Modal de edição -->
    <el-dialog
      title="Editar Tarefa"
      v-model="editDialogVisible"
    >
      <el-form>
        <el-form-item label="Título">
          <el-input v-model="editTaskTitle"></el-input>
        </el-form-item>
        <el-form-item label="Descrição">
          <el-input v-model="editTaskDescription"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">Cancelar</el-button>
        <el-button type="primary" @click="saveTaskEdits">Salvar</el-button>
      </template>
    </el-dialog>
  </div>
</template>


<script>
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import logout from './logout.vue';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus';

export default {
  components:{
    logout,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
  },

  data() {
  return {
    newListTitle: '',
    taskLists: [],
    userId: null,
    editDialogVisible: false,
    taskBeingEdited: null,
    editTaskTitle: '',
    editTaskDescription: '',
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
      newTaskTitle: '',
      newTaskDescription: '',
      userId: this.userId,
      };

      try {
      const docRef = await addDoc(collection(db, 'taskLists'), newList);
      newList.id = docRef.id;

      this.taskLists.push(newList);

      this.newListTitle = '';
      } catch (error) {
      console.error('Erro ao criar a lista de tarefas:', error);
          }
        }
      },

      formatDate(timestamp) {
    if (!timestamp) return '';

    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.toDate) {
    date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

      return date.toLocaleString();
    }, 

    // Método para adicionar uma nova tarefa a uma lista específica
    async addTask(listIndex) {
    const list = this.taskLists[listIndex];

    if (list.newTaskTitle.trim() && list.newTaskDescription.trim()) {
      const newTask = {
        id: Date.now().toString(), // Gera um ID único
        title: list.newTaskTitle,
        description: list.newTaskDescription,
        status: 'pendente',
        createdAt: new Date(), // Usa timestamp do lado do cliente
      };

      const updatedTasks = [...list.tasks, newTask];

      try {
        const listRef = doc(db, 'taskLists', list.id);
        await updateDoc(listRef, { tasks: updatedTasks });

        this.taskLists[listIndex].tasks = updatedTasks;

        // Limpa os campos de input
        list.newTaskTitle = '';
        list.newTaskDescription = '';
        } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        }
      }
    },


    editTask(listIndex, taskIndex) {
    console.log('Método editTask chamado com listIndex:', listIndex, 'e taskIndex:', taskIndex);
    const list = this.taskLists[listIndex];
    const task = list.tasks[taskIndex];

    this.taskBeingEdited = {
      listIndex,
      taskIndex,
      listId: list.id,
      taskId: task.id,
    };
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description;
    this.editDialogVisible = true;
    console.log('editDialogVisible:', this.editDialogVisible);
  },

  // Salva as alterações feitas na tarefa
    async saveTaskEdits() {
    const { listIndex, taskIndex, listId } = this.taskBeingEdited;
    const list = this.taskLists[listIndex];
    const updatedTasks = [...list.tasks];

    updatedTasks[taskIndex].title = this.editTaskTitle;
    updatedTasks[taskIndex].description = this.editTaskDescription;

    try {
      const listRef = doc(db, 'taskLists', listId);
      await updateDoc(listRef, { tasks: updatedTasks });

      // Atualiza localmente
      this.taskLists[listIndex].tasks = updatedTasks;

      // Fecha o modal
      this.editDialogVisible = false;
    } catch (error) {
      console.error('Erro ao salvar as alterações da tarefa:', error);
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
    async updateTaskStatus(listIndex, taskIndex, status) {
    const list = this.taskLists[listIndex];
    const updatedTasks = [...list.tasks];
    updatedTasks[taskIndex].status = status;

    try {
    const listRef = doc(db, 'taskLists', list.id);
    await updateDoc(listRef, { tasks: updatedTasks });

    // Atualiza localmente
    this.taskLists[listIndex].tasks = updatedTasks;
    } catch (error) {
    console.error('Erro ao atualizar o status da tarefa:', error);
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
