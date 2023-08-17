"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const  User = require("../models/user");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
    }
  }
  return next();

}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  // console.log("user: --------------->", res.locals);
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}

/** Middleware to use when action requires is_admin access.
 *
 * actions include: creating, updating, and deleting companies.
 *
 * If not, raises Unauthorized.
 */

async function ensureIsAdmin(req, res, next) {
  if (res.locals.user === undefined) throw new UnauthorizedError();

  const username = res.locals.user?.username;
  const admin = await User.getAdminByUsername(username);
  console.log("admin ------------>: ", admin);


  // console.log("user: --------------->", res.locals.user?.username);
  // if (res.locals.user?.isAdmin === true) return next()
  if (res.locals.user?.isAdmin === true) return next()
  throw new UnauthorizedError()
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin
};
