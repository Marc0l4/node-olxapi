import { Types } from "mongoose";

export type AdType = {
    _id: Types.ObjectId | string;
    idUser: String;
    state: String;
    category: String;
    images: [Object];
    dateCreated: Date;
    title: String;
    price: Number;
    priceNegotiable: Boolean;
    description: String;
    views: number;
    status: String;
}