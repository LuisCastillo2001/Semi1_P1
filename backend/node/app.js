import express from "express"
import cors from "cors"
import connectionDB from './db/connection.js';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import userRoutes from "./routes/userRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"


//Configuracion para poder llamar a .env desde fuera de la carrpeta de la api con node para utilizarlo con flask tambien
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// console.log(process.env.PORT);  //Ver datos del .env

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('port', process.env.PORT || 3000);


// app.get("/", (req, res) => {
//     res.status(200).json({ "message": "Bienvenido a la api en node.js del G6" })
// })
app.get("/", (req, res) => {
    res.status(200).send("Bienvenido a la api en node.js del G6")
})

app.get('/test-connection', (req, res) => {
    connectionDB.query('SELECT 1 + 1 AS result', (err, rows) => {
        if (err) {
            return res.status(500).send(`❌ Error en la conexión: ${err.message}`);
        }
        res.status(200).send(`✅ Conexión exitosa a la base de datos`);
    });
});

app.use("/user", userRoutes)
app.use("/admin", adminRoutes)

export default app; 