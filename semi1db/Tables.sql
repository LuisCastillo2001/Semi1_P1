DROP DATABASE IF EXISTS SEMI1_G6;
CREATE DATABASE SEMI1_G6;
USE SEMI1_G6;


CREATE TABLE usuarios(
	id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    url_foto_perfil TEXT NOT NULL,
    correo VARCHAR(50) NOT NULL UNIQUE,
    contrasenia VARCHAR(255) NOT NULL
    );
    
CREATE TABLE libros(
	id_libro INT AUTO_INCREMENT PRIMARY KEY,
    nombre_libro VARCHAR(75) NOT NULL,
    url_portada TEXT NOT NULL,
    autor VARCHAR(75) NOT NULL,
    sinopsis TEXT NOT NULL,
    url_pdf TEXT NOT NULL,
    anio_publicacion DATE NOT NULL
    );
    
CREATE TABLE categorias(
	id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(30) NOT NULL
    );

CREATE TABLE libros_usuarios(
	id_libro INT,
    id_usuario INT,
    PRIMARY KEY (id_libro, id_usuario)
    );

CREATE TABLE libros_categorias(
	id_libro INT,
    id_categoria INT,
    PRIMARY KEY (id_libro, id_categoria)
    );


ALTER TABLE libros_usuarios ADD CONSTRAINT fk_id_libro_libros_usuarios
FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE;

ALTER TABLE libros_usuarios ADD CONSTRAINT fk_id_usuario_libros_usuarios 
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;

ALTER TABLE libros_categorias ADD CONSTRAINT fk_id_libro_libros_categorias
FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE;

ALTER TABLE libros_categorias ADD CONSTRAINT fk_id_categoria_libro_categorias
FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE;

