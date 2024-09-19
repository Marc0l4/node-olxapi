import { Types } from "mongoose";

export type CategoryType = {
    id: Types.ObjectId | string;
    name: String;
    slug: String;
}