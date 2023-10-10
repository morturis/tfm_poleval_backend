import { NextFunction, Request, Response } from "express";
import * as jose from "jose";
import { ZodSchema } from "zod";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { Permissions, User } from "../../app/types/User.type";

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

//Signing
const signingSecret = new TextEncoder().encode(
  "OQHHP3ldnKqfAFUEN0Miv84i2AZNtoyt"
);
const signingAlgorithm = "HS256";
export const encodeToken = async (obj: Record<string, unknown>) => {
  return await new jose.SignJWT(obj)
    .setProtectedHeader({ alg: signingAlgorithm })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(signingSecret);
};
//TODO this method is only really relevant to evaluations
export const verifyUserPermissions =
  (requiredPermission: Permissions) =>
  async (
    req: Request<{ id: string }, any, any>,
    res: Response,
    next: NextFunction
  ) => {
    const authToken = req.headers["x-access-token"] as string;
    if (!authToken)
      throw errors.create(ErrorMessages.unauthorized, "Auth token missing");

    const decodedToken = await jose.jwtVerify(authToken, signingSecret);
    const loggedUser = decodedToken.payload as User;
    if (!loggedUser)
      throw errors.create(ErrorMessages.unauthorized, "JWT validaton error");

    const {
      params: { id },
    } = req;

    const userEvaluation = loggedUser.evaluations.find(
      (evaluation) => evaluation.eval_name === id
    );
    if (!userEvaluation)
      throw errors.create(
        ErrorMessages.unauthorized,
        "User cannot access chosen evaluation"
      );

    const userHasProperPermissions = userEvaluation.permissions?.find(
      (permissions) => permissions === requiredPermission
    );

    if (!userHasProperPermissions)
      throw errors.create(
        ErrorMessages.unauthorized,
        `User does not have the necessary permissions on Evaluation "${id}"`
      );

    next();
  };