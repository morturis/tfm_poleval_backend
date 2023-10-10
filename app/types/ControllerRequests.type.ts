import { NextFunction, Request, Response } from "express";

export type AsyncRequest = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void>;
