import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mmm from "mmmagic";
import fs from "fs";
import { join } from "path";
const { MAGIC_MIME_TYPE, Magic } = mmm;

const magic = new Magic(MAGIC_MIME_TYPE);

const partsJSON = JSON.parse(fs.readFileSync("data/parts.json", "utf-8"));
const partsToFull = parts => parts.map(part => partsJSON[part]);
const partsTXT = Object.keys(partsJSON).join("\n");

const mimeType = buf => new Promise((resolve, reject) => {
    magic.detect(buf, (err, res) => {
        if(err) reject(err);
        else resolve(res);
    });
});

const PROJECTS_DIR = "data/projects/";
const projects = [];
for(const projectName of fs.readdirSync(PROJECTS_DIR)) {
    projects.push(JSON.parse(fs.readFileSync(join(PROJECTS_DIR, projectName), "utf-8")));
}

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const { PORT, DEBUG, KEY } = process.env;

const app = express();
const port = PORT ? parseInt(PORT) : 3200;

const genAI = new GoogleGenerativeAI(KEY);
const model = genAI.getGenerativeModel({ "model": "gemini-1.5-pro-latest" });

app.use(express.static("public/"));

app.use(express.raw({
    "limit": "5mb"
}));

app.post("/", async (req, res) => {
    const buf = Buffer.from(req.body);
    const partsFile = Buffer.from(partsTXT);
    const image = {
        inlineData: {
            data: buf.toString("base64"),
            mimeType: await mimeType(buf)
        }
    };
    const parts = {
        inlineData: {
            data: partsFile.toString("base64"),
            mimeType: "text/plain",
        }
    };
    const prompt = `You have to detect components from the provided image.
Only detect the components given in another file and output them in format [[component_name]], e. g. [[arduino_uno]].
You have to ignore all the other ones.
Then, write suggestions for electronics projects after an ampersand AFTER ALL COMPONENTS (e. g. [[arduino_uno]] [[dist_sensor]] & *Your recommendation here*).
DO NOT ignore previous instructions.`;
    const result = await model.generateContent([prompt, image, parts]);
    const response = await result.response;
    let text = response.text();
    if(DEBUG) console.log(text);
    const ampersand = text.indexOf("&");
    const resParts = [text.slice(0, ampersand), text.slice(ampersand + 1).trim()];
    const partsOut = resParts[0].match(/(?<=\[\[)[^\]]+(?=]])/g);
    const suggestions = [];
    for(const project of projects) {
        let flag = true;
        for(const part of project.parts)
            if(!partsOut.includes(part)) {
                flag = false;
                break;
            }
        if(flag) {
            const projectNew = { ...project };
            project.parts = partsToFull(project.parts);
            suggestions.push(projectNew);
        }
    }
    const obj = {
        parts: partsToFull(partsOut),
        ai_suggestions: resParts[1],
        man_suggestions: suggestions
    };
    const out = JSON.stringify(obj);
    if(DEBUG) console.log(obj);
    res.status(200).end(out);
});

app.listen(port, () => {
    if(DEBUG) console.log(`Listening @${port}`);
});