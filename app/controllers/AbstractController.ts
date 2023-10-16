import { Request, Response } from "express";
import { RedisDatabase } from "../../app/database/RedisDatabase";
import { ErrorMessages } from "../../app/errors/Errors.type";
import { errors } from "../../app/errors/errors";
import { merge } from "lodash";

export class Controller<T> {
  static database = new RedisDatabase();

  async get(req: Request<{ id: string }, any, T>, res: Response) {
    const {
      params: { id },
    } = req;
    const obj = await Controller.database.get(id);

    if (!obj) throw errors.create(ErrorMessages.not_found);

    res.status(200).send(obj);
  }
  async put(req: Request<{ id: string }, any, T>, res: Response) {
    const {
      params: { id },
      body,
    } = req;
    const obj = await Controller.database.get(id);

    if (!obj) throw errors.create(ErrorMessages.not_found); //if what I try to put does not exist

    const response = await Controller.database.set(id, body);
    res.status(200).send(response);
  }

  async patch(req: Request<{ id: string }, any, T>, res: Response) {
    const {
      params: { id },
      body,
    } = req;
    const obj = await Controller.database.get(id);

    if (!obj) throw errors.create(ErrorMessages.not_found);

    const modifiedObj = merge(obj, body);
    const response = await Controller.database.set(id, modifiedObj);
    res.status(200).send(response);
  }

  async delete(req: Request<{ id: string }, any, T>, res: Response) {
    const {
      params: { id },
    } = req;
    const result = await Controller.database.delete(id);

    res.status(200).send(result);
  }

  async post(req: Request<{ id: string }, any, T>, res: Response) {
    const { body } = req;
    const {
      params: { id },
    } = req;
    const result = await Controller.database.set(id, body);

    res.status(201).send(result);
  }
}
