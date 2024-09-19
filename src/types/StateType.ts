import { Types } from "mongoose"

export type StateType = {
    _id: Types.ObjectId | string;
    name: string;
}