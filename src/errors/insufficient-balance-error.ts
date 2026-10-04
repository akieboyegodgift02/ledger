export class InsufficientBalanceError extends Error {
    constructor () {
        super("Insufficient balance");
        this.name = "InsufficientBalanceError";
    }
}