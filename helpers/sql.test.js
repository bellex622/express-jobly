"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

// if we give it wrong inp => this happens

describe("sqlForPartialUpdate", function() {
  const dataToUpdate = {
    firstName: "Test",
    lastName: "Test Tester",
    isAdmin: "f"
  }

  const jsToSql = {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin"
  }

  const badData = {}

  const expectedOutput = {
    setCols: '"first_name"=$1, "last_name"=$2, "is_admin"=$3',
    values: ['Test', "Test Tester", "f"]
  }

  test("return valid obj", function () {
    let res = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(res).toEqual(expectedOutput)
  })

  test("throw BadRequestError: No data", function () {
    expect(() => sqlForPartialUpdate(badData, jsToSql).toThrow("No data"));
  })
})
