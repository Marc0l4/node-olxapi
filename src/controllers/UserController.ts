import { Request, Response } from "express";
import { validationResult, matchedData } from "express-validator";
import mongoose from "mongoose";
import bcrypt from 'bcrypt';

import State from '../models/State';
import User from "../models/User";
import Category from '../models/Category';
import Ad from '../models/Ad';


export const getStates = async (req: Request, res: Response) => {
    let states = await State.find();
    res.json({ states })
}

export const info = async (req: Request, res: Response) => {
    let token = req.query.token;

    const user = await User.findOne({ token });
    const state = await State.findById(user?.state);
    const ads = await Ad.find({ idUser: user?._id.toString() });

    let adList: any = [];
    for(let i in ads) {
        const cat = await Category.findById(ads[i].category);
        adList.push({ ...ads[i], category: cat?.slug});
    }

    res.json({
        name: user?.name,
        email: user?.email,
        state: state?.name,
        ads: adList
    });
}

export const editAction = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.json({ error: errors.mapped() });
        return;
    }
    const data = matchedData(req);

    let updates: any = {};

    if(data.name) updates.name = data.name;
    
    if(data.email) {
        const emailCheck = await User.findOne({ email: data.email });
        if(emailCheck) {
            res.json({ error: 'E-mail já existente!' });
            return;
        }
        updates.email = data.email;
    }

    if(data.state) {
        if(mongoose.Types.ObjectId.isValid(data.state)) {
            const stateCheck = await State.findById(data.state);
            if(!stateCheck) {
            res.json({ error: 'Estado não existe!' });
            return;
            }
            updates.state = data.state;
        }
    }

    if(data.password) {
        updates.passwordHash = await bcrypt.hash(data.password, 10);
    }
    try{
        await User.findOneAndUpdate({ token: data.token, $set: updates });
    } catch(error) {
        res.json({ error: 'Ocorreu um erro ao atualizar o usúario' });
    }
    
    res.json({ status: true });
}
