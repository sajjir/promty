// src/server/services/EventBus.ts
import { AppEvent, AppEventType, IEventHandler } from "../domain/Event";

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<AppEventType, IEventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe(type: AppEventType, handler: IEventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  public async publish(event: AppEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    // Process asynchronously to avoid blocking the user thread
    handlers.forEach((handler) => {
      handler.handle(event).catch((err) => {
        console.error(`[EventBus] Error handling event ${event.type}:`, err);
      });
    });
  }
}
