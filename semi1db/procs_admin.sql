USE SEMI1_G6;

-- Ver todos los libros admin
DELIMITER $$

CREATE PROCEDURE ver_libros_admin()
BEGIN 
	SELECT * FROM libros;
END $$
DELIMITER ;



-- Cargar los libros de parte del admin, nota los libros se cargan sin categorías al insertar
DELIMITER $$

CREATE PROCEDURE cargar_libros(
	p_nombre_libro VARCHAR(75),
    p_url_portada TEXT,
    p_sinopsis TEXT,
    p_autor VARCHAR(75),
    p_anio_publicacion DATE,
    p_url_pdf TEXT
)
BEGIN

	INSERT INTO libros(nombre_libro, url_portada, sinopsis, autor, anio_publicacion, url_pdf)
    VALUES (p_nombre_libro, p_url_portada, p_sinopsis, p_autor, p_anio_publicacion, p_url_pdf);

END $$

DELIMITER ;


-- cargar categorías del libro se pueden mandar las categorias como un string separado por comas, la categoría tiene que existir en la tabla categorías
DELIMITER $$

CREATE PROCEDURE asignar_categorias(
    IN p_nombre_libro VARCHAR(100),
    IN p_nombre_autor VARCHAR(100),
    IN p_categorias_libro TEXT 
)
BEGIN
    DECLARE p_id_libro INT;
    DECLARE p_id_categoria INT;
    DECLARE categoria_actual VARCHAR(100);
    DECLARE posicion INT DEFAULT 1;
    DECLARE longitud INT;

    
    SELECT id_libro INTO p_id_libro 
    FROM libros 
    WHERE nombre_libro = p_nombre_libro AND autor = p_nombre_autor 
    LIMIT 1;

   
    IF p_id_libro IS NOT NULL THEN
        
        SET longitud = LENGTH(p_categorias_libro) - LENGTH(REPLACE(p_categorias_libro, ',', '')) + 1;
        
        WHILE posicion <= longitud DO
            
            SET categoria_actual = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_categorias_libro, ',', posicion), ',', -1));

            
            SELECT id_categoria INTO p_id_categoria 
            FROM categorias 
            WHERE nombre_categoria = categoria_actual 
            LIMIT 1;

            
            IF p_id_categoria IS NOT NULL THEN
                INSERT INTO libros_categorias (id_libro, id_categoria)
                VALUES (p_id_libro, p_id_categoria);
            END IF;

            
            SET posicion = posicion + 1;
        END WHILE;
    ELSE
        
        SELECT 'Error: El libro no existe' AS ERROR;
    END IF;
END $$

DELIMITER ;



-- Actualizar libros
DELIMITER $$

CREATE PROCEDURE actualizar_libros(
	p_id_libro INT,
	p_nombre_libro VARCHAR(100),
    p_url_portada TEXT,
    p_autor VARCHAR(75),
    p_sinopsis TEXT,
    p_url_pdf TEXT,
    p_anio_publicacion DATE
)
BEGIN
	
	UPDATE libros 
    SET nombre_libro = p_nombre_libro, url_portada = p_url_portada, autor = p_autor, 
    sinopsis = p_sinopsis, url_pdf = p_url_pdf, anio_publicacion = p_anio_publicacion
    WHERE id_libro = p_id_libro;
END $$

DELIMITER ;


-- Eliminar libros
DELIMITER $$
CREATE PROCEDURE eliminar_libros(
	p_id_libro INT
)
BEGIN
	DELETE FROM libros WHERE id_libro = p_id_libro;
END $$

DELIMITER ;


DELIMITER $$
CREATE PROCEDURE ver_url_libros(
    p_id_libro INT,
   
)
BEGIN
    SELECT url_pdf, url_portada FROM libros WHERE id_libro = p_id_libro;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE ver_url_usuarios(
    p_id_usuario INT
)
BEGIN
    SELECT url_foto_perfil FROM usuarios WHERE id_usuario = p_id_usuario;
END $$
DELIMITER ;
