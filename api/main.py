import os
import time

import mysql.connector
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI()

DEFAULT_USERS = [
    ("Dupont", "Alice", "alice.dupont@ynov.local", "1998-04-12", "75001", "Paris"),
    ("Martin", "Leo", "leo.martin@ynov.local", "1996-09-30", "69002", "Lyon"),
]
TRUE_ENV_VALUES = {"1", "true", "yes", "on"}

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


class TestResetRequest(BaseModel):
    seed: bool = True
    users: list[UserCreate] = Field(default_factory=list)


class NextCreateUserFaultRequest(BaseModel):
    statusCode: int = Field(default=500, ge=400, le=599)


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


def e2e_routes_enabled():
    return os.getenv("ENABLE_E2E_TEST_ROUTES", "false").strip().lower() in TRUE_ENV_VALUES


def assert_e2e_routes_enabled():
    if not e2e_routes_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


def insert_users(cursor, users):
    if not users:
        return

    rows = []
    for user in users:
        if isinstance(user, UserCreate):
            rows.append(
                (
                    user.nom,
                    user.prenom,
                    user.email,
                    user.dateNaissance,
                    user.cp,
                    user.ville,
                )
            )
        else:
            rows.append(user)

    cursor.executemany(
        """
        INSERT INTO utilisateur (nom, prenom, email, date_naissance, code_postal, ville)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        rows,
    )


def consume_next_create_user_fault():
    status_code = getattr(app.state, "next_create_user_status", None)
    if status_code is None:
        return

    app.state.next_create_user_status = None
    raise HTTPException(status_code=status_code, detail="Injected failure for E2E")


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


@app.post("/test/reset")
async def reset_users(request: TestResetRequest | None = None):
    assert_e2e_routes_enabled()
    payload = request or TestResetRequest()
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("TRUNCATE TABLE utilisateur")
        insert_users(cursor, DEFAULT_USERS if payload.seed else [])
        insert_users(cursor, payload.users)
        connection.commit()
        app.state.next_create_user_status = None
    finally:
        cursor.close()

    default_users_count = len(DEFAULT_USERS) if payload.seed else 0
    return {
        "seed": payload.seed,
        "count": default_users_count + len(payload.users),
    }


@app.post("/test/faults/next-create-user")
async def queue_next_create_user_fault(request: NextCreateUserFaultRequest):
    assert_e2e_routes_enabled()
    app.state.next_create_user_status = request.statusCode
    return {"status": "queued", "statusCode": request.statusCode}


@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    consume_next_create_user_fault()
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
