"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update job, return job data.
     *
     * data should be { id, title, salary, equity, companyHandle }
     *
     * returns { id, title, salary, equity, companyHandle }
     *
     * updating job does not change { id, companyHandle }
     */

    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs (title,
                             salary,
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [data.title, data.salary, data.equity, data.company_handle]
        );
        let job = result.rows[0];

        return job;
    }

    static async findAll(queryFilters = {}) {
        let query = `SELECT 
        title, salary, equity, 
        company_handle AS "companyHandle"
        FROM jobs`;
        let whereParams = [];
        let queryVals = [];

        const { title, minSalary, hasEquity } = queryFilters;

        if (title) {
            whereParams.push(`title ILIKE $${queryVals.length + 1}`);
            queryVals.push(`%${title}%`);
        }
        if (minSalary) {
            whereParams.push(`salary >= $${queryVals.length + 1}`);
            queryVals.push(minSalary);
        }
        if (hasEquity) {
            whereParams.push(`equity > $${queryVals.length + 1}`);
            queryVals.push(0);
        }

        if (whereParams.length > 0) {
            query += " WHERE " + whereParams.join(" AND ");
        }

        let jobsRes = await db.query(query, queryVals);

        return jobsRes.rows;
    }

    static async get(id) {
        let result = await db.query(
            `SELECT 
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
            [id]
        );

        const job = result.rows[0];

        if (!job) {
            throw new NotFoundError(`No job with ${id} exists`, 404);
        }

        return job;
    }

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});
        console.log(setCols);
        console.log(values);
        const idVarIdx = "$" + (values.length + 1);
        console.log(idVarIdx);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                      title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle" 
                                `;
        const result = await db.query(querySql, [...values, id]);

        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }
}

module.exports = Job;
