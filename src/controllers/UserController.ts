import { Request, Response, json } from "express";
import { validationResult, matchedData } from 'express-validator';
import mongoose from "mongoose";
import bcrypt from 'bcrypt';

import State from '../models/state';
import User from "../models/user";
import Category from '../models/category';
import Ad from '../models/ad';

import { StateType } from "../types/StateType";
import { UserType } from "../types/UserType";
import { AdType } from "../types/AdType";
import { CategoryType } from "../types/CategoryType";

const UserController = {
    getStates: async (req: Request, res: Response) => {
        let states = await State.find();
        res.json({ states });
    },

    info: async (req: Request, res: Response) => {
        let token = req.query.token;
        const user = await User.findOne({ token }) as UserType;
        const state = await State.findById(user.state) as StateType;
        const ads = await Ad.find({ idUser: user.id }) as AdType[];

        let adList: Object[] = [];
        for (let i in ads) {

            const cat = await Category.findById(ads[i].category) as CategoryType;
            //adList.push({ ...ads[i], category: cat.slug }); ou

            adList.push({
                id: ads[i]._id,
                status: ads[i].status,
                dateCreated: ads[i].dateCreated,
                title: ads[i].title,
                price: ads[i].price,
                priceNegotiable: ads[i].priceNegotiable,
                description: ads[i].description,
                views: ads[i].views,
                categorys: cat.slug,
                images: ads[i].images,
            });
        }

        return res.json({
            name: user.name,
            email: user.email,
            state: state.name,
            ads: adList
        });
    },

    editAction: async (req: Request, res: Response) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.json({ error: erros.mapped() });
        }

        const data = matchedData(req);

        let updates: any = {};

        if (data.name) {
            updates.name = data.name;
        }

        if (data.email) {
            const emailCheck = await User.findOne({ email: data.email });
            if (emailCheck) {
                return res.json({ error: 'E-mail já existente.' });
            }
            updates.email = data.email;
        }

        if (data.state) {
            if (mongoose.Types.ObjectId.isValid(data.state)) {
                const stateCheck = await State.findById(data.state);
                if (!stateCheck) {
                    return res.json({ error: 'Estado não existe.' });
                }
                updates.state = data.state;
            } else {
                return res.json({ error: 'código do Estado inválido.' });
            }
        }

        if (data.password) {
            updates.passwordHash = await bcrypt.hash(data.password, 10);
        }

        await User.findOneAndUpdate({ token: data.token }, { $set: updates });

        return res.json({});
    },

};

export default UserController;