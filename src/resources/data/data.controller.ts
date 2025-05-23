import { Request, Response, Router } from "express";
import asyncWrap from "../../utils/asyncWrapper";
import multer from "multer";
import HttpException from "../../utils/http.exception";
// import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { db } from "../../lib/db";
import { dataCategory, file as fileSchema } from "../../lib/db/schema/data";

const diskStorage = multer.diskStorage({
  destination: process.cwd() + "/uploads",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const memoryStorage = multer.memoryStorage();

// const diskUpload = multer({ storage: diskStorage });
const memoryUpload = multer({ storage: memoryStorage });

export class DataController {
  router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      "/data/files/:categoryId",
      memoryUpload.single("file"),
      this.uploadFile,
    );
    this.router.post("/data/files", this.getFiles);

    this.router.post("/data/categories", this.createDataCategory);
    this.router.get("/data/categories", this.getCategories);
  }

  private createDataCategory = asyncWrap(
    async (req: Request, res: Response) => {
      const body = req.body;

      await db.insert(dataCategory).values(body);

      res.status(201).json({
        success: true,
        message: "Data Category created successfully",
      });
    },
  );

  private getCategories = asyncWrap(async (req: Request, res: Response) => {
    const categories = await db.select().from(dataCategory);
    console.log(categories);

    res.status(201).json({
      success: true,
      categories,
    });
  });

  private getFiles = asyncWrap(async (req: Request, res: Response) => {
    const body = req.body;

    const files = await db.select().from(fileSchema);
    console.log(files);

    res.status(201).json({
      success: true,
      files,
    });
  });

  private uploadFile = asyncWrap(async (req, res) => {
    const file = req.file;
    const categoryId = req.params.categoryId;

    console.log({ categoryId });

    if (!file) {
      throw new HttpException(400, `Kindly attach a document to this request`);
    }

    const fileId = uuidv4();

    const filePath = `${fileId}-v-${new Date().getTime()}${path.extname(
      file.originalname,
    )}`;

    await db.insert(fileSchema).values({ categoryId, name: file.originalname });

    // const filePath = `${fileId}-v-${new Date().getTime()}${path.extname(
    //   file.originalname,
    // )}`;

    res.json({ filePath, file });
  });
}
