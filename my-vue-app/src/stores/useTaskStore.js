import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db, auth } from '../firebase';
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
  const taskLists = ref([]); //reativo?
  const userId = ref(null);
  const loading = ref(false);

  
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

    
      for (let i = 0; i < taskLists.value.length; i++) {
        await loadTasks(i);
      }
    } catch (error) {
      console.error('Erro ao carregar as listas de tarefas:', error);
    } finally {
      loading.value = false;
    }
  };

  
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

  
  const removeTaskList = async (listId) => {
    try {
      
      const tasksCollectionRef = collection(db, 'taskLists', listId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollectionRef);
      const deletePromises = tasksSnapshot.docs.map((taskDoc) =>
        deleteDoc(doc(db, 'taskLists', listId, 'tasks', taskDoc.id))
      );
      await Promise.all(deletePromises);

      
      await deleteDoc(doc(db, 'taskLists', listId));  //deleta a lista

      // Atualiza localmente
      taskLists.value = taskLists.value.filter((list) => list.id !== listId);
    } catch (error) {
      console.error('Erro ao remover a lista de tarefas:', error);
    }
  };

  
  const addTask = async (listIndex) => {       //add nova tarefa a uma lista
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

        
        list.tasks.push(newTask);  //att local

        
        list.newTaskTitle = '';     //passa a vassoura no input
        list.newTaskDescription = '';
      } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
      }
    }
  };

  
  const removeTask = async (listIndex, taskIndex) => {  // motodo remover uma tarefa da lista 
    const list = taskLists.value[listIndex];
    const task = list.tasks[taskIndex];

    try {
      await deleteDoc(
        doc(db, 'taskLists', list.id, 'tasks', task.id)
      );

      
      list.tasks.splice(taskIndex, 1);
    } catch (error) {
      console.error('Erro ao remover a tarefa:', error);
    }
  };


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

      
      task.status = status;
    } catch (error) {
      console.error('Erro ao atualizar o status da tarefa:', error);
    }
  };

  
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

      
      task.title = updatedTask.title;
      task.description = updatedTask.description;
    } catch (error) {
      console.error('Erro ao editar a tarefa:', error);
    }
  };

  
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
