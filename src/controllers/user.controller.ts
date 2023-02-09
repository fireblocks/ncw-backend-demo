import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  constructor(private readonly service: UserService) {}

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { auth } = req;
      if (!auth) {
        throw new Error("Missing auth context");
      }
      const { sub } = auth.payload;
      if (!sub) {
        throw new Error("Missing auth subject");
      }
      const user = await this.service.findOrCreate(sub);
      res.json({
        id: user.id,
      });
    } catch (e) {
      return next(e);
    }
  }
}
