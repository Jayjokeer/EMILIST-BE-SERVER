"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("../db/database");
const config_1 = require("./utils/config");
const routes_1 = __importDefault(require("./routes"));
const error_handler_1 = __importDefault(require("./errors/error-handler"));
const error_1 = __importDefault(require("./errors/error"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
require("../src/utils/passport");
const socket_1 = __importDefault(require("./socket"));
const PORT = config_1.config.port || 7000;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: { secure: false }
}));
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
});
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Routes
app.use("/api/v1/", routes_1.default);
(0, socket_1.default)(exports.io);
app.all('*', (req, res, next) => {
    next(new error_1.default(`Cannot find ${req.originalUrl} on this server`, 404));
});
app.use(error_handler_1.default);
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.connectDB)();
        console.log(`Server started on port ${PORT} 🔥🔥🔥`);
    }
    catch (error) {
        console.error(`Error connecting to the database: ${error.message}`);
        process.exit(1);
    }
}));
