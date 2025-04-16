import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '@/types/todo';
import { todoEvents, TODO_EVENTS } from './eventEmitter';

const STORAGE_KEY = '@todos';
const TAGS_STORAGE_KEY = '@tags';
const SNOOZE_DURATION_KEY = '@snooze_duration';

// Basic storage operations
export const getTodos = async (): Promise<Todo[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Failed to load todos.", e);
    return [];
  }
};

export const saveTodos = async (todos: Todo[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(todos);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    // Emit general storage changed event
    todoEvents.emit(TODO_EVENTS.STORAGE_CHANGED);
  } catch (e) {
    console.error("Failed to save todos.", e);
  }
};

// Enhanced CRUD operations for todos with events
export const addTodo = async (newTodo: Todo): Promise<boolean> => {
  try {
    const currentTodos = await getTodos();
    const updatedTodos = [...currentTodos, newTodo];
    await saveTodos(updatedTodos);
    
    // Emit specific event
    todoEvents.emit(TODO_EVENTS.TODO_ADDED, newTodo);
    
    return true;
  } catch (e) {
    console.error("Failed to add todo.", e);
    return false;
  }
};

export const updateTodo = async (updatedTodo: Todo): Promise<boolean> => {
  try {
    const currentTodos = await getTodos();
    const updatedTodos = currentTodos.map(todo => 
      todo.id === updatedTodo.id ? updatedTodo : todo
    );
    await saveTodos(updatedTodos);
    
    // Emit specific event
    todoEvents.emit(TODO_EVENTS.TODO_UPDATED, updatedTodo);
    
    return true;
  } catch (e) {
    console.error("Failed to update todo.", e);
    return false;
  }
};

export const deleteTodo = async (id: string): Promise<boolean> => {
  try {
    const currentTodos = await getTodos();
    const todoToDelete = currentTodos.find(todo => todo.id === id);
    const updatedTodos = currentTodos.filter(todo => todo.id !== id);
    await saveTodos(updatedTodos);
    
    // Emit specific event
    if (todoToDelete) {
      todoEvents.emit(TODO_EVENTS.TODO_DELETED, todoToDelete);
    }
    
    return true;
  } catch (e) {
    console.error("Failed to delete todo.", e);
    return false;
  }
};

export const toggleTodoCompletion = async (id: string): Promise<{success: boolean, newTodo?: Todo}> => {
  try {
    const currentTodos = await getTodos();
    let newTodo: Todo | undefined;
    
    const updatedTodos = currentTodos.map(todo => {
      if (todo.id === id) {
        const updatedTodo = { ...todo, completed: !todo.completed };
        newTodo = updatedTodo;
        return updatedTodo;
      }
      return todo;
    });
    
    await saveTodos(updatedTodos);
    
    // Emit specific event
    if (newTodo) {
      todoEvents.emit(TODO_EVENTS.TODO_COMPLETED, newTodo);
    }
    
    return { success: true, newTodo };
  } catch (e) {
    console.error("Failed to toggle todo completion.", e);
    return { success: false };
  }
};

export const snoozeTodo = async (id: string, hours: number): Promise<{success: boolean, newDueDate?: string}> => {
  try {
    const currentTodos = await getTodos();
    let newDueDate: string | undefined;
    
    const updatedTodos = currentTodos.map(todo => {
      if (todo.id === id) {
        const currentDate = new Date(todo.dueDate + 'T00:00:00');
        currentDate.setHours(currentDate.getHours() + hours);
        newDueDate = currentDate.toISOString().split('T')[0];
        
        return { ...todo, dueDate: newDueDate };
      }
      return todo;
    });
    
    await saveTodos(updatedTodos);
    
    // Emit specific event
    todoEvents.emit(TODO_EVENTS.TODO_SNOOZED, { id, hours });
    
    return { success: true, newDueDate };
  } catch (e) {
    console.error("Failed to snooze todo.", e);
    return { success: false };
  }
};

// Tags management
export const getTags = async (): Promise<Record<string, string[]>> => {
  try {
    const jsonValue = await AsyncStorage.getItem(TAGS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {};
  } catch (e) {
    console.error("Failed to load tags.", e);
    return {};
  }
};

export const saveTags = async (tags: Record<string, string[]>): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(tags);
    await AsyncStorage.setItem(TAGS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Failed to save tags.", e);
  }
};

// Snooze duration management
export const getSnoozeDuration = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(SNOOZE_DURATION_KEY);
    return value != null ? parseInt(value, 10) : 24; // Default 24 hours
  } catch (e) {
    console.error("Failed to load snooze duration.", e);
    return 24; // Default value
  }
};

export const saveSnoozeDuration = async (hours: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(SNOOZE_DURATION_KEY, hours.toString());
  } catch (e) {
    console.error("Failed to save snooze duration.", e);
  }
};
