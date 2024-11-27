import express, { Express, Request, Response } from "express";
import {routes} from './api/routes'
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}))


app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use(cors());

app.use('/api/', routes)

// app.post("/market/products", (req: Request, res: Response) => {
//     res.send("Express + TypeScript Server");
// });


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});