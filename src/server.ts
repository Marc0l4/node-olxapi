import dotenv from "dotenv";
import express, { Request, Response } from "express";
import mongoose from 'mongoose';
import cors from 'cors';
import fileupload from 'express-fileupload';
import { mongoConnect } from "./database/mongo";
import router from "./routes/routes";

dotenv.config();

const server = express();

mongoConnect()
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(fileupload());

server.use(express.static(__dirname+'/public'));

server.use('/', router);

server.listen(process.env.PORT, () => {
    console.log(`Rodando no endereço: ${process.env.BASE}`);
});