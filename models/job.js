"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");


/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * */
  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(`
                INSERT INTO companies (title,
                                       salary,
                                       equity,
                                       company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        company_handle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   * accepts optional object that contains filter fields that are used to build
   * a query statement.
   *
   * ex: filters => {title, minSalary, hasEquity}
   *
   * if no filter is provided, default parameter is set to undefined.
   * Returns [{ id, title, salary, equity, company_handle }, ...]
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


  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(`
        SELECT id,
               title,
               salary,
               euqity,
               company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return company;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,{});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${job}`);

    return job;
  }

/** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

static async remove(id) {
  const result = await db.query(`
      DELETE
      FROM jobs
      WHERE id = $1
      RETURNING id`, [id]);
  const job = result.rows[0];

  if (!job) throw new NotFoundError(`No job: ${id}`);
}
}

module.exports = Job;