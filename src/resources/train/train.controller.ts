// import { Router, Request, Response } from "express";
// import { AuthenticatedRequest } from "../../middlewares/authCheck.middleware";
// import asyncWrap from "../../utils/asyncWrapper";
// import multer from "multer";
//
// export class TrainController {
//   router: Router;
//
//   constructor() {
//     this.router = Router();
//     this.initRoutes();
//   }
//
//   initRoutes() {
//     const storage = multer.memoryStorage();
//     const upload = multer({ storage });
//
//     this.router.post("/train", upload.single("file"), this.train);
//   }
//
//   private train = asyncWrap(
//     async (req: AuthenticatedRequest, res: Response) => {
//       console.log(req.file?.buffer);
//
//       //       const buffer = Buffer.from(req.file?.buffer);
//       //
//       //       console.log(buffer.toString());
//
//       res.status(200).json({ success: true });
//     },
//   );
// }
