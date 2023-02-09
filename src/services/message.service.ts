import { Message } from "../model/message";
import { IsNull, LessThan } from "typeorm";
import { visibilityTimeout } from "../app";
import { MessageSubscriber } from "../subscribers/message.subscriber";
import ms from "ms";

const msgSubscriber = new MessageSubscriber();

export async function deleteMessage(
  messageId: string,
  deviceId: string,
  sub: string,
) {
  return await Message.delete({
    id: Number(messageId),
    device: {
      id: deviceId,
      user: { sub },
    },
  });
}

export async function getMessages(
  deviceId: string,
  sub: string,
  batchSize: number,
  physicalDeviceId: string | undefined,
  timeout: number,
) {
  const device = {
    id: deviceId,
    user: { sub },
  };

  let messages = await Message.getRepository().manager.transaction(
    async (transactional) => {
      const messages = await transactional.find(Message, {
        take: batchSize,
        order: { id: "ASC" },
        where: [
          // either unseen messages
          {
            physicalDeviceId,
            lastSeen: IsNull(),
            device,
          },
          // or - messages that were last seen after a visibility timeout
          {
            physicalDeviceId,
            lastSeen: LessThan(new Date(Date.now() - visibilityTimeout)),
            device,
          },
        ],
        relations: ["device", "device.user"],
      });

      messages.forEach((m) => {
        m.lastSeen = new Date();
      });

      await transactional.save(messages);
      return messages;
    },
  );

  if (messages.length === 0) {
    messages = await msgSubscriber.waitForMessages(
      device!.id,
      timeout * 1000,
      physicalDeviceId,
    );
  }
  return messages;
}

export async function staleMessageCleanup() {
  try {
    const stale = new Date(Date.now() - ms("3 days"));
    console.log(
      `cleanup: deleting stale messages: before ${stale.toDateString()}...`,
    );
    const result = await Message.delete({ createdAt: LessThan(stale) });
    if (result.affected) {
      console.log(`cleanup: deleted ${result.affected} stale messages`);
    }
  } catch (e) {
    console.error("cleanup: failed", e);
  }
}
