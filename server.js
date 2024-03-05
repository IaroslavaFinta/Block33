const pg = require("pg");
const express = require("express");
const client = new pg.Client(process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory_db");
const app = express();

const port = process.env.PORT || 3000;

// Use the use method on the app variable to parse incoming requests from JSON
app.use(express.json());
app.use(require("morgan")("dev"));

// api routes
// get all employees
app.get("/api/employees", async (req, res, next) => {
    try {
        const SQL = `SELECT * from employees ORDER BY created_at DESC`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex);
    }
});

// get all departments
app.get("/api/departments", async (req, res, next) => {
    try {
        const SQL = `
            SELECT * from departments;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex);
    }
});

// Create an employee
app.post("/api/employees", async (req, res, next) => {
    try {
        const SQL = `
            INSERT INTO employees(name, department_id)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [
        req.body.name,
        req.body.department_id,
        ]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

// Update an employee
app.put("/api/employees/:id", async (req, res, next) => {
    try {
        const SQL = `
            UPDATE employees
            SET name=$1, department_id=$2, updated_at= now()
            WHERE id=$3 RETURNING *
            `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id,
            req.params.id,
        ]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

// Delete an employee
app.delete("/api/employees/:id", async (req, res, next) => {
    try {
        const SQL = `
            DELETE from employees
            WHERE id = $1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
});

// Create the departments and employees tables. Seed the tables with some data.
const init = async () => {
    await client.connect();
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;

        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100)
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            name VARCHAR(255) NOT NULL,
            department_id INTEGER REFERENCES departments(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log("tables created");
    SQL = `
        INSERT INTO departments(name) VALUES('HR');
        INSERT INTO departments(name) VALUES('SALES');
        INSERT INTO departments(name) VALUES('PRODUCTION');

        INSERT INTO employees(name, department_id) VALUES('Maria Kana', (SELECT id FROM departments WHERE name='HR'));
        INSERT INTO employees(name, department_id) VALUES('Alex Miller', (SELECT id FROM departments WHERE name='SALES'));
        INSERT INTO employees(name, department_id) VALUES('Taylor Smith', (SELECT id FROM departments WHERE name='SALES'));
        INSERT INTO employees(name, department_id) VALUES('David Brown', (SELECT id FROM departments WHERE name='PRODUCTION'));
        INSERT INTO employees(name, department_id) VALUES('Jack Moore', (SELECT id FROM departments WHERE name='PRODUCTION'));
    `;
    await client.query(SQL);
    console.log("data seeded");
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
