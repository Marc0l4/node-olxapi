import { Schema, model, Model, connection, Types } from "mongoose";

type AdType = {
    idUser: Types.ObjectId | string,
    state: String,
    category: String,
    images: [Object],
    dateCreated: Date,
    title: String,
    price: Number,
    priceNegotiable: Boolean,
    description: String,
    views: Number,
    status: String
}

const schema = new Schema<AdType>({
    idUser: String,
    state: String,
    category: String,
    images: [Object],
    dateCreated: Date,
    title: String,
    price: Number,
    priceNegotiable: Boolean,
    description: String,
    views: Number,
    status: String
});

const modelName: string = 'Ad';

export default (connection && connection.models[modelName]) ?
    module.exports = connection.models[modelName] as Model<AdType>
    :
    module.exports = model(modelName, schema)
