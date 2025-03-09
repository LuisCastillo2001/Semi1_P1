
import multer   from 'multer';
import AWS from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import connectionDB from '../db/connection.js';

//----------------------------Configuraciones para S3

// Inicializar S3Client de v3
const { S3Client, PutObjectCommand, DeleteObjectCommand } = AWS;
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_FOTOS,
    secretAccessKey: process.env.AWS_SECRET_KEY_FOTOS
  }
});

// **Configuración de multer para imágenes o libros**
const storage = multer.memoryStorage();  // Usamos almacenamiento en memoria

const upload = multer({
  storage: storage,  // Usamos almacenamiento en memoria
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;  // Permite imágenes y PDF
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extName) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG) o PDFs'));
  }
});

// **Función para subir archivos a S3 usando PutObjectCommand**
const uploadFileToS3 = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
  
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,  // El archivo se sube desde la memoria (buffer)
    };
  
    try {
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);
      console.log('Archivo subido con éxito:');
      return fileName;  // Retornamos el nombre del archivo subido
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      throw error;  // Lanza el error para manejarlo en el controlador
    }
};

// **Función para eliminar archivos de S3**
const deleteFileFromS3 = async (fileUrl) => {
  if (!fileUrl) return;

  const fileName = fileUrl.replace(process.env.AWS_URL_DATA, ''); // Extraer solo el nombre del archivo

  const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName
  };

  try {
      await s3.send(new DeleteObjectCommand(params));
      console.log(`Archivo eliminado de S3: ${fileName}`);
  } catch (error) {
      console.error('Error al eliminar archivo en S3:', error);
  }
};

//----------------------------------


const login = (req, res) => {
    const { email, password } = req.body;
    connectionDB.query(
        'CALL login(?, ?)',
        [email, password],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error en la autenticación de usuario / login', details: err.message });
            }
            if (results.length > 0 && results[0].length > 0) {
                const user = results[0][0]; // Obtener el primer resultado del primer conjunto de resultados
                
                return res.status(200).json({
                    message: 'OK',
                    id_usuario: user.id_usuario,
                    p_nombre: user.nombre,
                    p_apellido: user.apellido,
                    p_correo: user.correo,
                    p_url_foto_perfil: user.url_foto_perfil
                });
            } else {
                // 401 no autorizado -> directamente para inicio de sesion / 404 no encontrado
                return res.status(401).json({ message: 'Credenciales incorrectas' });
            }
        }
    );
};

const signup = (req, res) => {
    upload.single('p_url_foto_perfil')(req, res, async (err) => {  // Aquí usamos single()
        if (err) {
            return res.status(400).json({ error: 'Error al subir el archivo', details: err.message });
        }

        const { p_nombre, p_apellido, p_correo, p_contrasenia } = req.body;
        const url_foto = req.file || null;

        try {
            let fotoPerfilUrl = "";

            // Subir la foto a S3 si existe
            if (url_foto) {
                fotoPerfilUrl = process.env.AWS_URL_DATA + await uploadFileToS3(url_foto, 'Fotos');
            }

            // Guardar en la base de datos
            connectionDB.query(
                'CALL registro_usuario(?, ?, ?, ?, ?)',
                [p_nombre, p_apellido, fotoPerfilUrl, p_correo, p_contrasenia],
                (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al ejecutar signup", details: err.message });
                    }

                    // Obtener el ID del nuevo usuario
                    // const id_usuario = results[0][0].id_usuario;

                    res.status(200).json({
                        // id_usuario,
                        p_nombre,
                        p_apellido,
                        p_correo,
                        p_url_foto_perfil: fotoPerfilUrl
                    });
                }
            );
        } catch (error) {
            return res.status(500).json({ error: 'Error al subir la foto de perfil a S3', details: error.message });
        }
    });
};


// Ver todos los libros de parte del usuario, incluyendo si los ha adquirido o no
const books = (req, res) => {
    const { id_user } = req.params;
    connectionDB.query(
        'CALL ver_libros_usuario (?)',
        [id_user],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Error al ejecutar user/book", details: err.message });
            }

            if (results[0].length > 0) {
                return res.status(200).json({
                    message: 'Libros encontrados',
                    books: results[0]
                });
            } else {
                return res.status(404).json({ message: 'El usuario no tiene libros' });
            }
        }
    )
}

const getBook = (req, res) => {
    const { id_user, id_book } = req.body;
    connectionDB.query(
        'CALL adquirir_libros (?, ?)',
        [id_user, id_book],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Error al ejecutar user/getBook", details: err.message });
            }
            res.status(200).json({ message: "Libro adquirido" });
        }

    )
}

const profile = (req, res) => {
    const { id_user } = req.params;
    connectionDB.query(
        'CALL ver_perfil (?)',
        [id_user],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Error al ejecutar user/profile", details: err.message });
            }

            if (results[0].length > 0) {
                return res.status(200).json({
                    message: 'Usuario encontrado',
                    user: results[0]
                });
            } else {
                return res.status(404).json({ message: 'No se encontro el usuario' });
            }

        }
    )
}

//Se manda password aunque no se pueda cambiar para realizar la confirmacion
const updateProfile = (req, res) => {
    upload.single('p_url_foto_perfil')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: 'Error al subir el archivo', details: err.message });
        }

        const { id_usuario, p_nombre, p_apellido, p_correo, p_contrasenia } = req.body;
        const p_url_foto = req.file || null;
        console.log(id_usuario);
        try {
            let fotoPerfilUrl = p_url_foto;

            if (p_url_foto) {
                // Obtener la URL actual de la foto de perfil del usuario
                connectionDB.query('CALL ver_url_usuarios(?)', [id_usuario], async (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al obtener la URL actual del usuario", details: err.message });
                    }

                    const oldFotoPerfilUrl = results[0][0].url_foto_perfil;
                    console.log("ruta",oldFotoPerfilUrl);
                    // Eliminar la imagen actual del S3 si existe
                    if (oldFotoPerfilUrl) {
                        await deleteFileFromS3(oldFotoPerfilUrl);
                    }

                    // Subir la nueva imagen al S3
                    fotoPerfilUrl = process.env.AWS_URL_DATA + await uploadFileToS3(p_url_foto, 'Fotos');

                    // Actualizar el perfil del usuario en la base de datos
                    connectionDB.query(
                        'CALL actualizar_perfil (?, ?, ?, ?, ?, ?)',
                        [id_usuario, p_nombre, p_apellido, fotoPerfilUrl, p_correo, p_contrasenia],
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({ error: "Error al ejecutar user/updateProfile", details: err.message });
                            }

                            if (result && result[0] && result[0][0] && result[0][0].Error) {
                                return res.status(400).json({ error: 'Contraseña incorrecta o usuario no encontrado' });
                            }
                            res.status(200).json({ message: 'Perfil actualizado con éxito' });
                        }
                    );
                });
            } else {
                // Actualizar el perfil del usuario en la base de datos sin cambiar la foto de perfil
                connectionDB.query(
                    'CALL actualizar_perfil (?, ?, ?, ?, ?, ?)',
                    [id_usuario, p_nombre, p_apellido, fotoPerfilUrl, p_correo, p_contrasenia],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ error: "Error al ejecutar user/updateProfile", details: err.message });
                        }

                        if (result && result[0] && result[0][0] && result[0][0].Error) {
                            return res.status(400).json({ error: 'Contraseña incorrecta o usuario no encontrado' });
                        }
                        res.status(200).json({ message: 'Perfil actualizado con éxito' });
                    }
                );
            }
        } catch (error) {
            return res.status(500).json({ error: 'Error al actualizar el perfil', details: error.message });
        }
    });
};

// -- Ver los libros que ha adquirido el usuario
const myBooks = (req, res) => {
    const { id_user } = req.params;
    connectionDB.query(
        'CALL ver_mis_libros (?)',
        [id_user],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Error al ejecutar user/myBooks", details: err.message });
            }

            if (results[0].length > 0) {
                return res.status(200).json({
                    message: 'Libros encontrados',
                    books: results[0]
                });
            } else {
                return res.status(404).json({ message: 'El usuario no tiene libros' });
            }

        }
    )
}

export {
    login,
    signup,
    books,
    getBook,
    profile,
    updateProfile,
    myBooks
}