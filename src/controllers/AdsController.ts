import { Request, Response } from "express";
import dotenv from "dotenv";
import { v4 as uuid } from 'uuid';
import Jimp from "jimp";

import Category from "../models/Category";
import User from "../models/User";
import Ad from '../models/Ad';
import State from "../models/State";

dotenv.config();

const addImage = async (buffer: any) => {
    let newName = `${uuid()}.jpg`;
    let tmpImg = await Jimp.read(buffer);
    tmpImg.cover(500, 500).quality(80).write(`./public/assets/imgs/${newName}`);
    return newName;
};

export const getCategories = async (req: Request, res: Response) => {
    const cats = await Category.find().lean();
    let categories: any = [];
    for(let i in cats) {
        categories.push({
            ...cats[i],
            img: `${process.env.BASE}/public/assets/imgs/${cats[i].slug}.png`
        });
    }
    res.json({ categories });
}

export const addAction = async (req: Request, res: Response) => {
    let { title, price, priceneg, desc, cat, token } = req.body;
    const user = await User.findOne({ token }).exec();

    if(title == '' || cat == '') {
        res.json({ error: 'Titulo e/ou categoria não foram preenchidos' });
        return;
    }

    if(cat.lenght < 12) {
        res.json({ error: 'ID de categoria inválido' });
        return;
    }

    const category = await Category.findById(cat);
    if(!category) {
        res.json({ error: 'Categoria inexistente' });
        return;
    }

    if(price) {
        price = price.replace('.', '').replace(',', '.').replace('R$', '');
        price = parseFloat(price);
    } else {
        res.json({ error: 'O anuncio precisa ter um preço' });
        return;
    }

    const newAd: any = new Ad();
    newAd.status = true;
    newAd.idUser = user?._id;
    newAd.state = user?.state;
    newAd.dateCreated = new Date();
    newAd.title = title;
    newAd.category = cat;
    newAd.price = price;
    newAd.priceNegotiable = (priceneg == 'true') ? true : false;
    newAd.description = desc;
    newAd.views = 0;

    if(req.files && req.files.img) {
        let img = req.files.img;
        if(Array.isArray(img) === false) {
            if(['image/jpeg', 'image/jpg', 'image/png'].includes(img.mimetype)) {
                let url = await addImage(img.data);
                newAd.images.push({
                    url,
                    default: false
                });
            } 
        } else if(Array.isArray(img) === true) {
            for(let i=0; i < img.length; i++) {
                if(['image/jpeg', 'image/jpg', 'image/png'].includes(img[i].mimetype)) {
                    let url = await addImage(img[i].data);
                    newAd.images.push({
                        url,
                        default: false
                    });
                }
            }
        }
          
    }

    if(newAd.images.lenght > 0) {
        newAd.images[0].default = true;
    }

    const info = await newAd.save();
    res.json({ id: info._id });
}

export const getList = async (req: Request, res: Response) => {
    let {sort = 'asc', offset = 0, limit = 8, q, cat, state} = req.query;
    let filters: any = { status: true };
    let total = 0;

    if(q) {
        filters.title = {'$regex': q, '$options': 'i'};
    }
    if(cat) {
        const c = await Category.findOne({ slug: cat }).exec();
        if(c) {
            filters.category = c._id.toString();
        }
    }
    if(state) {
        const s = await State.findOne({ name: state.toString().toUpperCase() }).exec();
        if(s) {
            filters.state = s._id;
        }
    }

    const adsTotal = await Ad.find(filters).exec();
    total = adsTotal.length;

    const adsData = await Ad.find(filters)
    .sort({ dateCreated: (sort=='desc'?-1:1) })
    .skip(offset as any)
    .limit(limit as any)
    .exec();
    let ads = [] as Object[];
    for(let i in adsData) {
        let image = '';

        let defaultImg: any = adsData[i].images;
        (defaultImg) ? image = `${process.env.BASE}/public/assets/imgs/${defaultImg.url}` : image = `${process.env.BASE}/media/default.jpg`;
        

        ads.push({
            id: adsData[i]._id,
            title: adsData[i].title,
            price: adsData[i].price,
            priceNegotiable: adsData[i].priceNegotiable,
            image
        });
    }

    res.json({ ads, total });
}

export const getItem = async (req: Request, res: Response) => {
    let { id, other = null } = req.query;

    if(!id) {
        res.json({ error: 'Sem produto' });
        return;
    }

    

    const ad  = await Ad.findById(id) as any;
    if(!ad) {
        res.json({ error: 'Produto inexistente' });
        return;
    }

    ad.views++;
    await ad.save();

    let images: String[] = [];
    for(let i in ad.images) {
        images.push(`${process.env.base}/public/assets/imgs/${ad.images[i].url}`);
    }

    let category = await Category.findById(ad.category).exec();
    let userInfo = await User.findById(ad.idUser).exec();
    let stateInfo = await State.findById(ad.state).exec();

    let others: any[] = [];
    if(other) {
        const otherData = await Ad.find({ status: true, idUser: ad.idUser }).exec();
        for(let i in otherData) {
            if(otherData[i]._id.toString() != ad._id.toString()) {
                let image = `${process.env.BASE}/public/assets/imgs/default.jpg`;

                others.push ({
                    id: otherData[i]._id,
                    title: otherData[i].title,
                    price: otherData[i].price,
                    priceNegotiable: otherData[i].priceNegotiable,
                    image
                });
            }
        }
    }

    res.json({
        id: ad._id,
        title: ad.title,
        price: ad.price,
        priceNegotiable: ad.priceNegotiable,
        description: ad.description,
        dateCreated: ad.dateCreated,
        views: ad.views,
        images,
        category,
        userInfo: { name: userInfo?.name, email: userInfo?.email },
        stateName: stateInfo?.name,
        others
    });
}

export const editiAction = async (req: Request, res: Response) => {
    let { id } = req.params;
    let { title, status, price, priceneg, desc, cat, images, token } = req.body;
    
    if(id.length < 12) {
        res.json({ error: 'ID inválido' });
        return;
    }

    const ad = await Ad.findById(id).exec();
    if(!ad) {
        res.json({ error: 'Anuncio inexistente' });
        return;
    }

    const user = await User.findOne({ token }).exec();
    if(user?._id.toString() !== ad.idUser) {
        res.json({ error: 'Este anúncio não é seu' });
        return;
    }

    let updates: any = {};

    if(title) {
        updates.title = title;
    }
    if(price) {
        price = price.replace('.', '').replace(',', '.').replace('R$', '');
        price = parseFloat(price);
        updates.price = price;
    }
    if(priceneg) {
        updates.priceNegotiable = priceneg;
    }
    if(status) {
        updates.status = status;
    }
    if(desc) {
        updates.description = desc;
    }
    if(cat) {
        const category = await Category.findOne({ slug: cat }).exec();
        if(!category) {
            res.json({ error: 'Categoria inexistente' });
            return;
        }
        updates.category = category._id.toString();
    }
    if(images) {
        updates.images = images;

        let files: any = req.files;

        if(files) {
            for(let i in files) {
                if(['image/jpeg', 'image/jpg', 'image/png'].includes(files[i].mimetype)) {
                    let url =  `${process.env.BASE}/public/assets/imgs/${files[i].url}`;

                    let def = i == '0' ? true : false
                    updates.images = {url, def};
                }
            }
        }
    }

    await Ad.findByIdAndUpdate(id, {$set: updates});

    res.json({ message: 'Atualização feita com sucesso' });
}
