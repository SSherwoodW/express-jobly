const { BadRequestError } = require("../expressError");

/**
 * Generates SQL clauses & values for partially updating a database value.
 *
 *
 * @param {*} dataToUpdate - Data to be updated
 * @param {*} jsToSql - Mapping object associates JS property names with corresponding SQL column names
 * @returns Object containing SQL clauses and values for update.
 *          - setCols: A string containing column assignments for the update.
 *          - values: Array of values corresponding to the setCols assignments.
 * @example
 * const dataToUpdate = {firstName: 'Aliya', age: 32};
 * const jsToSql = {firstName: "first_name"};
 * const updateInfo = sqlForPartialUpdate(dataToUpdate, jsToSql);
 *  //Returns:
 *  // {
 *  // setCols: '"first_name"=$1', '"age"=$2',
 *  // values: ['Aliya', 32]
 *  // }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);

    if (keys.length === 0) throw new BadRequestError("No data");

    // Make SQL column assignments
    const cols = keys.map(
        (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
    );
    console.log(cols);

    // Return Object - SQL SET variables and associated values
    return {
        setCols: cols.join(", "),
        values: Object.values(dataToUpdate),
    };
}

module.exports = { sqlForPartialUpdate };
