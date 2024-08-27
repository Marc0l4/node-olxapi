import { Request, Response } from "express";
import { validationResult, matchedData } from "express-validator";
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import User from "../models/User";
import State from "../models/State";

export const signIn = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.json({ error: errors.mapped() });
        return;
    }
    const data = matchedData(req);

    const user = await User.findOne({ email: data.email });
    if(!user) {
        res.json({ error:'E-mail e/ou senha errados!' });
        return;
    }

    const match = await bcrypt.compare(data.password, user.passwordHash as string);
    if(!match) {
        res.json({ error:'E-mail e/ou senha errados!' });
        return;
    }

    const payload = (Date.now() + Math.random()).toString();
    const token = await bcrypt.hash(payload, 10);

    user.token = token;
    await user.save();

    res.json({ token, email: data.email });
};

export const signUp = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.json({ error: errors.mapped() });
        return;
    }
    const data = matchedData(req);

    const user = await User.findOne({
        email: data.email
    });
    if(user) {
        res.json({  error: { msg: 'E-mail já existe!!!' } });
        return;
    }

    if(mongoose.Types.ObjectId.isValid(data.state)) {
        const stateItem = await State.findById(data.state);
        if(!stateItem) {
        res.json({  error: { msg: 'Estado não existe!!!' } });
        return;
        }
    } else {
        res.json({  error: { msg: 'Código de estado invalido' } });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const payload = (Date.now() + Math.random()).toString();
    const token = await bcrypt.hash(payload, 10);

    const newUser = new User({
        name: data.name,
        email: data.email,
        passwordHash,
        token,
        state: data.state
    });
    await newUser.save();

    res.json({ token });
};