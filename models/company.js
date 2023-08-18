"use strict";

const { json } = require("body-parser");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * accepts optional object that contains filter fields that are used to build
   * a query statement.
   *
   * ex: filters => {nameLike, minEmployees, maxEmployees}
   *
   * if no filter is provided, default parameter is set to undefined.
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = undefined) {
    let sqlQuery = ``;
    const data = [];
    let nameLike;
    let minEmployees;
    let maxEmployees;
    if (filters !== undefined) {
       nameLike = filters.nameLike;
       minEmployees = filters.minEmployees;
       maxEmployees = filters.maxEmployees;
    }

    if (minEmployees > maxEmployees) {
      throw new BadRequestError("Min cannot be greater than Max");
    };


//TODO: dynamically determine $1....
    if (nameLike) {
      sqlQuery = `WHERE name ILIKE $1`;
      data.push(`%${nameLike}%`);
    }
    if (minEmployees) {
      sqlQuery = `WHERE num_employees >= $1`;
      data.push(minEmployees);
    }
    if (maxEmployees) {
      sqlQuery = `WHERE num_employees <= $1`;
      data.push(maxEmployees);
    }
    if (nameLike && minEmployees) {
      sqlQuery = `WHERE name ILIKE $1 AND num_employees >= $2`;
    }
    if (nameLike && maxEmployees) {
      sqlQuery = `WHERE name ILIKE $1 AND num_employees <= $2`;
    }
    if (minEmployees && maxEmployees) {
      sqlQuery = `WHERE num_employees >= $1 AND num_employees <= $2`;
    }
    if (nameLike && minEmployees && maxEmployees) {
      sqlQuery = `WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3`;
    }
    console.log("our data: ", data);
    console.log("our statement", sqlQuery);


    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${sqlQuery}
        ORDER BY name`,
      data);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT c.handle,
               c.name,
               c.description,
               c.num_employees AS "numEmployees",
               c.logo_url      AS "logoUrl",
               j.id,
               j.title,
               j.salary,
               j.equity,
               j.company_handle as "companyHandle"
        FROM companies as c
        JOIN jobs as j
            ON c.handle = j.company_handle
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobs = companyRes.rows.map(j => ({
      id: j.id,
      title: j.title,
      salary: j.salary,
      equity: j.equity,
      companyHandle: j.companyHandle
    }));

    return {
      handle: company.handle,
      name: company.name,
      description: company.description,
      numEmployees: company.numEmployees,
      logoUrl: company.logoUrl,
      jobs: jobs
    }
    
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
