USE SEMI1_G6;


-- Login de usuarios
DELIMITER $$

CREATE PROCEDURE login(
	IN p_correo VARCHAR(50),
    IN p_contrasenia VARCHAR(255)
)
BEGIN 
	SELECT * FROM usuarios
    WHERE correo = p_correo AND contrasenia = SHA2(p_contrasenia, 256);
END $$
DELIMITER ;



-- Registro de usuarios
DELIMITER $$

CREATE PROCEDURE registro_usuario(
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_url_foto_perfil TEXT,
    IN p_correo VARCHAR(50),
    IN p_contrasenia VARCHAR(255)
)
BEGIN
    INSERT INTO usuarios(nombre, apellido, url_foto_perfil, correo, contrasenia)
    VALUES (p_nombre, p_apellido, p_url_foto_perfil, p_correo, SHA2(p_contrasenia, 256));
END $$;

DELIMITER ;


-- Ver todos los libros de parte del usuario, incluyendo si los ha adquirido o no


DELIMITER $$

CREATE PROCEDURE ver_libros_usuario(
    p_id_usuario INT
)
BEGIN
    SELECT 
        l.id_libro, 
        l.nombre_libro, 
        l.url_portada, 
        l.autor, 
        l.sinopsis,
        l.url_pdf,
        CASE 
            WHEN lu.id_usuario IS NULL THEN 'No adquirido' 
            ELSE 'Adquirido' 
        END AS Estado_libro,
        GROUP_CONCAT(DISTINCT c.nombre_categoria ORDER BY c.nombre_categoria SEPARATOR ', ') AS categorias
    FROM libros l
    LEFT JOIN libros_usuarios lu ON lu.id_libro = l.id_libro AND lu.id_usuario = p_id_usuario
    LEFT JOIN libros_categorias lc ON lc.id_libro = l.id_libro
    LEFT JOIN categorias c ON c.id_categoria = lc.id_categoria
    GROUP BY l.id_libro, l.nombre_libro, l.url_portada, l.autor, l.sinopsis, Estado_libro
    ORDER BY l.nombre_libro;
END $$

DELIMITER ;



-- Filtrar los libros por categorías, en parametros se puede mandar la categoria como un string separado por comas
-- Este queda opcional si usarlo
DELIMITER $$

CREATE PROCEDURE filtrar_libros_categorias(
    p_categorias TEXT, 
    p_id_usuario INT
)
BEGIN
    SELECT li.id_libro, li.nombre_libro, li.url_portada, li.autor, li.sinopsis, 
        CASE WHEN lu.id_usuario IS NULL THEN 'No adquirido' ELSE 'Adquirido' END AS Estado_libro,
        GROUP_CONCAT(DISTINCT ca.nombre_categoria ORDER BY ca.nombre_categoria SEPARATOR ', ') AS categorias 
    FROM libros li
    LEFT JOIN libros_categorias lc ON li.id_libro = lc.id_libro
    LEFT JOIN categorias ca ON ca.id_categoria = lc.id_categoria
    LEFT JOIN libros_usuarios lu ON li.id_libro = lu.id_libro AND p_id_usuario = lu.id_usuario
    WHERE EXISTS (
        SELECT 1 FROM libros_categorias lc2
        INNER JOIN categorias ca2 ON ca2.id_categoria = lc2.id_categoria
        WHERE lc2.id_libro = li.id_libro
        AND FIND_IN_SET(ca2.nombre_categoria, p_categorias) > 0 
    )
    GROUP BY li.id_libro, li.nombre_libro, li.url_portada, li.autor, li.sinopsis, lu.id_usuario
    ORDER BY li.nombre_libro;
END $$

DELIMITER ;




-- Mostrar los detalles individuales de un libro
-- Este también queda opcional
DELIMITER $$
CREATE PROCEDURE mostrar_detalles_libro(
	IN p_id_libro INT,
    IN p_id_usuario INT
)
BEGIN

	SELECT li.id_libro,nombre_libro, url_portada, autor, sinopsis, li.url_pdf,
    CASE WHEN lu.id_usuario IS NULL THEN 'No adquirido' ELSE 'Adquirido' END AS 'Estado_libro',
    GROUP_CONCAT(ca.nombre_categoria SEPARATOR ',') AS categorias 
    FROM libros li
    LEFT JOIN libros_categorias lc ON li.id_libro = lc.id_libro
    LEFT JOIN categorias ca ON ca.id_categoria = lc.id_categoria
    LEFT JOIN libros_usuarios lu ON li.id_libro = lu.id_libro AND lu.id_usuario = p_id_usuario
    WHERE li.id_libro = p_id_libro
    GROUP BY li.id_libro, li.nombre_libro, li.url_portada, li.autor, li.sinopsis, lu.id_usuario
    ;

END $$ 

DELIMITER ;



-- Busqueda para buscar libros mediante su nombre
-- Este queda opcional si se desea usar
DELIMITER $$
CREATE PROCEDURE busqueda_libros(
	p_nombre_libro varchar(75),
    p_id_usuario INT
)
BEGIN

	SELECT nombre_libro, url_portada, autor, sinopsis, 
    CASE WHEN lu.id_usuario IS NULL THEN 'No adquirido' ELSE 'Adquirido' END AS 'Estado del libro'
    FROM libros li
    LEFT JOIN libros_usuarios lu ON li.id_libro = lu.id_libro AND lu.id_usuario = p_id_usuario
    WHERE li.nombre_libro LIKE concat(p_nombre_libro , '%') ;
    
END $$

DELIMITER ;


-- Adquirir libros por parte de un usuario
DELIMITER $$
CREATE PROCEDURE adquirir_libros(
	p_id_usuario INT,
	p_id_libro INT
)
BEGIN

	INSERT INTO libros_usuarios(id_libro, id_usuario)
    VALUES (p_id_libro, p_id_usuario);

END $$
DELIMITER ;



DELIMITER $$

CREATE PROCEDURE ver_perfil(
    p_id_usuario INT
)
BEGIN
    SELECT 
        u.nombre, 
        u.apellido, 
        u.url_foto_perfil, 
        u.correo, 
        COUNT(lu.id_libro) AS cantidad_libros
    FROM usuarios u
    LEFT JOIN libros_usuarios lu ON u.id_usuario = lu.id_usuario
    WHERE u.id_usuario = p_id_usuario
    GROUP BY u.id_usuario;

END $$

DELIMITER ;


-- Procedimiento para actualizar el perfil de el usuario
DELIMITER $$

CREATE PROCEDURE actualizar_perfil (
    p_id_usuario INT,
    p_nombre VARCHAR(50),
    p_apellido VARCHAR(50),
    p_url_foto_perfil TEXT,
    p_correo VARCHAR(50),
    p_contrasenia VARCHAR(255)
)
BEGIN
    -- Confirmar la contraseña
    DECLARE contrasenia_conf VARCHAR(255);
    
    SELECT contrasenia INTO contrasenia_conf
    FROM usuarios
    WHERE contrasenia = SHA2(p_contrasenia, 256) 
          AND id_usuario = p_id_usuario
    LIMIT 1;
    
    IF contrasenia_conf IS NOT NULL THEN
        UPDATE usuarios
        SET nombre = COALESCE(p_nombre, nombre),
            apellido = COALESCE(p_apellido, apellido),
            url_foto_perfil = COALESCE(p_url_foto_perfil, url_foto_perfil),
            correo = COALESCE(p_correo, correo)
        WHERE id_usuario = p_id_usuario;
    ELSE
        SELECT 'Invalido' AS Error;
    END IF;

END $$

DELIMITER ;



-- Ver los libros que ha adquirido el usuario
DELIMITER $$

CREATE PROCEDURE ver_mis_libros(
	p_id_usuario INT
)
BEGIN
	SELECT li.url_portada, li.nombre_libro, li.autor, li.url_pdf 
    FROM libros li
    INNER JOIN libros_usuarios lu ON lu.id_libro = li.id_libro
    WHERE lu.id_usuario = p_id_usuario;

END $$

DELIMITER ;


