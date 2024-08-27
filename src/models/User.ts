import { Schema, model, Model, connection } from "mongoose";

type UserType = {
    name: String,
    email: String,
    state: String,
    passwordHash: String,
    token: String
}

const schema = new Schema<UserType>({
    name: String,
    email: String,
    state: String,
    passwordHash: String,
    token: String
});

const modelName: string = 'User';

export default (connection && connection.models[modelName]) ?
    module.exports = connection.models[modelName] as Model<UserType>
:
    module.exports = model(modelName, schema)
