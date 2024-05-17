import express from "express";

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const { PORT, DEBUG, KEY } = process.env;

const app = express();
const port = PORT ? parseInt(PORT) : 3200;

app.use(express.static("public/"));

app.use(express.raw({
    "limit": "5mb"
}));

app.listen(port, () => {
    if(DEBUG) console.log(`Listening @${port}`);
});