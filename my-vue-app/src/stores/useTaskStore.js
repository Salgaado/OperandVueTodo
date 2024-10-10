// src/stores/useTaskStore.js

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db, auth } from '../firebase'; // Importe suas instâncias do Firebase
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

export const useTaskStore = defineStore('task', () => {
  // Estado reativo
  const taskLists = ref([]);
  const userId = ref(null);
  const loading = ref(false);

  // Ação para carregar as listas de tarefas do usuário
  const loadTaskLists = async () => {
    if (!userId.value) return;
    loading.value = true;
    try {
      const q = query(
        collection(db, 'taskLists'),
        where('userId', '==', userId.value)
      );
      const querySnapshot = await getDocs(q);

      taskLists.value = [];

      for (const docSnap of querySnapshot.docs) {
        const listData = {
          id: docSnap.id,
          ...docSnap.data(),
          tasks: [],
          newTaskTitle: '',
          newTaskDescription: '',
        };
        taskLists.value.push(listData);
      }

      // Carregar tarefas para cada lista
      for (let i = 0; i < taskLists.value.length; i++) {
        await loadTasks(i);
      }
    } catch (error) {
      console.error('Erro ao carregar as listas de tarefas:', error);
    } finally {
      loading.value = false;
    }
  };

  // Ação para carregar as tarefas de uma lista específica
  const loadTasks = async (listIndex) => {
    const list = taskLists.value[listIndex];

    try {
      const tasksCollectionRef = collection(
        db,
        'taskLists',
        list.id,
        'tasks'
      );
      const tasksSnapshot = await getDocs(tasksCollectionRef);

      list.tasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erro ao carregar as tarefas:', error);
    }
  };

  // Ação para criar uma nova lista de tarefas
  const createTaskList = async (title) => {
    if (!title.trim()) return;

    const newList = {
      title,
      userId: userId.value,
    };

    try {
      const docRef = await addDoc(collection(db, 'taskLists'), newList);
      newList.id = docRef.id;
      newList.tasks = [];
      newList.newTaskTitle = '';
      newList.newTaskDescription = '';
      taskLists.value.push(newList);
    } catch (error) {
      console.error('Erro ao criar a lista de tarefas:', error);
    }
  };

  // Ação para remover uma lista de tarefas
  const removeTaskList = async (listId) => {
    try {
      // Deleta todas as tarefas da subcoleção 'tasks'
      const tasksCollectionRef = collection(db, 'taskLists', listId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollectionRef);
      const deletePromises = tasksSnapshot.docs.map((taskDoc) =>
        deleteDoc(doc(db, 'taskLists', listId, 'tasks', taskDoc.id))
      );
      await Promise.all(deletePromises);

      // Deleta a lista de tarefas
      await deleteDoc(doc(db, 'taskLists', listId));

      // Atualiza localmente
      taskLists.value = taskLists.value.filter((list) => list.id !== listId);
    } catch (error) {
      console.error('Erro ao remover a lista de tarefas:', error);
    }
  };

  // Ação para adicionar uma nova tarefa a uma lista
  const addTask = async (listIndex) => {
    const list = taskLists.value[listIndex];

    if (
      list.newTaskTitle.trim() &&
      list.newTaskDescription.trim()
    ) {
      const newTask = {
        title: list.newTaskTitle,
        description: list.newTaskDescription,
        status: 'pendente',
        createdAt: new Date(),
      };

      try {
        const tasksCollectionRef = collection(
          db,
          'taskLists',
          list.id,
          'tasks'
        );
        const docRef = await addDoc(tasksCollectionRef, newTask);
        newTask.id = docRef.id;

        // Atualiza localmente
        list.tasks.push(newTask);

        // Limpa os campos de input
        list.newTaskTitle = '';
        list.newTaskDescription = '';
      } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
      }
    }
  };

  // Ação para remover uma tarefa de uma lista
  const removeTask = async (listIndex, taskIndex) => {
    const list = taskLists.value[listIndex];
    const task = list.tasks[taskIndex];

    try {
      await deleteDoc(
        doc(db, 'taskLists', list.id, 'tasks', task.id)
      );

      // Atualiza localmente
      list.tasks.splice(taskIndex, 1);
    } catch (error) {
      console.error('Erro ao remover a tarefa:', error);
    }
  };

  // Ação para atualizar o status de uma tarefa
  const updateTaskStatus = async (listIndex, taskIndex, status) => {
    const list = taskLists.value[listIndex];
    const task = list.tasks[taskIndex];

    try {
      const taskRef = doc(
        db,
        'taskLists',
        list.id,
        'tasks',
        task.id
      );
      await updateDoc(taskRef, { status });

      // Atualiza localmente
      task.status = status;
    } catch (error) {
      console.error('Erro ao atualizar o status da tarefa:', error);
    }
  };

  // Ação para editar uma tarefa
  const editTask = async (listIndex, taskIndex, updatedTask) => {
    const list = taskLists.value[listIndex];
    const task = list.tasks[taskIndex];

    try {
      const taskRef = doc(
        db,
        'taskLists',
        list.id,
        'tasks',
        task.id
      );
      await updateDoc(taskRef, {
        title: updatedTask.title,
        description: updatedTask.description,
      });

      // Atualiza localmente
      task.title = updatedTask.title;
      task.description = updatedTask.description;
    } catch (error) {
      console.error('Erro ao editar a tarefa:', error);
    }
  };

  // Retorna o estado e as ações que serão acessíveis nos componentes
  return {
    taskLists,
    userId,
    loading,
    loadTaskLists,
    createTaskList,
    removeTaskList,
    addTask,
    removeTask,
    updateTaskStatus,
    editTask,
  };
});
