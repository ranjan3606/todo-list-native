type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  public on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return a function to unsubscribe
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  public emit(event: string, ...args: any[]): void {
    if (!this.events[event]) {
      return;
    }

    this.events[event].forEach(callback => {
      callback(...args);
    });
  }
}

// Create a singleton instance
export const todoEvents = new EventEmitter();

// Define event types
export const TODO_EVENTS = {
  TODO_ADDED: 'todo_added',
  TODO_UPDATED: 'todo_updated',
  TODO_DELETED: 'todo_deleted',
  TODO_COMPLETED: 'todo_completed',
  TODO_SNOOZED: 'todo_snoozed',
  STORAGE_CHANGED: 'storage_changed',
  // Add new tag event types
  TAG_ADDED: 'tag_added',
  TAG_UPDATED: 'tag_updated',
  TAG_DELETED: 'tag_deleted',
  TAGS_CHANGED: 'tags_changed'
};
