"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const Company = require("./company.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");
const { fail } = require("assert");
const { describe } = require("node:test");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe("create", function () {
    const newJob = {
        title: "new job",
        salary: 50000,
        equity: "0.01",
        company_handle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);

        const result = await db.query(`
        SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title = 'new job'`);

        const expectedJob = {
            title: "new job",
            salary: 50000,
            equity: "0.01",
            company_handle: "c1",
        };
        expect(result.rows[0]).toMatchObject(expectedJob);
        expect(result.rows[0].id).toEqual(job.id);
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "j1",
                salary: 100000,
                equity: "0.00",
                companyHandle: "c1",
            },
            {
                title: "j2",
                salary: 200000,
                equity: "0.02",
                companyHandle: "c2",
            },
            {
                title: "j3",
                salary: 300000,
                equity: "0.03",
                companyHandle: "c3",
            },
        ]);
    });

    test("works: filter title", async function () {
        let queryFilters = { title: "2" };
        let jobs = await Job.findAll(queryFilters);
        expect(jobs).toEqual([
            {
                title: "j2",
                salary: 200000,
                equity: "0.02",
                companyHandle: "c2",
            },
        ]);
    });

    test("works: filter minSalary", async function () {
        let queryFilters = { minSalary: 150000 };
        let jobs = await Job.findAll(queryFilters);
        expect(jobs).toEqual([
            {
                title: "j2",
                salary: 200000,
                equity: "0.02",
                companyHandle: "c2",
            },
            {
                title: "j3",
                salary: 300000,
                equity: "0.03",
                companyHandle: "c3",
            },
        ]);
    });

    test("works: filter hasEquity", async function () {
        let queryFilters = { hasEquity: true };
        let jobs = await Job.findAll(queryFilters);
        expect(jobs).toEqual([
            {
                title: "j2",
                salary: 200000,
                equity: "0.02",
                companyHandle: "c2",
            },
            {
                title: "j3",
                salary: 300000,
                equity: "0.03",
                companyHandle: "c3",
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const newJob = {
            title: "new job",
            salary: 50000,
            equity: "0.01",
            company_handle: "c1",
        };
        let job = await Job.create(newJob);
        let testJob = await Job.get(job.id);
        expect(testJob).toEqual({
            title: "new job",
            salary: 50000,
            equity: "0.01",
            companyHandle: "c1",
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(10000);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "extra new job",
        salary: 50001,
        equity: "0.05",
    };
    test("works", async function () {
        const newJobData = {
            title: "new job",
            salary: 50000,
            equity: "0.01",
            company_handle: "c1",
        };
        const newJob = await Job.create(newJobData);
        let job = await Job.update(newJob.id, updateData);
        expect(job).toEqual({
            id: newJob.id,
            title: "extra new job",
            salary: 50001,
            equity: "0.05",
            companyHandle: "c1",
        });
    });

    test("not found if not in db", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request error if no data", async function () {
        try {
            const newJobData = {
                title: "new job",
                salary: 50000,
                equity: "0.01",
                company_handle: "c1",
            };
            const newJob = await Job.create(newJobData);
            await Job.update(newJob.id, {});
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** delete */

describe("delete", function () {
    const newJobData = {
        title: "new job",
        salary: 50000,
        equity: "0.01",
        company_handle: "c1",
    };
    test("works", async function () {
        const newJob = await Job.create(newJobData);
        console.log(newJob.id);
        await Job.delete(newJob.id);
        const search = await db.query(
            `SELECT * FROM jobs WHERE id = ${newJob.id}`
        );
        expect(search.rows[0]).toEqual(undefined);
    });
    test("not found if not in db", async function () {
        try {
            await Job.delete(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
