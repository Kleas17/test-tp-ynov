import os
import time

import mysql.connector
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    dateNaissance: str
    cp: str
    ville: str


def get_db_config():
    return {
        "database": os.getenv("MYSQL_DATABASE", "ynov_ci"),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQL_ROOT_PASSWORD"),
        "port": int(os.getenv("MYSQL_PORT", "3306")),
        "host": os.getenv("MYSQL_HOST", "mysql"),
    }


def create_connection(max_attempts=15, delay_seconds=2):
    last_error = None

    for _ in range(max_attempts):
        try:
            return mysql.connector.connect(**get_db_config())
        except mysql.connector.Error as exc:
            last_error = exc
            time.sleep(delay_seconds)

    raise last_error


def get_connection():
    connection = getattr(app.state, "conn", None)

    if connection is None or not connection.is_connected():
        app.state.conn = create_connection()

    return app.state.conn


@app.on_event("shutdown")
def close_connection():
    connection = getattr(app.state, "conn", None)
    if connection is not None and connection.is_connected():
        connection.close()


@app.get("/health")
async def health():
    connection = get_connection()
    return {"status": "ok", "database": connection.is_connected()}


@app.get("/users")
async def get_users():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
              id,
              nom,
              prenom,
              email,
              DATE_FORMAT(date_naissance, '%Y-%m-%d') AS dateNaissance,
              code_postal AS cp,
              ville
            FROM utilisateur
            ORDER BY id
            """
        )
        return cursor.fetchall()
    finally:
        cursor.close()


@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    connection = get_connection()
    cursor = connection.cursor()
    user_id = None

    try:
        cursor.execute(
            """
            INSERT INTO utilisateur (nom, prenom, email, date_naissance, code_postal, ville)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user.nom,
                user.prenom,
                user.email,
                user.dateNaissance,
                user.cp,
                user.ville,
            ),
        )
        connection.commit()
        user_id = cursor.lastrowid
    except mysql.connector.IntegrityError:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Un utilisateur avec cet email existe deja."},
        )
    finally:
        cursor.close()

    return {"id": user_id, "message": "Utilisateur cree."}
