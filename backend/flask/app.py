from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from mysql.connector import Error
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from datetime import datetime
from botocore.exceptions import NoCredentialsError
import os
import boto3

from db import get_connection  

# load_dotenv(dotenv_path="../.env")  
load_dotenv()
# print(os.getenv('DB_NAME'))
port = os.getenv('PORT', 3000)   #Puerto de .env y en su defecto asignar el 4000

app = Flask(__name__)
CORS(app)



#--------------------------------------- ENTRADA/PRUEBA CONEXION ----------------------------
# @app.route('/', methods=['GET'])
# def entradaAPI():
#     return jsonify({"message": "Bienvenido a la api en Flask del G6"}), 200

@app.route("/")
def home():
    return "Bienvenido a la api en Flask del G6", 200

@app.route('/', methods=['GET'])
def entradaAPI():
    return jsonify({"message": "Bienvenido a la api en Flask del G6"}), 200


@app.route('/test-connection', methods=['GET'])
def test_connection():
    connectionDB = get_connection()
    
    if connectionDB is None:
        return jsonify({"message": "❌ Error en la conexión"}), 500
    
    try:
        cursor = connectionDB.cursor()
        cursor.execute('SELECT 1 + 1 AS result')
        rows = cursor.fetchone()  
        cursor.close()
        connectionDB.close()

        return jsonify({"message": "✅ Conexión exitosa a la base de datos", "result": rows[0]}), 200
    except Error as e:
        return jsonify({"message": f"❌ Error en la consulta: {e}"}), 500
    

#--------------------------------------- CONFIGURACION DE AWS S3 ----------------------------
s3_client  = boto3.client('s3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_FOTOS'),
    aws_secret_access_key=os.getenv('AWS_SECRET_KEY_FOTOS')
)

# Extensiones permitidas
ALLOWED_EXTENSIONS = {"jpeg", "jpg", "png", "pdf"}

def allowed_file(filename):
    """Verifica si la extensión del archivo es válida."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_file_to_s3(file, folder):
    """Sube un archivo a S3 y retorna el nombre del archivo."""
    filename = f"{folder}/{int(datetime.now().timestamp())}-{secure_filename(file.filename)}"
    try:
        s3_client.upload_fileobj(file, os.getenv("AWS_BUCKET_NAME"), filename)
        return filename
    except Exception as e:
        raise Exception(f"Error al subir el archivo a S3: {str(e)}")

def delete_file_from_s3(file_url):
    """Elimina un archivo de S3 dado su URL completa."""
    bucket_name = os.getenv("AWS_BUCKET_NAME")
    file_key = file_url.replace(os.getenv("AWS_URL_DATA"), "")  # Extrae solo el key del archivo

    try:
        s3_client.delete_object(Bucket=bucket_name, Key=file_key)
        print(f"Archivo eliminado de S3: {file_url}")
    except NoCredentialsError:
        print("Error: No se encontraron credenciales de AWS")
    except Exception as e:
        print(f"Error al eliminar archivo de S3: {str(e)}")
    
#--------------------------------------- RUTAS ADMIN ---------------------------------------

@app.route("/admin/uploadBook", methods=["POST"])
def upload():
    if 'p_url_portada' not in request.files or 'p_url_pdf' not in request.files:
        return jsonify({"error": "Faltan archivos"}), 400

    files = {
        "p_url_portada": request.files["p_url_portada"],
        "p_url_pdf": request.files["p_url_pdf"]
    }

    uploaded_files = {}

    for key, file in files.items():
        if file and allowed_file(file.filename):
            if key == "p_url_pdf":
                # Si es un PDF, lo subimos a la carpeta "libros"
                folder = "Libros"
            else:
                # Si es una imagen, lo subimos a la carpeta "fotos"
                folder = "Fotos"

            try:
                file_name = upload_file_to_s3(file, folder)
                uploaded_files[key] =  f"{os.getenv('AWS_URL_DATA')}{file_name}"
            except Exception as e:
                return jsonify({"error": f"Error al subir {key}: {str(e)}"}), 500
        else:
            return jsonify({"error": f"Archivo {key} no permitido"}), 400

    # Insertar en la base de datos
    try:
        connection = get_connection()
        if connection is None:
            return jsonify({"error": "Error en la conexión a la base de datos"}), 500
        cursor = connection.cursor()
        
        p_nombre_libro = request.form.get('p_nombre_libro')
        p_sinopsis = request.form.get('p_sinopsis')
        p_autor = request.form.get('p_autor')
        p_anio_publicacion = request.form.get('p_anio_publicacion')
        
        portada_file = uploaded_files.get('p_url_portada')
        pdf_file = uploaded_files.get('p_url_pdf')
        
        cursor.callproc('cargar_libros', [
            p_nombre_libro, portada_file, p_sinopsis, p_autor, p_anio_publicacion, pdf_file
        ])
        
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({
            "message": "Libro cargado correctamente",
            "portada": portada_file,
            "pdf": pdf_file
        }), 200

    except Error as e:
        return jsonify({"error": "Error al insertar en la base de datos", "details": str(e)}), 500

@app.route('/admin/books', methods=['GET'])
def books():
    connection = get_connection()
    
    if connection is None:
        print("Error en la conexión a la base de datos")
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500
    
    print("Conexión exitosa")
    
    try:
        cursor = connection.cursor()
        cursor.callproc('ver_libros_admin') 

        result_books = []
        
        for result in cursor.stored_results():
            column_names = [desc[0] for desc in result.description]  # Obtener nombres de columnas
            result_books = [dict(zip(column_names, row)) for row in result.fetchall()]  # Convertir a diccionario
        
        cursor.close()
        connection.close()

        if result_books and len(result_books) > 0:
            response = make_response(jsonify({
                "message": "Libros encontrados",
                "books": result_books  
            }), 200)
        else:
            response = make_response(jsonify({"message": "No hay libros para listar"}), 404)

        # Cabeceras opcionales
        response.headers["Content-Type"] = "application/json"
        return response

    except Error as e:
        print(f"Error al ejecutar admin/Books: {e}")
        response = make_response(jsonify({
            "error": "Error al ejecutar admin/Books",
            "details": e.msg
        }), 500)
        
        response.headers["Content-Type"] = "application/json"
        return response

@app.route('/admin/assignCategory', methods=['POST'])
def assign_category():
    data = request.get_json()

    nombre_libro = data.get('nombre_libro')
    autor = data.get('autor')
    categorias = data.get('categorias')

    if not nombre_libro or not autor or not categorias:
        return jsonify({"error": "Faltan datos en la solicitud"}), 400

    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500

    try:
        cursor = connection.cursor()
        cursor.callproc('asignar_categorias', [nombre_libro, autor, categorias])
        results = cursor.stored_results()
        for result in results:
            error_msg = result.fetchall()

            if error_msg and error_msg[0] and error_msg[0][0]:
                return jsonify({"error": error_msg[0][0]}), 400

        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({"message": "Categoría(s) asignada(s) con éxito al libro"}), 200
    except Error as e:
        return jsonify({"error": "Error al ejecutar admin/assignCategory", "details": e.msg}), 500
    
@app.route("/admin/updateBook", methods=["PUT"])
def update_book():
    try:
        # Obtener datos del formulario
        p_id_libro = request.form.get("id_libro")
        p_nombre_libro = request.form.get("p_nombre_libro")
        p_sinopsis = request.form.get("p_sinopsis")
        p_autor = request.form.get("p_autor")
        p_anio_publicacion = request.form.get("p_anio_publicacion")

        if not p_id_libro:
            return jsonify({"error": "El ID del libro es obligatorio"}), 400

        connection = get_connection()
        if connection is None:
            return jsonify({"error": "Error en la conexión a la base de datos"}), 500

        cursor = connection.cursor()

        # 1. Obtener las URLs actuales del libro en la base de datos
        cursor.callproc("ver_url_libros", [p_id_libro])
        result = cursor.stored_results()
        url_actual = next(result).fetchone() if result else None


        if not url_actual:
            return jsonify({"error": "Libro no encontrado"}), 404

        old_pdf = url_actual[0]  # Primera columna (url_pdf)
        old_portada = url_actual[1]  # Segunda columna (url_portada)

        # Inicializar nombres de archivo
        url_portada_actual = old_portada
        url_pdf_actual = old_pdf

        # 2. Manejo de archivos
        uploaded_files = {}

        files = {
            "p_url_portada": request.files.get("p_url_portada"),
            "p_url_pdf": request.files.get("p_url_pdf")
        }

        for key, file in files.items():
            if file and allowed_file(file.filename):
                folder = "Libros" if key == "p_url_pdf" else "Fotos"

                try:
                    # Eliminar archivo anterior si existe y se sube uno nuevo
                    if key == "p_url_pdf" and url_pdf_actual:
                        delete_file_from_s3(url_pdf_actual)  # Función para eliminar de S3
                    if key == "p_url_portada" and url_portada_actual:
                        delete_file_from_s3(url_portada_actual)

                    # Subir el nuevo archivo
                    file_name = upload_file_to_s3(file, folder)
                    uploaded_files[key] = f"{os.getenv('AWS_URL_DATA')}{file_name}"

                except Exception as e:
                    print(f"Error al subir {key}: {str(e)}")
                    return jsonify({"error": f"Error al subir {key}: {str(e)}"}), 500

        # 3. Actualizar en la base de datos con los nuevos datos
        cursor.callproc('actualizar_libros', [
            p_id_libro,
            p_nombre_libro,
            uploaded_files.get('p_url_portada', url_portada_actual),  # Mantiene la URL actual si no hay nueva imagen
            p_autor,
            p_sinopsis,
            uploaded_files.get('p_url_pdf', url_pdf_actual),  # Mantiene la URL actual si no hay nuevo PDF
            p_anio_publicacion
        ])

        connection.commit()
        cursor.close()
        connection.close()
        print("Libro actualizado correctamente")
        return jsonify({
            "message": "Libro actualizado correctamente",
            "portada": uploaded_files.get('p_url_portada', url_portada_actual),
            "pdf": uploaded_files.get('p_url_pdf', url_pdf_actual)
        }), 200

    except Error as e:
        print(f"Error al actualizar el libro: {e}")
        return jsonify({"error": "Error al actualizar el libro", "details": str(e)}), 500

@app.route('/admin/deleteBook/<int:id_libro>', methods=['DELETE'])
def delete_book(id_libro):
    connection = get_connection()

    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # 1. Obtener las URLs actuales del libro en la base de datos
        cursor.callproc("ver_url_libros", [id_libro])
        result = cursor.stored_results()
        url_actual = next(result).fetchone() if result else None


        if not url_actual:
            return jsonify({"error": "Libro no encontrado"}), 404

        old_pdf = url_actual[0]  # Primera columna (url_pdf)
        old_portada = url_actual[1]  # Segunda columna (url_portada)

        # Inicializar nombres de archivo
        url_portada_actual = old_portada
        url_pdf_actual = old_pdf

        # Eliminar archivos de S3
        if url_pdf_actual:
            delete_file_from_s3(url_pdf_actual)
        if url_portada_actual:
            delete_file_from_s3(url_portada_actual)

        # Llamar procedimiento para eliminar el libro
        cursor.callproc('eliminar_libros', [id_libro])
        connection.commit()

        cursor.close()
        connection.close()
        return jsonify({"message": "Libro eliminado exitosamente"}), 200

    except Error as e:
        return jsonify({"error": "Error al eliminar el libro", "details": str(e)}), 500


#-------------------------------------------------------------------------------------------
#--------------------------------------- RUTAS USER ----------------------------------------

@app.route('/user/login', methods=['POST'])
def login():
    data = request.get_json() 
    email = data.get('email')
    password = data.get('password')

    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500

    try:
        cursor = connection.cursor()
        cursor.callproc('login', [email, password])

        results = cursor.stored_results()
        user_data = None

        for result in results:
            columns = [col[0] for col in result.description] 
            rows = result.fetchall()
            
            if rows:
                user_data = dict(zip(columns, rows[0])) 

        cursor.close()
        connection.close()

        if user_data:
            response_data = {
                "id_usuario": user_data.get("id_usuario"),
                "p_nombre": user_data.get("nombre"),
                "p_apellido": user_data.get("apellido"),
                "p_correo": user_data.get("correo"),
                "p_url_foto_perfil": user_data.get("url_foto_perfil")
            }

            return jsonify(response_data), 200  # Ahora devuelve solo el objeto sin envolverlo en una lista
        else:
            return jsonify({"message": "Credenciales incorrectas"}), 401
    except Error as e:
        return jsonify({"error": "Error en la autenticación de usuario / login", "details": e.msg}), 500


@app.route('/user/signup', methods=['POST'])
def signup():
    if 'p_url_foto_perfil' not in request.files:
        return jsonify({"error": "Falta la imagen de perfil"}), 400

    file = request.files['p_url_foto_perfil']
    if file and allowed_file(file.filename):
        try:
            file_name = upload_file_to_s3(file, "Fotos")
            url_foto = f"{os.getenv('AWS_URL_DATA')}{file_name}"
        except Exception as e:
            return jsonify({"error": f"Error al subir la imagen de perfil: {str(e)}"}), 500
    else:
        return jsonify({"error": "Archivo de imagen no permitido"}), 400

    data = request.form
    nombre = data.get('p_nombre')
    apellido = data.get('p_apellido')
    email = data.get('p_correo')
    password = data.get('p_contrasenia')

    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500

    try:
        cursor = connection.cursor()
        cursor.callproc('registro_usuario', [nombre, apellido, url_foto, email, password])
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({"message": "Usuario registrado con éxito", "p_url_foto_perfil": url_foto}), 201
    except Error as e:
        return jsonify({"error": "Error al ejecutar signup", "details": str(e)}), 500


# Ver todos los libros de parte del usuario, incluyendo si los ha adquirido o no
@app.route('/user/books/<int:id_user>', methods=['GET'])
def booksUser(id_user):
    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500
    
    try:
        cursor = connection.cursor()
        cursor.callproc('ver_libros_usuario', [id_user]) 
        result_books = []
        for result in cursor.stored_results():
            columns = [col[0] for col in result.description] 
            rows = result.fetchall()
            result_books = [dict(zip(columns, row)) for row in rows]  
        
        cursor.close()
        connection.close()

        if result_books:
            return jsonify({
                "message": "Libros encontrados",
                "books": result_books
            }), 200
        else:
            return jsonify({"message": "El usuario no tiene libros"}), 404
    except Error as e:
        return jsonify({"error": "Error al ejecutar user/book", "details": e.msg}), 500


@app.route('/user/getBook', methods=['POST'])
def get_book():
    data = request.get_json()
    id_user = data.get('id_user')
    id_book = data.get('id_book')

    if not id_user or not id_book:
        return jsonify({"error": "Faltan parámetros 'id_user' o 'id_book'"}), 400

    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500
    
    try:
        cursor = connection.cursor()
        cursor.callproc('adquirir_libros', [id_user, id_book]) 
        connection.commit() 

        cursor.close()
        connection.close()
        return jsonify({"message": "Libro adquirido"}), 200
    except Error as e:
        return jsonify({"error": "Error al ejecutar user/getBook", "details": e.msg}), 500
    

@app.route('/user/profile/<int:id_user>', methods=['GET'])
def profile(id_user):
    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.callproc('ver_perfil', [id_user]) 
        results = []
        
        for result in cursor.stored_results():
            results = result.fetchall()

        cursor.close()
        connection.close()

        if results and len(results) > 0:
            return jsonify({
                "message": "Usuario encontrado",
                "user": results
            }), 200
        else:
            return jsonify({"message": "No se encontró el usuario"}), 404
    except Error as e:
        return jsonify({"error": "Error al ejecutar user/profile", "details": e.msg}), 500

@app.route('/user/updateProfile', methods=['PUT'])
def update_profile():
    try:
        id_usuario = request.form.get('id_usuario')
        nombre = request.form.get('p_nombre')
        apellido = request.form.get('p_apellido')
        email = request.form.get('p_correo')
        password = request.form.get('p_contrasenia')

        if not all([id_usuario, nombre, apellido, email]):
            return jsonify({"error": "Faltan parámetros obligatorios"}), 400

        connection = get_connection()
        if connection is None:
            return jsonify({"error": "Error en la conexión a la base de datos"}), 500

        cursor = connection.cursor()
        cursor.callproc("ver_url_usuarios", [id_usuario])
        result = cursor.stored_results()
        url_actual = next(result).fetchone() if result else None

        if not url_actual:
            return jsonify({"error": "Usuario no encontrado"}), 404

        old_url_foto = url_actual[0]  # URL actual de la foto de perfil
        url_foto_actual = old_url_foto

        # Manejo de la nueva imagen de perfil
        file = request.files.get("p_url_foto_perfil")
        if file and allowed_file(file.filename):
            try:
                # Eliminar imagen anterior si existe
                if old_url_foto:
                    delete_file_from_s3(old_url_foto)
                
                # Subir la nueva imagen
                file_name = upload_file_to_s3(file, "Fotos")
                url_foto_actual = f"{os.getenv('AWS_URL_DATA')}{file_name}"
            except Exception as e:
                return jsonify({"error": f"Error al subir la imagen de perfil: {str(e)}"}), 500

        # Actualizar en la base de datos
        cursor.callproc('actualizar_perfil', [id_usuario, nombre, apellido, url_foto_actual, email, password])
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({"message": "Perfil actualizado con éxito", "p_url_foto_perfil": url_foto_actual}), 200
    except Error as e:
        return jsonify({"error": "Error al ejecutar user/updateProfile", "details": str(e)}), 500


@app.route('/user/myBooks/<int:id_user>', methods=['GET'])
def my_books(id_user):
    connection = get_connection()
    if connection is None:
        return jsonify({"error": "Error en la conexión a la base de datos"}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.callproc('ver_mis_libros', [id_user]) 
        result_books = []
        
        for result in cursor.stored_results():
            result_books = result.fetchall()

        cursor.close()
        connection.close()
        if result_books and len(result_books) > 0:
            return jsonify({
                "message": "Libros encontrados",
                "books": result_books
            }), 200
        else:
            return jsonify({"message": "El usuario no tiene libros"}), 404
    except Error as e:
        return jsonify({"error": "Error al ejecutar user/myBooks", "details": e.msg}), 500
#-------------------------------------------------------------------------------------------

if __name__ == '__main__':
    # quitar debug=true cuando se suba -> debug=false  / host = direcciones permitidas
    app.run(host='0.0.0.0', port=port, debug=True)