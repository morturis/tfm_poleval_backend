import { NextFunction, Request, Response } from "express";
import { merge } from "lodash";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { EvaluationService } from "../../app/services/EvaluationService";
import { UserService } from "../../app/services/UserService";
import {
  Evaluation,
  EvaluationSchemaWithStateValidation,
  EvaluationStates,
} from "../../app/types/Evaluation.type";
import { Permissions, User } from "../../app/types/User.type";

export class EvaluationController {
  private static userService = new UserService();
  private static evaluationService = new EvaluationService();

  async getForm(req: Request<{ id: string }, any, any>, res: Response) {
    const {
      params: { id },
    } = req;
    const evaluation = await EvaluationController.evaluationService.get(id);

    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    if(!evaluation.published) throw errors.create(ErrorMessages.not_published)

    res.status(200).send(evaluation.form || {});
  }

  async answer(
    req: Request<{ id: string }, any, Record<string, string>>,
    res: Response
  ) {
    const {
      params: { id },
      body,
    } = req;
    const evaluation = await EvaluationController.evaluationService.get(id);
    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    evaluation.responses = [...(evaluation.responses || []), body];

    const result = await EvaluationController.evaluationService.update(
      id,
      evaluation
    );
    if (!result) throw errors.create(ErrorMessages.internal_server_error);

    res.status(201).send(body); //respond with the original answer
  }

  async getAllByUser(
    req: Request<Record<string, unknown>, any, any>,
    res: Response
  ) {
    let user = { ...(req.params?.user as User) };
    if (!user) throw errors.create(ErrorMessages.bad_request);

    user = await EvaluationController.userService.get(user.username);
    const result: Record<string, Record<string, unknown>> = {};
    for (const ev of user.evaluations) {
      const { eval_name, permissions } = ev;

      //In case we ever want to add a state or something similar
      const evaluation = await EvaluationController.evaluationService.get(
        eval_name
      );
      if (!evaluation) continue;

      permissions.forEach(
        (perm) =>
          (result[perm] = {
            ...(result[perm] || {}),
            [`${Object.keys(result[perm] || {}).length}`]: {
              code: eval_name,
              intervention_name: evaluation?.intervention?.name || "-",
              state: evaluation.state || "-",
            },
          })
      );
    }
    res.status(200).send(result);
  }

  async checkExistence(
    req: Request<{ id: string }, any, Evaluation>,
    res: Response
  ) {
    const {
      params: { id },
    } = req;
    const evaluation = await EvaluationController.evaluationService.get(id);

    if (evaluation) res.status(200).send({ code: evaluation.code });

    throw errors.create(ErrorMessages.not_found);
  }

  async create(
    req: Request<{ id: string; user: User }, any, Evaluation>,
    res: Response
  ) {
    const { body } = req;
    const {
      params: { user },
    } = req;
    const result = await EvaluationController.evaluationService.create(body);

    const alreadyExistingUser = await EvaluationController.userService.get(
      user.username
    );

    if (!alreadyExistingUser) throw errors.create(ErrorMessages.not_found);

    alreadyExistingUser.evaluations.push({
      eval_name: result.code,
      permissions: [Permissions.EDIT_EVAL, Permissions.FILL_FORM],
    });
    await EvaluationController.userService.update(
      user.username,
      alreadyExistingUser
    );

    res.status(200).send(result);
  }

  async get(req: Request<{ id: string }, any, Evaluation>, res: Response) {
    const {
      params: { id },
    } = req;
    const evaluation = await EvaluationController.evaluationService.get(id);

    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    res.status(200).send(evaluation);
  }
  async update(req: Request<{ id: string }, any, Evaluation>, res: Response) {
    const {
      params: { id },
      body,
    } = req;
    const currentlyExistingEvaluation =
      await EvaluationController.evaluationService.get(id);

    if (!currentlyExistingEvaluation)
      throw errors.create(ErrorMessages.not_found);

    const response = await EvaluationController.evaluationService.update(
      id,
      body
    );
    res.status(200).send(response);
  }

  middleware = {
    preventModifyingPropertiesBasedOnState: async (
      req: Request<{ id: string }, any, Evaluation>,
      res: Response,
      next: NextFunction
    ) => {
      const {
        params: { id },
        body,
      } = req;

      const currentlyExistingEvaluation =
        await EvaluationController.evaluationService.get(id);

      const mergedEvaluation = EvaluationSchemaWithStateValidation.safeParse(
        merge(currentlyExistingEvaluation, body)
      );

      if (!mergedEvaluation.success)
        throw errors.create(
          ErrorMessages.bad_request,
          mergedEvaluation.error.message
        );
      if (body.state && mergedEvaluation.data.state !== body.state)
        throw errors.create(
          ErrorMessages.bad_request,
          "State may not be modified"
        );

      const stateAfterModification = mergedEvaluation.data.state;
      const allowedPropertiesPerState: Record<
        EvaluationStates,
        (keyof Evaluation)[]
      > = {
        [EvaluationStates.FIRST_STEPS]: [
          "code",
          "state",
          "indicators", //creating indicators for the first time
          "intervention",
          "org",
          "lifeCycle",
          "goal",
          "reason",
          "utility",
          "delimitation",
          "teamMembers",
          "tools",
          "techniques",
          "criteria",
        ],
        [EvaluationStates.DESIGNING_FORM]: ["code", "form"],
        [EvaluationStates.ACCEPTING_RESPONSES]: ["code", "indicators"], //editing indicator measurements
        [EvaluationStates.CONCLUSIONS]: [
          "code",
          "conclusions",
          "recomendations",
        ],
      };

      const propertiesModifiableInCurrentStep =
        allowedPropertiesPerState[stateAfterModification];
      const propertiesAttempingToModify = Object.keys(
        body
      ) as (keyof Evaluation)[];

      for (let property of propertiesAttempingToModify)
        if (!propertiesModifiableInCurrentStep.includes(property))
          throw errors.create(
            ErrorMessages.bad_request,
            `Attempting to modify properties not allowed to by the flow: ${property}`
          );

      req.body = mergedEvaluation.data;
      next();
    },
    preventModifyingState: async (
      req: Request<{ id: string }, any, Evaluation>,
      res: Response,
      next: NextFunction
    ) => {
      const {
        params: { id },
        body,
      } = req;
      const currentlyExistingEvaluation =
        await EvaluationController.evaluationService.get(id);
      const mergedEvaluation = EvaluationSchemaWithStateValidation.safeParse(
        merge(currentlyExistingEvaluation, body)
      );
      if (!mergedEvaluation.success)
        throw errors.create(
          ErrorMessages.bad_request,
          mergedEvaluation.error.message
        );
      if (body.state && mergedEvaluation.data.state !== body.state)
        throw errors.create(
          ErrorMessages.bad_request,
          "State may not be modified"
        );
      req.body.state = mergedEvaluation.data.state;
      next();
    },
  };
}
