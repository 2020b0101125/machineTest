const express = require("express");
const mysql = require("mysql");
const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "worlds",
  password: "admin",
  port: 5432,
});

const createTable = `
  CREATE TABLE if not existS roles(
    roles_id SERIAL PRIMARY KEY,
    role_name varchar(50) NOT NULL,
    status BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE IF NOT EXISTS designations(
    designation_id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    designation_name varchar(50) NOT NULL,
    status BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE IF NOT EXISTS user_details(
    id SERIAL PRIMARY KEY,
    empid INTEGER NOT NULL,
    emp_name VARCHAR(70) NOT NULL,
    designation_id INTEGER ,
    contact_no VARCHAR(30),
    email VARCHAR(70) UNIQUE,
    role varchar(70) NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_on DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on DATE,
    updated_at TIMESTAMP,
    password varchar(20) DEFAULT 'admin',
    FOREIGN KEY (designation_id) REFERENCES designations(designation_id)
  );

  CREATE TABLE IF NOT EXISTS login(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(300) NOT NULL,
    role_id INTEGER,
    status BOOLEAN DEFAULT TRUE,
    lastLoggedIn TIMESTAMP,
    FOREIGN KEY(role_id) REFERENCES roles(roles_id)
  );

`;

client
  .connect()
  .then(() => {
    console.log("connected to postgres");
    return client.query(createTable);
  })
  .then(() => {
    console.log("table created successfully");
  })
  .catch((err) => {
    console.error("error executing query", err.stack);
  });

const bodyParser = require("body-parser");

const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

function mid(req, res, next) {
  const chk = "Select * from user_details where id=$1";
  const val = req.params.id;
  client
    .query(chk, [val])
    .then((result) => {
      if (!(result.rows[0].role === "admin")) {
        res.render("login.ejs", { spread: "the employee is not authorised" });
      } else {
        next();
      }
    })
    .catch((err) => {
      console.log("error in the middleware mid", err.stack);
    });
}

app.get("/", (req, res) => {
  res.render("login.ejs", { data: "n" });
});
app.get("/home", (req, res) => {
  res.render("index.ejs");
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/user-details/:id", mid, (req, res) => {
  var id = req.params.id;
  const chk = "SELECT * FROM user_details where id=$1";
  client
    .query(chk, [id])
    .then((result) => {
      if ((result.rows.length = 1)) {
        res.render("user_details.ejs", {
          data: result.rows[0],
        });
      } else {
        res.send("error in id value");
      }
    })
    .catch((error) => {
      console.log("error in executing query", err.stack);
    });
  //res.render("user_details.ejs");
});
app.get("/admin-list", (req, res) => {
  const chk = "Select * from user_details";
  client.query(chk).then((result) => {
    console.log("as", result.rows.length);
    ans = result.rows;
    res.render("list.ejs", { data: ans });
  });
});
app.get("/edit-user", (req, res) => {
  res.render("edit.ejs");
});

app.post("/register", (req, res) => {
  console.log(req.body);
  var valid = true;
  const empid = req.body["empid"];
  const emp_name = req.body["empname"];
  const designation = req.body["designation"];
  const contact_no = req.body["contact_number"];
  const email = req.body["email"];
  const role = req.body["role"];

  /*if (
    !empid ||
    !emp_name ||
    !designation ||
    !contact_no ||
    !email ||
    !role_id
  ) {
    //alert("all fields are required");
    valid = false;
  }*/

  //rendering and data addition to database
  if (valid) {
    console.log("values are valid");
    const insert = `INSERT INTO user_details(empid,emp_name,designation_id,contact_no,email,role)VALUES($1,$2,$3,$4,$5,$6)`;
    const val = [empid, emp_name, designation, contact_no, email, role];
    client
      .query(insert, val)
      .then(() => {
        console.log("inserted the value");
      })
      .catch((err) => {
        console.error("error inserting the values", err.stack);
      });
    res.redirect("/login");
  } else {
    console.log("values are invalid");
    res.redirect("/");
  }
});

app.post("/login", (req, res) => {
  const id = req.body["empid"];
  const chk = "Select * from user_details where empid=$1";
  client.query(chk, [id]).then((result) => {
    const ans = result.rows[0];
    if (!ans.status) {
      console.log("the employe is not active");
      res.redirect("/login");
    }
    if (ans.password === req.body["password"]) {
      console.log(ans);
      res.redirect(`/user-details/${ans.id}`);
    }
  });
});

app.post("/edit-user", (req, res) => {
  console.log("ass");
  const chk =
    "UPDATE TABLE user-details SET empid=$1,emp_name=$2,designation_id=$3,contact_no=$4, email=$5,role=$6,status=$7,password=$8 where id=$9 ;";
  const val = [
    req.body.empid,
    req.body.emp_name,
    req.body.designation_id.req.body.contact_no,
    req.body.email,
    req.body.role,
    req.body.status,
    req.body.password,
    req.body.id,
  ];
  client
    .query(chk, val)
    .then(() => {
      console.log(`updated the values`);
    })
    .catch((err) => {
      console.error("error in updating", err.stack);
    });
  res.redirect("/home");
});

app.listen(port, () => {
  console.log("listening");
});
