export class EmailAlreadyExistsError extends Error {
    constructor () {
        super("Email already exits");
        this.name = "EmailAlreadyExistsError";
    }
}

