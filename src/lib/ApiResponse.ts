import { type Response } from "express";

export class ApiResponse<T> {
  public readonly success = true;

  constructor(
    public readonly data: T,
    public readonly message: string = "Success",
  ) {}

  send(res: Response, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: this.success,
      data: this.data,
      message: this.message,
    });
  }
}
