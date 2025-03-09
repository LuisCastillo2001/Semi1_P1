USE SEMI1_G6;

INSERT INTO categorias (nombre_categoria) VALUES ('Ficción'), ('No Ficción'), ('Ciencia'), ('Historia'), ('Biografía');

CALL registro_usuario('Juan', 'Perez', 'url_foto_juan', 'juan@example.com', 'password123');
CALL registro_usuario('Maria', 'Lopez', 'url_foto_maria', 'maria@example.com', 'password123');
CALL registro_usuario('Carlos', 'Gomez', 'url_foto_carlos', 'carlos@example.com', 'password123');

CALL cargar_libros('Libro 1', 'url_portada_1', 'Sinopsis 1', 'Autor 1', '2023-01-01', 'url_pdf_1');
CALL cargar_libros('Libro 2', 'url_portada_2', 'Sinopsis 2', 'Autor 2', '2023-02-01', 'url_pdf_2');
CALL cargar_libros('Libro 3', 'url_portada_3', 'Sinopsis 3', 'Autor 3', '2023-03-01', 'url_pdf_3');
CALL cargar_libros('Libro 4', 'url_portada_4', 'Sinopsis 4', 'Autor 4', '2023-04-01', 'url_pdf_4');
CALL cargar_libros('Libro 5', 'url_portada_5', 'Sinopsis 5', 'Autor 5', '2023-05-01', 'url_pdf_5');
CALL cargar_libros('Libro 6', 'url_portada_6', 'Sinopsis 6', 'Autor 6', '2023-06-01', 'url_pdf_6');
CALL cargar_libros('Libro 7', 'url_portada_7', 'Sinopsis 7', 'Autor 7', '2023-07-01', 'url_pdf_7');
CALL cargar_libros('Libro 8', 'url_portada_8', 'Sinopsis 8', 'Autor 8', '2023-08-01', 'url_pdf_8');
CALL cargar_libros('Libro 9', 'url_portada_9', 'Sinopsis 9', 'Autor 9', '2023-09-01', 'url_pdf_9');
CALL cargar_libros('Libro 10', 'url_portada_10', 'Sinopsis 10', 'Autor 10', '2023-10-01', 'url_pdf_10');
CALL cargar_libros('Libro 11', 'url_portada_11', 'Sinopsis 11', 'Autor 11', '2023-11-01', 'url_pdf_11');
CALL cargar_libros('Libro 12', 'url_portada_12', 'Sinopsis 12', 'Autor 12', '2023-12-01', 'url_pdf_12');

CALL asignar_categorias('Libro 1', 'Autor 1', 'Ficción,Ciencia');
CALL asignar_categorias('Libro 2', 'Autor 2', 'No Ficción,Historia');
CALL asignar_categorias('Libro 3', 'Autor 3', 'Biografía');
CALL asignar_categorias('Libro 4', 'Autor 4', 'Ficción');
CALL asignar_categorias('Libro 5', 'Autor 5', 'Ciencia');
CALL asignar_categorias('Libro 6', 'Autor 6', 'Historia');
CALL asignar_categorias('Libro 7', 'Autor 7', 'Biografía');
CALL asignar_categorias('Libro 8', 'Autor 8', 'Ficción');
CALL asignar_categorias('Libro 9', 'Autor 9', 'Ciencia');
CALL asignar_categorias('Libro 10', 'Autor 10', 'Historia');
CALL asignar_categorias('Libro 11', 'Autor 11', 'Biografía');
CALL asignar_categorias('Libro 12', 'Autor 12', 'Ficción');


-- Ver todos los libros admin
CALL ver_libros_admin();

-- Ver todos los libros de un usuario
CALL ver_libros_usuario(1);
CALL ver_libros_usuario(1);

-- Filtrar libros por categorías
CALL filtrar_libros_categorias('Ficción,Ciencia', 1);

-- Mostrar detalles de un libro
CALL mostrar_detalles_libro(1, 1);

-- Buscar libros por nombre
CALL busqueda_libros('Libro', 1);

-- Adquirir libros por parte de un usuario
CALL adquirir_libros(1, 1);
CALL adquirir_libros(1, 2);
CALL adquirir_libros(1, 3);

-- Ver perfil de un usuario
CALL ver_perfil(1);

-- Actualizar perfil de un usuario
CALL actualizar_perfil(1, 'Juan', 'Perez', 'url_foto_juan_actualizada', 'juan_nuevo@example.com', 'password123');

-- Ver los libros adquiridos por un usuario
CALL ver_mis_libros(1);

-- Actualizar un libro
CALL actualizar_libros(1, 'Libro 1 Actualizado', 'url_portada_1_actualizada', 'Autor 1', 'Sinopsis 1 Actualizada', 'url_pdf_1_actualizada', '2023-01-01');

-- Eliminar un libro
CALL eliminar_libros(12);