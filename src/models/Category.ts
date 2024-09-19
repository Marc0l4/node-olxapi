import { Schema, model, Model, connection } from "mongoose";

type CategoryType = {
    name: String,
    slug: String
}

const schema = new Schema<CategoryType>({
    name: String,
    slug: String,
});

const modelName: string = 'Categorie';

export default (connection && connection.models[modelName]) ?
    connection.models[modelName] as Model<CategoryType>
    :
    model(modelName, schema)
