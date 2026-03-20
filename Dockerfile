FROM mysql:8.4

COPY ./sqlfiles/ /docker-entrypoint-initdb.d/

EXPOSE 3306
