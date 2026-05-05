/** 
 * Singleton class implementing an event bus for communication between different parts of the application.
 * This class ensures only one instance manages event listeners across the app.
*/ 

import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  // Private Static Instance Variable: holds the single instance of EventBus
  private static instance: EventBus; 

  // Private Constructor: prevents external instantiation
  private constructor() { super(); } 

  // Public Static Method: provides access to the single instance of EventBus
  static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }
}

export const eventBus = EventBus.getInstance();