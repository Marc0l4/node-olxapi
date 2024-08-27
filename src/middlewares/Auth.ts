import { Request, Response, NextFunction } from "express"

import User from '../models/User';

export const priv = async (req: Request, res: Response, next: NextFunction) => {
    if(!req.query.token && !req.body.token) {
        res.json({ notallowed: true });
        return;
    }

    let token: string = '';
    if(req.query.token) {
        token = req.query.token as string
    }
    if(req.body.token) {
        token = req.body.token as string
    }

    if(token == '') {
        res.json({ notallowed: true });
        return;
    }

    const user = await User.findOne({ token });

    if(!user) {
        res.json({ notallowed: true });
        return;
    }

    next();
}