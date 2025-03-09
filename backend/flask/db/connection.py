import mysql.connector
from dotenv import load_dotenv
import os

# load_dotenv(dotenv_path="../.env")  
# Cargar variables desde .env
load_dotenv()
# print(os.getenv("DB_HOST"))

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME"),
    )
