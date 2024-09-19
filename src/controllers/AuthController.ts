import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import { validationResult, matchedData } from 'express-validator';

import User from "../models/user";
import State from "../models/state";

const AuthController = {
    signin: async (req: Request, res: Response) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.json({ error: erros.mapped() });
        }

        const data = matchedData(req);

        // validando o email
        const user = await User.findOne({ email: data.email });
        if (!user) {
            return res.json({ Error: 'E-mail e/ou senha errados!' });
        }

        // validando a senha
        const match = await bcrypt.compare(data.password, user.passwordHash as string);
        if (!match) {
            return res.json({ Error: 'E-mail e/ou senha errados!' });
        }

        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        user.token = token;
        await user.save();

        return res.json({ token, email: data.email });
    },

    signup: async (req: Request, res: Response) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.json({ error: erros.mapped() });
        }

        const data = matchedData(req);

        //Verificando se e-mail já existe 
        const user = await User.findOne({ email: data.email });
        if (user) {
            return res.json({
                error: { email: { msg: 'Email já cadastrado' } }
            });
        }

        //Verificando se o estado existe
        if (mongoose.Types.ObjectId.isValid(data.state)) {
            const stateItem = await State.findById(data.state);
            if (!stateItem) {
                return res.json({
                    error: { state: { msg: 'Estado não existe' } }
                });
            }
        } else {
            return res.json({
                error: { state: { msg: 'Código de Estado inválido' } }
            });
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        const newUser = new User({
            name: data.name,
            email: data.email,
            passwordHash,
            state: data.state,
            token
        });

        await newUser.save();

        return res.json({ token });
    },

};

export default AuthController;