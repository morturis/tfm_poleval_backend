import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";

//Wrapper that adds a try catch block to any request
export const wrapControllerMiddleware =
  (
    controllerMethod: (
      req: Request<any, any, any>,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) =>
  async (req: Request<any, any, any>, res: Response, next: NextFunction) => {
    try {
      await controllerMethod(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export const validateBodySchema =
  (schema: ZodSchema) =>
  (req: Request<any, any, any>, res: Response, next: NextFunction) => {
    const { body } = req;
    //Type checking
    const parsingResult = schema.safeParse(body);
    if (!parsingResult.success) {
      throw errors.create(ErrorMessages.bad_request, parsingResult);
    }
    next();
  };
