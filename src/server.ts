import dotenv from "dotenv";
import express from "express";
import cors from 'cors';
import { mongoConnect } from "./database/mongo";
import router from "./routes/routes";
import path from "path";
import upload from './configs/multer';

dotenv.config();

const server = express();

mongoConnect()
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(upload.array('image'))
server.use('/assets/images', express.static(path.join(__dirname, "../public/assets/images")));
server.use('/assets', express.static(path.join(__dirname, "../public/assets")));

server.use(express.static(__dirname + '/public'));

server.use('/', router);

server.listen(process.env.PORT, () => {
    console.log(`Rodando no endereço: ${process.env.BASE}`);
});