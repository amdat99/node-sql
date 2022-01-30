const request = require("request");
const http = require("http");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { transporter } = require("./emailConfig");
if (process.env.NODE_ENV !== "production") require("dotenv").config();
// Documentation for request is available at https://www.npmjs.com/package/request
// Documentation for sqlite3 is available at https://github.com/mapbox/node-sqlite3/wiki
// Retrieve a list of users on a monthly plan from the Marketing API, then add rows to the
// monthly_subscribers table.

const token = "Bearer " + process.env.TOKEN;
const sql = fs.readFileSync("./create-recipients-view.sql").toString();

const db = new sqlite3.Database("client.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to database");
});

db.run(sql, [], function (err) {
  if (err) {
    return console.log(err.message);
  }
  console.log("Recipients table created");
});

let currentUrl;

const server = http.createServer((req, res) => {
  currentUrl = req.url;
  const path = req.url.split("?")[0];

  if (path === "/users") {
    getSubscriptions((response) => {
      if (response?.result.length) {
        try {
          db.serialize(() => {
            db.run("begin transaction");
            response.result.forEach((user) => {
              if (user.hasOwnProperty("subscription")) {
                db.run(`INSERT INTO monthly_subscribers (email) VALUES (?)`, [user.email]);
              }
            });
            db.run("commit");
          });
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: 200, message: "Successfully added subscribed emails" }));
        } catch (err) {
          console.error(err);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: 500, message: "error adding subscribed emails" }));
        }
      }
    });
  } else if (path === "/email") {
    sendMail((response) => {
      res.write(JSON.stringify(response));
      res.end();
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Subscriber API");
  }
});

const getSubscriptions = (response) => {
  const serverUrl = `https://data-engineer-test.xara.com` + currentUrl;
  const options = {
    url: serverUrl,
    json: true,
    method: "GET",
    headers: {
      "User-Agent": "my request",
      Authorization: token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  request(options, (error, _res, body) => {
    if (error) {
      console.log(error);
      response(error);
    }
    response(body);
  });
};

const sendMail = (response) => {
  const uploadDir = path.dirname(require.main.filename);
  const attachments = [
    {
      path: uploadDir + "/create-recipients-view.sql",
      filename: "create-recipients-view.sql",
    },
    {
      path: uploadDir + "/populate-monthly-subscribers.js",
      filename: "populate-monthly-subscribers.js",
    },
  ];
  const mailOptions = {
    from: "test334344334gggg@yahoo.com",
    to: ["aamiradat99@gmail.com", "andreacasaccia925_q8o@indeedemail.com"],
    subject: "File message",
    text: "hello",
    attachments: attachments,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return response(error);
    } else {
      console.log("Email sent: " + info.response);
      response(info.response);
    }
  });
};

server.listen(4000);
console.log(" listening on port 4000 ");
