const spicedPg = require("spiced-pg");
const bcrypt = require("bcryptjs");

let db;

if (process.env.DATABASE_URL) {
    // it means that the app runs on heroku
    db = spicedPg(process.env.DATABASE_URL);
} else {
    // the app runs locally
    const {
        DATABASE_USER,
        DATABASE_PASSWORD,
        DATABASE_NAME,
    } = require("./secrets.json");
    db = spicedPg(
        `postgres:${DATABASE_USER}:${DATABASE_PASSWORD}@localhost:5432/${DATABASE_NAME}`
    );
    console.log(`[db] Connecting to: ${DATABASE_NAME}`);
}

db.query("SELECT * FROM signatures")
    .then((results) => {
        console.log("results: ", results);
    })
    .catch((err) => {
        console.log("err: ", err);
    });

module.exports.getSignatureByUserId = (user_id) => {
    const query = "SELECT signature FROM signatures WHERE user_id=$1";
    const params = [user_id];
    return db.query(query, params);
};

module.exports.getSigners = () => {
    return db.query(
        "SELECT * FROM signatures INNER JOIN profiles ON signatures.user_id=profiles.user_id INNER JOIN users ON signatures.user_id=users.id;"
    );
};

module.exports.countSigners = () => {
    return db.query("SELECT COUNT(user_id) FROM signatures");
};

module.exports.getCities = () => {
    return db.query(
        `SELECT city FROM profiles INNER JOIN signatures ON profiles.user_id=signatures.user_id;`
    );
};

module.exports.getSignersByCity = (city) => {
    const query =
        "SELECT * FROM profiles LEFT OUTER JOIN users ON profiles.user_id=users.id WHERE LOWER(profiles.city)=LOWER($1)";
    const params = [city];
    return db.query(query, params);
};

module.exports.addSignature = (signature, user_id) => {
    const query = `INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)
    RETURNING *`;

    const params = [signature, user_id];
    return db.query(query, params);
};

module.exports.deleteSignature = (user_id) => {
    const query = `DELETE FROM signatures WHERE user_id=$1`;
    const params = [user_id];
    return db.query(query, params);
};

module.exports.getUserProfile = (user_id) => {
    const query =
        "SELECT * FROM profiles INNER JOIN users ON profiles.user_id=users.id WHERE profiles.user_id=$1";
    const params = [user_id];

    return db.query(query, params);
};

module.exports.addProfile = (user_id, age, city, url, snack) => {
    const query = `INSERT INTO profiles (user_id, age, city, url, snack)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`;
    const params = [user_id, age, city, url, snack];
    return db.query(query, params);
};

module.exports.addProfileWithoutUrl = (user_id, age, city, snack) => {
    const query = `INSERT INTO profiles (user_id, age, city, snack)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    const params = [user_id, age, city, snack];
    return db.query(query, params);
};

module.exports.updateUsers = (first_name, last_name, email, user_id) => {
    const query = `UPDATE users SET first_name=$1, last_name=$2, email=$3 WHERE users.id=$4 RETURNING *`;
    const params = [first_name, last_name, email, user_id];

    return db.query(query, params);
};

module.exports.updateUsersAndPassword = (
    first_name,
    last_name,
    email,
    password_hash,
    user_id
) => {
    const query = `UPDATE users SET first_name=$1, last_name=$2, email=$3, password_hash=$4 WHERE users.id=$5 RETURNING *`;
    const params = [first_name, last_name, email, password_hash, user_id];

    return db.query(query, params);
};

module.exports.updateProfile = (age, city, url, snack, user_id) => {
    const query = `INSERT INTO profiles (age, city, url, snack, user_id)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE SET age=$1, city=$2, url=$3, snack=$4 RETURNING *`;
    const params = [age, city, url, snack, user_id];

    return db.query(query, params);
};

module.exports.updateProfileWithoutUrl = (age, city, snack, user_id) => {
    const query = `INSERT INTO profiles (age, city, snack, user_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET age=$1, city=$2, snack=$3 RETURNING *`;
    const params = [age, city, snack, user_id];

    return db.query(query, params);
};

module.exports.login = (email, password) => {
    return getUserByEmail(email).then(({ rows }) => {
        if (!rows[0]) {
            return false;
        }
        const user = rows[0];
        return comparePassword(password, user.password_hash).then((match) => {
            if (match) {
                return user;
            }
            return false;
        });
    });
};

/* module.exports.getUserByEmail = (data, email, password) => {
    for (var i = 0; i < data.length; i++) {
        const isMatch = comparePassword(password, data[i].password_hash);
        if (data[i].email === email && isMatch) {
            return data[i];
        }
    }
    return null;
}; */

const getUserByEmail = (email) => {
    const query = `SELECT * FROM users WHERE email=$1`;
    const params = [email];
    return db.query(query, params);
};

//db.query accepts 2 parameters
module.exports.createUser = (first_name, last_name, email, password_hash) => {
    const query = `INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *`;

    const params = [first_name, last_name, email, password_hash];
    return db.query(query, params);
};

module.exports.hashPassword = (password) => {
    return bcrypt
        .genSalt()
        .then((salt) => {
            return bcrypt.hash(password, salt);
        })
        .catch((err) => {
            console.log("bitcrypt err", err);
        });
};

const comparePassword = (password, password_hash) => {
    return bcrypt.compare(password, password_hash);
};
