import { Schema, model, Model, connection } from "mongoose";

type StateType = {
    name: String
}

const schema = new Schema<StateType>({
    name: String,
});

const modelName: string = 'State';

export default (connection && connection.models[modelName]) ?
    connection.models[modelName] as Model<StateType>
    :
    model(modelName, schema)
