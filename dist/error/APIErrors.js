export class ApiError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
export class BadRequestError extends ApiError {
    constructor(message) {
        super(400, message);
    }
}
export class UnauthorizedError extends ApiError {
    constructor(message) {
        super(401, message);
    }
}
export class ForbiddenError extends ApiError {
    constructor(message) {
        super(403, message);
    }
}
export class NotFoundError extends ApiError {
    constructor(message) {
        super(404, message);
    }
}
