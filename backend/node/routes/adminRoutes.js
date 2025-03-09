import express from "express";
import { uploadBook, assignCategory, updateBook, deleteBook, books } from "../controllers/admin.js"

const adminRoutes = express.Router();

adminRoutes.get("/books", books);
adminRoutes.post("/uploadBook", uploadBook);  //Cargar/agreagar un libro
adminRoutes.post("/assignCategory", assignCategory);  //asignacion de la categoria(s) de un libro -> insert en la tabla "libros_categorias"  / Solo se puede asignar la categoria a un libro 1 vez si no da error de llaves - no insertar la misma categoria otra vez
adminRoutes.put("/updateBook", updateBook);  //Modificar libro
adminRoutes.delete("/deleteBook/:id_libro", deleteBook);  //Modificar libro

export default adminRoutes;