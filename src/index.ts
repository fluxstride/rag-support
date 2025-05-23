import { ChatController } from "./resources/chat/chat.controller";
import { App } from "./app";
import { AuthController } from "./resources/auth/auth.controler";
import { ProfileController } from "./resources/profile/profile.controller";
import { MessageController } from "./resources/message/message.controller";
import "dotenv/config";
// import { TrainController } from "./resources/train/train.controller";
// import { DataController } from "./resources/data/data.controller";

const PORT = Number(process.env.PORT || 5000);

const app = new App(
  [
    new AuthController(),
    new ChatController(),
    new ProfileController(),
    new MessageController(),
    // new TrainController(),
    // new DataController(),
  ],
  PORT,
);

// if (process.env.NODE_ENV === "development") {
app.listen();
// }

export default app.express;
