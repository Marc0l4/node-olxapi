import { Request, Response } from "express";
import sharp from "sharp";

import Category from "../models/category";
import User from "../models/user";
import State from "../models/state";
import Ad from "../models/ad";

import { CategoryType } from '../types/CategoryType';
import { StateType } from '../types/StateType';
import { UserType } from '../types/UserType'

sharp.cache(false);
const resizeImage = async (url: string) => {
    let buffer = await sharp(url)
        .resize({
            width: 500,
            height: 500,
            fit: 'fill',
            withoutEnlargement: true,
        })
        //.extract({ width: 500, height: 500, left: 0, top: 0 })
        .toBuffer();

    return sharp(buffer).toFile(url);
}

const AdsController = {
    getCategories: async (req: Request, res: Response) => {
        const cats = await Category.find();

        let categories: object[] = [];

        for (let i in cats) {
            categories.push({
                id: cats[i].id,
                name: cats[i].name,
                slug: cats[i].slug,
                img: `${process.env.BASE}/assets/imgs/${cats[i].slug}`
            });
        }

        return res.json({ categories });
    },

    addAction: async (req: Request, res: Response) => {
        let { title, price, priceneg, desc, cat, token } = req.body;
        const user = await User.findOne({ token }).exec() as UserType;

        if (!user) return res.json({ error: 'Usuario inexistente' });

        if (!title || !cat) return res.json({ error: 'Título e/ou categoria não foram preenchidos.' });

        if (cat) {
            const c = await Category.findOne({ slug: cat }).exec();
            if (c) {
                cat = c.slug;
            }
        }

        if (price) {
            price = price.replace('.', '').replace(',', '.').replace('R$ ', '');
            price = parseFloat(price);
        } else {
            price = 0;
        }

        const newAd = new Ad();
        newAd.status = 'true';
        newAd.idUser = user.id;
        newAd.state = user.state;
        newAd.dateCreated = new Date();
        newAd.title = title;
        newAd.category = cat;
        newAd.price = price;
        newAd.priceNegotiable = (priceneg == 'true') ? true : false;
        newAd.description = desc;
        newAd.views = 0;

        let files = req.files as any;

        for (let i in files) {
            resizeImage(files[i].path);
            let url = `/assets/imgs/${files[i].filename}`;

            let def = i == '0' ? true : false
            newAd.images.push({
                url,
                default: def
            });
        }

        const info = await newAd.save();
        return res.json({ id: info._id });
    },

    getList: async (req: Request, res: Response) => {
        let { sort = 'asc', offset, limit, q, cat, state } = req.query;
        let total = 0;
        let filters: any = {}

        if (q && cat && state) {
            if (q) filters.title = { $regex: q, $options: 'i' };
            const c = await Category.findOne({ cat }).exec();
            if (c) filters.cat = c.id;
            const s = await State.findOne({ state }).exec();
            if (s) filters.state = s.id;
        }



        const adsTotal = await Ad.find(filters).exec();
        total = adsTotal.length;

        const adsData = await Ad.find(filters)
            .skip(offset as any)
            .limit(limit as any)
            .exec();

        let ads = [] as Object[];

        for (let i in adsData) {
            let image = '';
            let list: any = adsData[i].images;
            let defIMG = list.find((e: { default: any }) => e.default);
            if (adsData[i].images.length > 1) {
                image = `${process.env.BASE}${defIMG.url}`;
            } else {
                image = `${process.env.BASE}${defIMG.url}`;
            }

            ads.push({
                _id: adsData[i]._id,
                title: adsData[i].title,
                price: adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                cat: adsData[i].category,
                image
            });
        }

        res.json({ ads, total });
    },
    getItem: async (req: Request, res: Response) => {
        try {
            let { id, other = null } = req.query;

            if (!id) return res.json({ error: 'Sem produto' });

            const ad = await Ad.findById(id) as any;
            if (!ad) return res.json({ error: 'Produto inexistente' });

            ad.views++;
            await ad.save();

            let images: String[] = [];
            for (let i in ad.images) images.push(`${process.env.BASE}${ad.images[i].url}`);

            let category = await Category.findById(ad.category).exec() as CategoryType;
            let userInfo = await User.findById(ad.idUser).exec() as UserType;
            let stateInfo = await State.findById(ad.state).exec() as StateType;

            let others: any[] = [];
            if (other) {
                const otherData = await Ad.find({ status: true, idUser: ad.idUser }).exec() as any;

                for (let i in otherData) {
                    if (otherData[i]._id.toString() != ad._id.toString()) {

                        let image = `${process.env.BASE}/assets/imgs/${otherData[i].image}`;
                        let defaultImg = otherData[i].images.find((e: any) => e.default);
                        if (defaultImg) {
                            image = `${process.env.BASE}${defaultImg.url}`;
                        }

                        others.push({
                            id: otherData[i]._id,
                            title: otherData[i].title,
                            price: otherData[i].price,
                            priceNegotiable: otherData[i].priceNegotiable,
                            image
                        });
                    }
                }
            }

            return res.json({
                id: ad._id,
                title: ad.title,
                price: ad.price,
                priceNegotiable: ad.priceNegotiable,
                description: ad.description,
                dateCreated: ad.dateCreated,
                views: ad.views,
                images,
                category,
                userInfor: {
                    name: userInfo.name,
                    email: userInfo.email
                },
                stateName: stateInfo.name,
                others
            });
        } catch (error) {
            console.log(error);
            return res.json({ error: "erro inesperado. Contate o administrador." });
        }
    },

    editAction: async (req: Request, res: Response) => {
        try {
            let { id } = req.params;
            let { title, status, price, priceneg, desc, cat, images, token } = req.body;

            if (id.length < 12) return res.json({ error: 'ID do anuncio inválido.' });

            const ad = await Ad.findById(id).exec();
            if (!ad) return res.json({ error: 'Anúncio não encontrado.' });

            const user = await User.findOne({ token }).exec() as UserType;
            if (user.id != ad.idUser) return res.json({ error: 'Anúncio encontrado não é do usuário logado' });

            let updates: any = {};

            if (title) {
                updates.title = title;
            }
            if (price) {
                price = price.replace('.', '').replace(',', '.').replace('R$ ', '');
                price = parseFloat(price);
                updates.price = price;
            }
            if (priceneg) updates.priceNegotiable = priceneg;
            if (status) updates.status = status;
            if (desc) updates.description = desc;
            if (cat) {
                const category = await Category.findOne({ slug: cat }).exec();
                if (!category) {
                    return res.json({ error: "Categoria inexistente." });
                }
                updates.category = category._id.toString();
            }

            let files = req.files as any;
            let editAd: any = await Ad.findById(id).exec();

            for (let i in files) {
                resizeImage(files[i].path);
                let url = `${files[i].filename}`;

                let def = i == '0' ? true : false
                editAd.images.push({
                    url,
                    default: def
                });
            }

            await Ad.findByIdAndUpdate(id, { $set: updates, images: editAd.images });

            //TODO: Novas imagens.

            return res.json({ message: "Atualização feita com sucesso" });
        } catch (error) {

            console.log(error);
            return res.json({ error: "erro inesperado. Contate o administrador." });
        }
    },
}

export default AdsController;