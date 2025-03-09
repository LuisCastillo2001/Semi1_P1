
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
}).fields([
  { name: 'p_url_portada', maxCount: 1 },
  { name: 'p_url_pdf', maxCount: 1 }
]);

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

const books = (req, res) => {
    connectionDB.query(
        'CALL ver_libros_admin',
        [],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Error al ejecutar admin/listBooks", details: err.message });
            }

            if (results[0].length > 0) {
                return res.status(200).json({
                    message: 'Libros encontrados',
                    books: results[0]
                });
            } else {
                return res.status(404).json({ message: 'No hay libros para listar' });
            }
        }
    )
}

// -- Cargar los libros de parte del admin, nota los libros se cargan sin categorías al insertar
const uploadBook = (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error al subir el archivo', details: err.message });
      }
  
      // Los campos de texto estarán en req.body
      const { p_nombre_libro, p_sinopsis, p_autor, p_anio_publicacion } = req.body;
  
      // Los archivos estarán en req.files
      const url_portada = req.files['p_url_portada'] ? req.files['p_url_portada'][0] : null;
      const url_pdf = req.files['p_url_pdf'] ? req.files['p_url_pdf'][0] : null;
  
      if (!url_portada || !url_pdf) {
        return res.status(400).json({ error: 'Faltan archivos requeridos' });
      }
  
      try {
        // Subir archivos a S3
        const portadaFileName = process.env.AWS_URL_DATA+await uploadFileToS3(url_portada, 'Fotos');
        const pdfFileName = process.env.AWS_URL_DATA+ await uploadFileToS3(url_pdf, 'Libros');
        
        // Guardar en la base de datos
        connectionDB.query(
          'CALL cargar_libros (?, ?, ?, ?, ?, ?)',
          [p_nombre_libro, portadaFileName, p_sinopsis, p_autor, p_anio_publicacion, pdfFileName],
          (err, results) => {
            if (err) {
              return res.status(500).json({ error: "Error al ejecutar admin/uploadBook", details: err.message });
            }
            res.status(200).json({ message: "Libro cargado correctamente", portada: portadaFileName, pdf: pdfFileName });
          }
        );
      } catch (error) {
        return res.status(500).json({ error: 'Error al subir los archivos a S3', details: error.message });
      }
    });
  };

// -- cargar categorías del libro se pueden mandar las categorias como un string separado por comas, la categoría tiene que existir en la tabla categorías
const assignCategory = (req, res) => {
    const { nombre_libro, autor, categorias } = req.body;
    connectionDB.query(
        'CALL asignar_categorias (?, ?, ?)',
        [nombre_libro, autor, categorias],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Error al ejecutar admin/assignCategory", details: err.message });
            }
            if (results && results[0] && results[0][0] && results[0][0].ERROR) {  // Verificar si el procedimiento devolvió un mensaje de error
                return res.status(400).json({ error: results[0][0].ERROR });
            }
            res.status(200).json({ message: 'Categoría(s) asignada(s) con éxito al libro' });
        }
    )
}

const updateBook = (req, res) => {
  upload(req, res, async (err) => {
      if (err) {
          return res.status(400).json({ error: 'Error al subir el archivo', details: err.message });
      }

      const { id_libro, p_nombre_libro, p_sinopsis, p_autor, p_anio_publicacion } = req.body;
      const url_portada = req.files?.['p_url_portada'] ? req.files['p_url_portada'][0] : null;
      const url_pdf = req.files?.['p_url_pdf'] ? req.files['p_url_pdf'][0] : null;

      try {
          let portadaFileName = null;
          let pdfFileName = null;

          if (url_portada || url_pdf) {
              // Obtener las URLs actuales del libro
              connectionDB.query('CALL ver_url_libros(?)', [id_libro], async (err, results) => {
                  if (err) {
                      return res.status(500).json({ error: "Error al obtener URLs actuales", details: err.message });
                  }

                  const { url_pdf: oldPdf, url_portada: oldPortada } = results[0][0]; 

                  // Si hay una nueva portada, eliminar la anterior y subir la nueva
                  if (url_portada) {
                      await deleteFileFromS3(oldPortada);
                      portadaFileName = process.env.AWS_URL_DATA + await uploadFileToS3(url_portada, 'Fotos');
                  } else {
                      portadaFileName = oldPortada;
                  }

                  // Si hay un nuevo PDF, eliminar el anterior y subir el nuevo
                  if (url_pdf) {
                      await deleteFileFromS3(oldPdf);
                      pdfFileName = process.env.AWS_URL_DATA + await uploadFileToS3(url_pdf, 'Libros');
                  } else {
                      pdfFileName = oldPdf;
                  }

                  // Actualizar en la base de datos
                  connectionDB.query(
                      'CALL actualizar_libros (?, ?, ?, ?, ?, ?, ?)',
                      [id_libro, p_nombre_libro, portadaFileName, p_autor, p_sinopsis, pdfFileName, p_anio_publicacion],
                      (err, results) => {
                          if (err) {
                              return res.status(500).json({ error: "Error al ejecutar admin/updateBook", details: err.message });
                          }
                          res.status(200).json({ message: "Libro actualizado correctamente", portada: portadaFileName, pdf: pdfFileName });
                      }
                  );
              });
          } else {
              // Si no se envió ningún archivo, solo actualizar los datos sin tocar S3
              connectionDB.query('CALL ver_url_libros(?)', [id_libro], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Error al obtener URLs actuales", details: err.message });
                }

                const { url_pdf: oldPdf, url_portada: oldPortada } = results[0][0];

                connectionDB.query(
                    'CALL actualizar_libros (?, ?, ?, ?, ?, ?, ?)',
                    [id_libro, p_nombre_libro, oldPortada, p_autor, p_sinopsis, oldPdf, p_anio_publicacion],
                    (err, results) => {
                        if (err) {
                            return res.status(500).json({ error: "Error al ejecutar admin/updateBook", details: err.message });
                        }
                        res.status(200).json({ message: "Libro actualizado correctamente", portada: oldPortada, pdf: oldPdf });
                    }
                );
              });
          }
      } catch (error) {
          return res.status(500).json({ error: 'Error al actualizar el libro', details: error.message });
      }
  });
};

const deleteBook = (req, res) => {
  const { id_libro } = req.params;

  // Obtener las URLs actuales antes de eliminar el libro
  connectionDB.query('CALL ver_url_libros(?)', [id_libro], async (err, results) => {
      if (err) {
          return res.status(500).json({ error: "Error al obtener URLs del libro", details: err.message });
      }

      if (results[0].length === 0) {
          return res.status(404).json({ error: "Libro no encontrado" });
      }

      const { url_pdf: oldPdf, url_portada: oldPortada } = results[0][0];

      try {
          // Establecer los nombres de los archivos para eliminar
          let portadaFileName = oldPortada;
          let pdfFileName = oldPdf;

          // Eliminar los archivos en S3 si existen
          if (portadaFileName) {
              await deleteFileFromS3(portadaFileName);
          }

          if (pdfFileName) {
              await deleteFileFromS3(pdfFileName);
          }

          // Eliminar el libro de la base de datos
          connectionDB.query('CALL eliminar_libros(?)', [id_libro], (err, results) => {
              if (err) {
                  return res.status(500).json({ error: "Error al ejecutar admin/deleteBook", details: err.message });
              }
              res.status(200).json({ message: 'Libro eliminado exitosamente' });
          });
      } catch (error) {
          return res.status(500).json({ error: "Error al eliminar archivos en S3", details: error.message });
      }
  });
};

export {
    uploadBook,
    assignCategory,
    updateBook,
    deleteBook,
    books
}