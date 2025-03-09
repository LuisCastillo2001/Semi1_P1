import express from "express";

import { login, signup, books, getBook, profile, updateProfile, myBooks } from "../controllers/user.js"

const userRoutes = express.Router();


userRoutes.post("/login", login);
userRoutes.post("/signup", signup);
userRoutes.get("/books/:id_user", books);
userRoutes.post("/getBook", getBook);
userRoutes.get("/profile/:id_user", profile);
userRoutes.put("/updateProfile", updateProfile);
userRoutes.get("/myBooks/:id_user", myBooks);

export default userRoutes;