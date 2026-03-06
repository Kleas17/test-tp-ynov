FROM mysql:8.4

# Keep credentials out of the image; pass MYSQL_ROOT_PASSWORD at runtime.
COPY ./sqlfiles/ /docker-entrypoint-initdb.d/

EXPOSE 3306

