import { Request, Response, Router } from "express";
import asyncWrap from "../../utils/asyncWrapper";
import {
  messageInsertSchema,
  messages as messagesSchema,
  type NewMessageParams,
  type UpdatedMessageParams,
  messageUpdateSchema,
} from "../../lib/db/schema/messages";
import validation from "../../middlewares/validation.middleware";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";

export class MessageController {
  router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      "/messages",
      validation(messageInsertSchema),
      this.sendMessage,
    );
    this.router.get("/messages", this.getMessages);
    this.router.get("/messages/count", this.getMessagesCount);
    this.router.patch(
      "/messages/:messageId",
      validation(messageUpdateSchema),
      this.updateMessage,
    );
  }

  private sendMessage = asyncWrap(async (req: Request, res: Response) => {
    const message: NewMessageParams = req.body;

    await db.insert(messagesSchema).values(message);

    res.status(201).json({ success: true });
  });

  private getMessages = asyncWrap(async (req: Request, res: Response) => {
    const readStatus = req.query.readStatus as "read" | "unread";

    if (readStatus) {
      const messages = await db
        .select()
        .from(messagesSchema)
        .where(eq(messagesSchema.readStatus, readStatus));

      res.status(201).json({ success: true, messages });
      return;
    }

    const messages = await db.select().from(messagesSchema);

    res.status(201).json({ success: true, messages });
  });

  private getMessagesCount = asyncWrap(async (req: Request, res: Response) => {
    const totalMessages = (await db.select().from(messagesSchema)).length;
    const readMessages = (
      await db
        .select()
        .from(messagesSchema)
        .where(eq(messagesSchema.readStatus, "read"))
    ).length;
    const unreadMessages = (
      await db
        .select()
        .from(messagesSchema)
        .where(eq(messagesSchema.readStatus, "unread"))
    ).length;

    res.status(201).json({
      success: true,
      data: {
        totalMessages,
        readMessages,
        unreadMessages,
      },
    });
  });

  private updateMessage = asyncWrap(async (req: Request, res: Response) => {
    const message: UpdatedMessageParams = req.body;
    const messageId = req.params.messageId;

    await db
      .update(messagesSchema)
      .set(message)
      .where(eq(messagesSchema.id, messageId));

    res.status(201).json({ success: true, message: "Message has been read" });
  });
}
