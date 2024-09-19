import { Request, Response, NextFunction } from "express"


export const priv = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.query.token && !req.body.token) {
        res.json({ msg: 'nao tem token' });
        return;
    }

    let token: string = '';
    if (req.query.token) {
        token = req.query.token as string
    }
    if (req.body.token) {
        token = req.body.token as string
    }

    if (token === '') {
        res.json({ msg: 'token vazio' });
        return;
    }

    next();
}