import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  IsNull,
} from "typeorm";
import { Message } from "../model/message";
import EventEmitter from "events";

const emitter = new EventEmitter();

@EventSubscriber()
export class MessageSubscriber implements EntitySubscriberInterface {
  listenTo() {
    return Message;
  }

  afterInsert(event: InsertEvent<Message>) {
    // note: when running this server in multiple instances this event should be distributed to all nodes
    emitter.emit(`message:${event.entity.deviceId}`, event.entity);
    if (event.entity.physicalDeviceId) {
      emitter.emit(
        `message:${event.entity.deviceId}:${event.entity.physicalDeviceId}`,
        event.entity,
      );
    }
  }

  async waitForMessages(
    deviceId: string,
    timeout: number,
    physicalDeviceId?: string,
  ): Promise<Message[]> {
    const controller = new AbortController();
    const promise = physicalDeviceId
      ? EventEmitter.once(emitter, `message:${deviceId}:${physicalDeviceId}`, {
          signal: controller.signal,
        })
      : EventEmitter.once(emitter, `message:${deviceId}`, {
          signal: controller.signal,
        });

    const timer = setTimeout(controller.abort.bind(controller), timeout);
    try {
      const msg: Message = (await promise)[0];
      clearTimeout(timer);
      msg.lastSeen = new Date();
      const result = await Message.update(
        { id: msg.id, lastSeen: IsNull() },
        { lastSeen: msg.lastSeen },
      );
      if (result.affected) {
        return [msg];
      } else {
        return [];
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return [];
      }
      throw error;
    }
  }
}
