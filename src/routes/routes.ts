import express, { Response, Request } from 'express';

import upload from '../configs/multer';

import AuthController from '../controllers/AuthController';
import UserController from '../controllers/UserController';
import AdsController from '../controllers/AdsController';

import * as Auth from '../middlewares/Auth';

import * as AuthValidator from '../validators/AuthValidator';
import * as UserValidator from '../validators/UserValidator';

const router = express.Router();

router.get('/ping', (req: Request, res: Response) => {
    res.json({ pong: true });
});

router.get('/states', UserController.getStates);
router.get('/user/me', Auth.priv, UserController.info);
router.put('/user/me', UserValidator.editAction, Auth.priv, UserController.editAction);

router.post('/user/signin', AuthValidator.signin, AuthController.signin);
router.post('/user/signup', AuthValidator.signUp, AuthController.signup);

router.get('/categories', AdsController.getCategories);
router.post('/ad/add', Auth.priv, AdsController.addAction);
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', AdsController.getItem);
router.post('/ad/:id', Auth.priv, AdsController.editAction);

export default router;