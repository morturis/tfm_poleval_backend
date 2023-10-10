import { Request, Response } from "express";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { Evaluation } from "../../app/types/Evaluation.type";
import { Controller } from "./AbstractController";

export class EvaluationController extends Controller<Evaluation> {
  async form(req: Request<{ id: string }, any, Evaluation>, res: Response) {
    const {
      params: { id },
    } = req;
    const evaluation = await Controller.database.get<Evaluation>(id);

    if (!evaluation) throw errors.create(ErrorMessages.not_found);

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
    const evaluation = await Controller.database.get<Evaluation>(id);
    if (!evaluation) throw errors.create(ErrorMessages.not_found);

    evaluation.responses = [...(evaluation.responses || []), body];

    const result = await Controller.database.set(id, evaluation);

    res.status(201).send(body);
  }
}
