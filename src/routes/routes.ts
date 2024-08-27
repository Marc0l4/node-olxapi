import express, { Response, Request } from 'express';

import * as AdsController from '../controllers/AdsController';
import * as UserConrtoller from '../controllers/UserController';
import * as AuthController from '../controllers/AuthController';

import * as Auth from '../middlewares/Auth';

import * as AuthValidator from '../validators/AuthValidator';
import * as UserValidator from '../validators/UserValidator';

const router = express.Router();

router.get('/ping', (req: Request, res: Response) => {
    res.json({pong: true});
});

router.get('/states', UserConrtoller.getStates);
router.get('/user/me', Auth.priv, UserConrtoller.info);
router.put('/user/me', UserValidator.editAction, Auth.priv, UserConrtoller.editAction);

router.post('/user/signin', AuthValidator.signin, AuthController.signIn);
router.post('/user/signup', AuthValidator.signUp, AuthController.signUp);

router.get('/categories', AdsController.getCategories);
router.post('/ad/add', Auth.priv, AdsController.addAction);
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', AdsController.getItem);
router.post('/ad/:id', Auth.priv, AdsController.editiAction);

export default router;