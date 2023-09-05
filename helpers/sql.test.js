const { BadRequestError } = require("../expressError");
const { update } = require("../models/user");
const { sqlForPartialUpdate } = require("./sql");
const db = require("../db");
const { commonAfterAll } = require("../routes/_testCommon");

describe("sqlForPartialUpdate", () => {
    test("returns BadRequest if no data ", function () {
        const dataToUpdate = {};
        const jsToSql = { firstName: "first_name" };

        expect(() => {
            sqlForPartialUpdate(dataToUpdate, jsToSql);
        }).toThrow(BadRequestError);
    });

    test("generates SQL clauses and values for partial update", function () {
        const dataToUpdate = { firstName: "Test1", age: 22 };
        const jsToSql = { firstName: "first_name" };
        const updateInfo = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(updateInfo).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ["Test1", 22],
        });
    });
});

commonAfterAll(() => {
    db.end();
});
