const express = require("express");
const app = express();
const db = require("./database/db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const helmet = require("helmet");
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

//middleware
app.use(helmet.frameguard({ action: "DENY" }));

app.use(express.static("./public"));

app.use(express.urlencoded({ extended: false }));

app.use(
    cookieSession({
        secret: `session=cookie`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

//HOMEPAGE ("/") (GET)

app.get("/", (req, res) => {
    console.log("GET request made to hompage");
    req.session = null;
    res.render("homepage", {
        layout: "main",
        customstyle: '<link rel="stylesheet" href="/homepage.css">',
        title: "homepage",
        author: "Neus",
    });
});

//REGISTER PAGE ('/register') (GET and POST)

app.get("/register", (req, res) => {
    console.log("GET request made to register page");

    if (req.session.user_id) {
        res.redirect("/thanks");
        return;
    }

    res.render("register", {
        layout: "main",
        customstyle: '<link rel="stylesheet" href="/register.css">',
        /* script: '<script src="/script.js"></script>', */
        title: "register",
        author: "Neus",
    });
    /*  res.send("error message")
     */
});

app.post("/register", (req, res) => {
    console.log("POST request made to register page");

    const { first_name, last_name, email, password } = req.body;

    db.hashPassword(password).then((password_hash) => {
        db.createUser(first_name, last_name, email, password_hash)
            .then(({ rows }) => {
                console.log("rows: ", rows);
                //store id to cookie
                req.session.user_id = rows[0].id;
                req.session.user_name = rows[0].first_name;
                //console.log
                console.log("cookie :", req.session);
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("err email duplicated", err);
                console.log(`This email is already registered`);
                // Achtung, condition checking for the nature of the error, then:
                res.render("register", {
                    layout: "main",
                    customstyle: '<link rel="stylesheet" href="/register.css">',
                    title: "register",
                    errormessage: `<p class="error"> Ups, something happened. Try again or login.</p>`,
                    author: "Neus",
                });
            })
            .catch((err) => {
                console.log("err email duplicated", err);
            });
    });
});

//LOGIN PAGE ('/login') (GET and POST)

app.get("/login", (req, res) => {
    console.log("GET request made to login page");
    if (req.session.user_id) {
        // redirect to /petition
        res.redirect("/thanks");
        return;
    }

    res.render("login", {
        layout: "main",
        customstyle: '<link rel="stylesheet" href="/login.css">',
        script: '<script src="/script.js"></script>',
        title: "login",
        author: "Neus",
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    let adress = req.body.email;
    let key = req.body.password;

    // Reject different type to avoid 1=1
    if (typeof adress != "string" || typeof key != "string") {
        response.send("Invalid parameters!");
        response.end();
        return;
    }

    db.login(email, password)
        .then((user) => {
            if (user) {
                req.session.user_id = user.id;
                req.session.user_name = user.first_name;
                console.log("cookie : ", req.session);
                res.redirect("/sign");
                return;
            }
            console.log("user not found");
            console.log("cookie : ", req.session);
            res.render("login", {
                layout: "main",
                customstyle: '<link rel="stylesheet" href="/login.css">',
                errormessage: `<p class="error"> We couldn't validate your credentials.</p>`,
                title: "login",
                author: "Neus",
            });
        })
        .catch((err) => {
            console.log("Login error: ", err);
        });
});

//PROFILE PAGE ('/profile) (GET and POST)

app.get("/profile", (req, res) => {
    console.log("GET request made to profile page");
    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }

    res.render("profile", {
        layout: "main",
        customstyle: '<link rel="stylesheet" href="/profile.css">',
        name: req.session.user_name,
        title: "profile",
        author: "Neus",
    });
});

app.post("/profile", (req, res) => {
    console.log("POST request made to profile page");

    const { age, city, url, snack } = req.body;

    console.log(req.body);

    if (
        req.body.url.startsWith("http://") ||
        req.body.url.startsWith("https://")
    ) {
        db.addProfile(req.session.user_id, age, city, url, snack)
            .then(({ rows }) => {
                console.log(rows[0]);
                res.redirect("/sign");
            })
            .catch((err) => {
                console.log("error addin User", err);
                res.render("profile", {
                    layout: "main",
                    customstyle: '<link rel="stylesheet" href="/profile.css">',
                    name: req.session.user_name,
                    errormessage: `<p class="error"> Ups! Something happened! Try again.</p>`,
                    title: "profile",
                    author: "Neus",
                });
            });
        return;
    }

    db.addProfileWithoutUrl(req.session.user_id, age, city, snack)
        .then(({ rows }) => {
            console.log(rows[0]);
            res.redirect("/sign");
        })
        .catch((err) => {
            console.log("error addin User", err);
            res.render("profile", {
                layout: "main",
                customstyle: '<link rel="stylesheet" href="/profile.css">',
                name: req.session.user_name,
                errormessage: `<p class="error"> Ups! Something happened! Try again.</p>`,
                title: "profile",
                author: "Neus",
            });
        });
});

//SIGN PAGE ('/sign') (GET and POST)

app.get("/sign", (req, res) => {
    console.log("GET request made to sign page");

    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }

    // function getSignatureByUserId

    db.getSignatureByUserId(req.session.user_id)
        .then(({ rows }) => {
            console.log(rows);
            if (rows[0]) {
                console.log("found signature!");
                res.redirect("/thanks");

                return;
            }
            console.log("there's no signature yet");
            res.render("sign", {
                layout: "main",
                customstyle: '<link rel="stylesheet" href="/sign.css">',
                script: '<script src="/canvas.js"></script>',
                title: "sign",
                author: "Neus",
            });
        })
        .catch((err) => {
            console.log("error getsignaturesbyid", err);
        });
});

app.post("/sign", (req, res) => {
    console.log("POST request made to sign page");

    const { signature } = req.body;

    db.addSignature(signature, req.session.user_id)
        .then(() => {
            console.log(req.session.user_id);

            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error", err);
            res.render("sign", {
                layout: "main",
                customstyle: '<link rel="stylesheet" href="/sign.css">',
                script: '<script src="/canvas.js"></script>',
                errormessage: `<p class="error"> Ups! Something happened. Try again.</p>`,
                title: "sign",
                author: "Neus",
            });
        });
});

//PROFILE/EDIT PAGE ('/profile/edit') (GET/POST)

app.get("/profile/edit", (req, res) => {
    console.log("GET request made to profile/edit page");

    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }

    db.getUserProfile(req.session.user_id)
        .then(({ rows }) => {
            console.log(rows);
            res.render("profile-edit", {
                layout: "main",
                customstyle: '<link rel="stylesheet" href="/profile-edit.css">',
                script: '<script src="/editprofile.js"></script>',
                title: "profile-edit",
                rows,
                author: "Neus",
            });
        })
        .catch((err) => {
            console.log("err getting profile", err);
        });
});

app.post("/profile/edit", (req, res) => {
    console.log("POST request made to profile-edit page");

    const { first_name, last_name, email, password, age, city, url, snack } =
        req.body;

    console.log(req.body);

    if (!req.body.password) {
        // user has left their password as it is

        db.updateUsers(first_name, last_name, email, req.session.user_id)
            .then(({ rows }) => {
                console.log(rows[0]);
                //check url
                if (
                    req.body.url.startsWith("http://") ||
                    req.body.url.startsWith("https://")
                ) {
                    db.updateProfile(age, city, url, snack, req.session.user_id)
                        .then(({ rows }) => {
                            console.log(rows[0]);
                            res.redirect("/profile/edit");
                        })
                        .catch((err) => {
                            console.log("err updating profile", err);
                        });
                    return;
                }
                db.updateProfileWithoutUrl(
                    age,
                    city,
                    snack,
                    req.session.user_id
                )
                    .then(({ rows }) => {
                        console.log(rows[0]);
                        res.redirect("/profile/edit");
                    })
                    .catch((err) => {
                        console.log("err updating profile", err);
                    });
            })
            .catch((err) => {
                console.log("err updating users", err);
            });
    } else {
        // user has updated their password
        db.hashPassword(password)
            .then((password_hash) => {
                db.updateUsersAndPassword(
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    req.session.user_id
                )
                    .then(({ rows }) => {
                        console.log(rows[0]);
                        //check for valid Url
                        if (
                            req.body.url.startsWith("http://") ||
                            req.body.url.startsWith("https://")
                        ) {
                            db.updateProfile(
                                age,
                                city,
                                url,
                                snack,
                                req.session.user_id
                            )
                                .then(({ rows }) => {
                                    console.log(rows[0]);
                                    res.redirect("/profile/edit");
                                })
                                .catch((err) => {
                                    console.log("err updating profile", err);
                                });
                            return;
                        }
                        db.updateProfileWithoutUrl(
                            age,
                            city,
                            snack,
                            req.session.user_id
                        )
                            .then(({ rows }) => {
                                console.log(rows[0]);
                                res.redirect("/profile/edit");
                            })
                            .catch((err) => {
                                console.log("err updating profile", err);
                            });
                    })
                    .catch((err) => {
                        console.log("err updating users", err);
                    });
            })
            .catch((err) => {
                console.log("err updating users", err);
            });
    }
});

//THANKS PAGE ('/thanks') (GET)

app.get("/thanks", (req, res) => {
    console.log("GET request made to thanks page");

    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }

    let signersCount;
    db.countSigners()
        .then(({ rows }) => {
            signersCount = rows[0].count;
            console.log("signers number", signersCount);
        })
        .catch((err) => {
            console.log("countSigners error", err);
        });

    db.getSignatureByUserId(req.session.user_id)
        .then(({ rows }) => {
            console.log(rows);
            if (rows[0]) {
                res.render("thanks", {
                    layout: "main",
                    customstyle: '<link rel="stylesheet" href="/thanks.css">',
                    name: req.session.user_name,
                    signersCount,
                    rows,
                    title: "thanks",
                    author: "Neus",
                });
                return;
            }
            res.redirect("/sign");
        })
        .catch((err) => {
            console.log("getSignersbyid error", err);
        });
});

app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.user_id).then(() => {
        console.log("signature deleted");
        res.redirect("/sign");
    });
});

//SIGNERS PAGE ('/signers') (GET)

app.get("/signers", (req, res) => {
    console.log("GET request made to signers page");

    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }
    db.getSigners()
        .then(({ rows }) => {
            console.log("getsigners rows", rows);
            res.render("signers", {
                layout: "main",
                customstyle: '<link rel="stylesheet" href="/signers.css">',
                rows,
                title: "signers",
                author: "Neus",
            });
        })
        .catch((err) => {
            console.log("getSigners error", err);
        });
});

//SIGNERS-BY-CITY PAGE (/signers/:city) (GET)

app.get("/signers/:city", (req, res) => {
    console.log("GET request made to signers/city page");

    if (!req.session.user_id) {
        res.redirect("/");
        return;
    }

    const { city } = req.params;

    db.getCities()
        .then(({ rows }) => {
            console.log(rows);
            const foundCity = rows.find((x) => x.city === city);
            if (!foundCity) {
                res.redirect("/signers"); //has to be 404;
                return;
            }
            db.getSignersByCity(city)
                .then(({ rows }) => {
                    console.log("we found something", rows[0].first_name);
                    res.render("signers-by-city", {
                        layout: "main",
                        customstyle:
                            '<link rel="stylesheet" href="/signers-by-city.css">',
                        rows,
                        city: city,
                        title: "signers-by-city",
                        author: "Neus",
                    });
                })
                .catch((err) => {
                    console.log("error getting signaturesbycity", err);
                });
        })
        .catch((err) => {
            console.log("err matching cities", err);
        });
});

app.listen(process.env.PORT || 8080);
