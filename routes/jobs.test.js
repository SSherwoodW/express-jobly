"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require("./_testCommon");
const { describe } = require("node:test");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        companyHandle: "c1",
        title: "Test",
        salary: 100,
        equity: "0.1",
    };

    test("unauth for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        console.log(resp.body);
        expect(resp.statusCode).toEqual(401);
        expect(resp.body).toEqual({
            error: {
                message: "Unauthorized",
                status: 401,
            },
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 10000,
                equity: "0.01",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "c1",
                title: 89798,
                salary: 100,
                equity: "0.1",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 100,
                    equity: "0.00",
                    companyHandle: "c1",
                },
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.02",
                    companyHandle: "c2",
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: "0.03",
                    companyHandle: "c3",
                },
            ],
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });

    test("not found using filters", async function () {
        const resp = await request(app).get(`/jobs?minSalary=500`);
        expect(resp.statusCode).toEqual(404);
    });

    test("filter jobs results by minSalary", async function () {
        const resp = await request(app).get(`/jobs?minSalary=199`);
        console.log(resp.body);
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.02",
                    companyHandle: "c2",
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: "0.03",
                    companyHandle: "c3",
                },
            ],
        });
    });

    test("filter jobs results hasEquity", async function () {
        const resp = await request(app).get(`/jobs?hasEquity=true`);
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.02",
                    companyHandle: "c2",
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: "0.03",
                    companyHandle: "c3",
                },
            ],
        });
    });

    test("filter jobs results by title", async function () {
        const resp = await request(app).get(`/jobs?title=2`);
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.02",
                    companyHandle: "c2",
                },
            ],
        });
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const job4 = await Job.create({
            title: "j4",
            salary: 400,
            equity: "0.04",
            company_handle: "c1",
        });
        const resp = await request(app).get(`/jobs/${job4.id}`);
        expect(resp.body).toEqual({
            job: {
                title: "j4",
                salary: 400,
                equity: "0.04",
                companyHandle: "c1",
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/job/nope`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const job4 = await Job.create({
            title: "j4",
            salary: 400,
            equity: "0.04",
            company_handle: "c1",
        });
        const resp = await request(app)
            .patch(`/jobs/${job4.id}`)
            .send({
                title: "J1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: job4.id,
                title: "J1-new",
                salary: 400,
                equity: "0.04",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for anon", async function () {
        const job4 = await Job.create({
            title: "j4",
            salary: 400,
            equity: "0.04",
            company_handle: "c1",
        });
        const resp = await request(app).patch(`/jobs/${job4.id}`).send({
            title: "J1-new",
        });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/3`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        console.log(resp.body);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on companyHandle change attempt", async function () {
        const job4 = await Job.create({
            title: "j4",
            salary: 400,
            equity: "0.04",
            company_handle: "c1",
        });
        const resp = await request(app)
            .patch(`/jobs/${job4.id}`)
            .send({
                company_handle: "c1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const job4 = await Job.create({
            title: "j4",
            salary: 400,
            equity: "0.04",
            company_handle: "c1",
        });
        const resp = await request(app)
            .patch(`/jobs/${job4.id}`)
            .send({
                title: 203958230598,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    let jobdata = {
        title: "j4",
        salary: 400,
        equity: "0.04",
        company_handle: "c1",
    };
    test("works for admins", async function () {
        const job4 = await Job.create(jobdata);
        console.log("JOB FOUR ID:", job4.id);
        const resp = await request(app)
            .delete(`/jobs/${job4.id}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: expect.any(String) });
    });

    test("unauth for anon", async function () {
        const job4 = await Job.create(jobdata);
        const resp = await request(app).delete(`/jobs/${job4.id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/3`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
