
export class AppError extends Error {
    statusCode: number;
    status: string;
    constructor(message: string, statusCode: number, status = "ERROR") {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.status = status;
    }
}