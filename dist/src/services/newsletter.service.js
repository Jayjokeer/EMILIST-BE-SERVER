"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeNewsLetter = void 0;
const newsletter_model_1 = __importDefault(require("../models/newsletter.model"));
const subscribeNewsLetter = async (email) => {
    return await newsletter_model_1.default.create({ email });
};
exports.subscribeNewsLetter = subscribeNewsLetter;
