"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const {
    authenticateJWT,
    ensureLoggedIn,
    ensureIsAdmin,
    ensureAdminOrUser,
} = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const db = require("../db");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post(
    "/",
    authenticateJWT,
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, userNewSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const user = await User.register(req.body);
            const token = createToken(user);
            return res.status(201).json({ user, token });
        } catch (err) {
            return next(err);
        }
    }
);

/** POST /:username/jobs/:jobid => {applied: jobId}
 *
 * Allows user to apply for a job. Posts to 'applications' table.
 *
 * Returns { applied: jobId}
 *
 * Authorization required: login
 **/

router.post(
    "/:username/jobs/:jobid",
    authenticateJWT,
    ensureLoggedIn,
    async function (req, res, next) {
        const jobId = +req.params.jobid;
        try {
            await User.apply(req.params.username, jobId);
            return res.json({ applied: jobId });
        } catch (err) {
            return next(err);
        }
    }
);

/** GET / => { users: [ {username, firstName, lastName, email , jobs: [ { jobId: <id>, ...} ] }, ... ] }
 *
 * Returns list of all users, as well as jobs they've applied to.
 *
 * Authorization required: admin
 **/

router.get(
    "/",
    authenticateJWT,
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const users = await User.findAll();
            return res.json({ users });
        } catch (err) {
            return next(err);
        }
    }
);

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: user matches req.params.username OR admin
 **/

router.get(
    "/:username",
    authenticateJWT,
    ensureLoggedIn,
    ensureAdminOrUser,
    async function (req, res, next) {
        try {
            const user = await User.get(req.params.username);
            return res.json({ user });
        } catch (err) {
            return next(err);
        }
    }
);

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: user matches req.params.username OR admin
 **/

router.patch(
    "/:username",
    authenticateJWT,
    ensureLoggedIn,
    ensureAdminOrUser,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, userUpdateSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const user = await User.update(req.params.username, req.body);
            return res.json({ user });
        } catch (err) {
            return next(err);
        }
    }
);

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: user matches req.params.username OR admin
 **/

router.delete(
    "/:username",
    authenticateJWT,
    ensureLoggedIn,
    ensureAdminOrUser,
    async function (req, res, next) {
        try {
            await User.remove(req.params.username);
            return res.json({ deleted: req.params.username });
        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;
