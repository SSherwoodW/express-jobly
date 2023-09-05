"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} = require("../expressError");
const {
    ensureLoggedIn,
    authenticateJWT,
    ensureIsAdmin,
} = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } => { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post(
    "/",
    authenticateJWT,
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, jobNewSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }
            console.log(req.body);

            const job = await Job.create(req.body);
            return res.status(201).json({ job });
        } catch (err) {
            return next(err);
        }
    }
);

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle}, ...] }
 *
 * Can filter on provided search filters in query string:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    const queryFilters = req.query;
    if (queryFilters.minSalary !== undefined) {
        queryFilters.minSalary = +queryFilters.minSalary;
    }
    try {
        const jobs = await Job.findAll(queryFilters);
        if (jobs.length < 1) {
            throw new NotFoundError("No jobs match your search", 404);
        } else {
            return res.json({ jobs });
        }
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>
 *   job is { title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id]  =>
 *   patches job data.
 *
 *   fields can be { title, salary, equity }
 *   returns {id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch(
    "/:id",
    authenticateJWT,
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, jobUpdateSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }
            const job = await Job.update(req.params.id, req.body);
            return res.json({ job });
        } catch (err) {
            return next(err);
        }
    }
);

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete(
    "/:id",
    authenticateJWT,
    ensureLoggedIn,
    ensureIsAdmin,
    async function (req, res, next) {
        try {
            await Job.delete(req.params.id);
            return res.json({ deleted: req.params.id });
        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;
