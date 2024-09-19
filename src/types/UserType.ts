import { Types } from "mongoose";

export type UserType = {
    id: Types.ObjectId | string;
    name: String;
    email: String;
    state: String;
    passwordHash: String;
    token: String;
}