import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import HttpException from "../utils/http.exception";
// import asyncWrap from "../utils/asyncWrapper";

export interface AuthenticatedRequest extends Request {
  uid?: string;
}

export const authCheck = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.accessToken;

  if (!token) {
    throw new HttpException(401, "Unauthorized");
  }

  const secretKey = process.env.SECRETKEY as string;

  jwt.verify(token, secretKey, (error: any, payload: any) => {
    if (error) {
      throw new HttpException(401, "Unauthorized");
    }

    req.uid = payload.uid;
    next();
  });
};
