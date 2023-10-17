import { NextFunction, Request, Response } from "express";
import { CustomError, ErrorMessages } from "./Errors.type";

const errorList: CustomError[] = [
  {
    code: 400,
    message: ErrorMessages.bad_request,
  },
  {
    code: 400,
    message: ErrorMessages.required_fields_missing,
  },
  {
    code: 403,
    message: ErrorMessages.unauthorized,
  },
  {
    code: 403,
    message: ErrorMessages.token_expired,
  },
  {
    code: 404,
    message: ErrorMessages.not_found,
  },
  {
    code: 409, //Conflict
    message: ErrorMessages.already_exists,
  },
];

export const errors = {
  create: (message: ErrorMessages, extraInfo?: unknown): CustomError => {
    const chosenError = errorList.find(
      (err: CustomError) => err.message === message
    ) || { code: 500, message };

    chosenError.extraInfo =
      typeof extraInfo === "string" ? extraInfo : JSON.stringify(extraInfo);

    return chosenError;
  },

  errorHandler: (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!err) return next();
    console.log("Error:", JSON.stringify(err)); //TODO improve logger
    res.status(err.code);
    return res.json({ error: err });
  },
};
