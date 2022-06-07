DROP TABLE IF EXISTS profiles;

DROP TABLE IF EXISTS signatures;

DROP TABLE IF EXISTS users;


CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(15) NOT NULL CHECK (first_name ~* '^[a-z ]*$'),
    last_name       VARCHAR(15) NOT NULL CHECK (last_name ~* '^[a-z ]*$'),
    email           VARCHAR(40) NOT NULL UNIQUE,
    password_hash   VARCHAR NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
     id         SERIAL PRIMARY KEY,
     user_id    INTEGER NOT NULL UNIQUE REFERENCES users (id),
     signature  VARCHAR NOT NULL CHECK (signature != ''),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id  SERIAL PRIMARY KEY, 
    user_id INTEGER NOT NULL UNIQUE REFERENCES users (id),
    url VARCHAR (50),
    age INTEGER  NOT NULL,
    city    VARCHAR (20)  NOT NULL CHECK (city ~* '^[a-z ]*$'),
    snack  VARCHAR (20) CHECK (snack ~* '^[a-z ]*$')
)