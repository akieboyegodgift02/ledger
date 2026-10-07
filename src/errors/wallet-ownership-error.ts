export class WalletOwnershipError extends Error {
    constructor() {
        super("You do not own this wallet");
        this.name = "WalletOwnershipError";
    }
}