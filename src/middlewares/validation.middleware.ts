import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

function validation(schema: ZodSchema) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const value = schema.parse(req.body);
      req.body = value;
      return next();
    } catch (error: any) {
      let errors: any = {};

      (error as ZodError).issues.forEach(({ path: [path], message }) => {
        if (errors[path]) {
          errors[path] = [...errors[path], message];
          return;
        }

        errors[path] = [message];
      });

      res.status(400).json({
        success: false,
        errors,
      });
    }
  };
}

export default validation;
