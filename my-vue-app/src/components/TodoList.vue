<template>
  <div class="todo-list-container">
    <logout/>
    <h1 v-if="loading">Carregando...</h1>
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

    <!-- Exibir as listas de tarefas -->
    <el-row :gutter="20" class="task-lists">
      <el-col
        v-for="(list, index) in taskLists"
        :key="list.id"
        :span="24"
        class="task-list"
      >
        <!-- Cabeçalho da lista -->
        <div class="list-header">
          <h3>{{ list.title }}</h3>
          <el-button @click="removeTaskList(list.id)" type="danger">Excluir Lista</el-button>
        </div>

        <!-- Inputs para adicionar novas tarefas -->
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

    <!-- Diálogo de Edição -->
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
import { onMounted, computed, ref } from 'vue';
import { useTaskStore } from '../stores/useTaskStore'; // Importe a store
import { auth } from '../firebase';
import Logout from './Logout.vue'; // Importe outros componentes necessários

export default {
  name: 'TodoList',
  components: {
    Logout,

  },
  setup() {
    const taskStore = useTaskStore();

    // Computed properties para acessar o estado
    const taskLists = computed(() => taskStore.taskLists);
    const loading = computed(() => taskStore.loading);

    // Campo para criação de nova lista
    const newListTitle = ref('');

    // Campos para o modal de edição de tarefas
    const editDialogVisible = ref(false);
    const editTaskTitle = ref('');
    const editTaskDescription = ref('');
    const taskBeingEdited = ref(null);

    onMounted(() => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          taskStore.userId = user.uid;
          await taskStore.loadTaskLists();
        } else {
          // Redireciona para login se não autenticado
          window.location.href = '/login';
        }
      });
    });

    // Métodos para interagir com a store
    const createTaskList = () => {
      taskStore.createTaskList(newListTitle.value);
      newListTitle.value = '';
    };

    const removeTaskList = (listId) => {
      taskStore.removeTaskList(listId);
    };

    const addTask = (listIndex) => {
      taskStore.addTask(listIndex);
    };

    const removeTask = (listIndex, taskIndex) => {
      taskStore.removeTask(listIndex, taskIndex);
    };

    const updateTaskStatus = (listIndex, taskIndex, status) => {
      taskStore.updateTaskStatus(listIndex, taskIndex, status);
    };

    const editTask = (listIndex, taskIndex) => {
      const list = taskLists.value[listIndex];
      const task = list.tasks[taskIndex];

      taskBeingEdited.value = {
        listIndex,
        taskIndex,
        listId: list.id,
        taskId: task.id,
      };
      editTaskTitle.value = task.title;
      editTaskDescription.value = task.description;
      editDialogVisible.value = true;
    };

    const saveTaskEdits = () => {
      const { listIndex, taskIndex } = taskBeingEdited.value;
      const updatedTask = {
        title: editTaskTitle.value,
        description: editTaskDescription.value,
      };
      taskStore.editTask(listIndex, taskIndex, updatedTask);
      editDialogVisible.value = false;
    };

    const formatDate = (timestamp) => {
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
    };

    return {
      taskLists,
      loading,
      newListTitle,
      createTaskList,
      removeTaskList,
      addTask,
      removeTask,
      updateTaskStatus,
      editTask,
      editDialogVisible,
      editTaskTitle,
      editTaskDescription,
      saveTaskEdits,
      formatDate,
    };
  },
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

.el-table td.el-table__cell div {
    display: flex !important;
    box-sizing: border-box;
}

.el-button+.el-button {
  margin-left: 0px;
}


</style>
