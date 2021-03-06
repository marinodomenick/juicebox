const express = require("express");
const apiRouter = express.Router();
// const {client} = require('../db')
// client.connect();

const jwt = require("jsonwebtoken");
const { getUserById } = require("../db");
const { JWT_SECRET } = process.env;

apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log("User is set:", req.user);
  }

  next();
});

// set `req.user` if possible
apiRouter.use(async (req, res, next) => {
  const prefix = "Bearer ";
  const auth = req.header("Authorization");

  if (!auth) {
    // nothing to see here
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);

    try {
      const { id } = jwt.verify(token, JWT_SECRET);

      if (id) {
        req.user = await getUserById(id);
        next();
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  } else {
    next({
      name: "AuthorizationHeaderError",
      message: `Authorization token must start with ${prefix}`,
    });
  }
});

apiRouter.use(async (req, res, next) => {
  const prefix = "Bearer ";
  const auth = req.header("Authorization");

  if (!auth) {
    next(); // don't set req.user, no token was passed in
    return;
  }
  console.log("the auth is: ", auth);
  if (auth.startsWith(prefix)) {
    // recover the token
    const token = auth.slice(prefix.length);
    try {
      // recover the data
      const { id } = jwt.verify(token, process.env["JWT_SECRET"]);

      // get the user from the database
      const user = await getUserById(id);
      // note: this might be a user or it might be null depending on if it exists

      // attach the user and move on
      req.user = user;

      next();
    } catch (error) {
      next(error);
      // there are a few types of errors here
    }
  }
});

const usersRouter = require("./users");
apiRouter.use("/users", usersRouter);

const postsRouter = require("./posts");
apiRouter.use("/posts", postsRouter);

const tagsRouter = require("./tags");
apiRouter.use("/tags", tagsRouter);

apiRouter.use((error, req, res, next) => {
  res.send({
    name: error.name,
    message: error.message,
  });
});

module.exports = apiRouter;
