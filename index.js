const config = require("./config.json");

// setup api
const ApiFT = require("./api.js");
const apiFT = new ApiFT(config.uid, config.secret);


// setup express
const express = require("express");
const exphbs = require("express-handlebars");
const app = express();
const port = 4200;
app.engine("handlebars", exphbs({
    helpers: {
        "getrank": function (index) {
            index++;
            if (index < 10) {
                return "0" + index;
            }
            return index;
        },
        "getlvl": function (level) {
            return Math.floor(level);
        },
        "getlvlpercent": function (level) {
            return ((level.toFixed(2) - Math.floor(level)) * 100);
        }
    }
}));
app.set("view engine", "handlebars");

// setup routes
app.get("/", async (req, res) => {
    res.render("home", {
        layout: false,
        users: apiFT.getUsers(),
        title: "Codam Leaderboard",
        subtitle: "Sorted by level for Codam july piscine.<br>Updates every 10 minutes."
    });
});
app.get("/all", async (req, res) => {
    res.render("home", {
        layout: false,
        users: apiFT.getAllUsers(),
        title: "Codam piscine Leaderboard",
        subtitle: "Sorted by level for all Codam piscines.<br>Updates every 10 minutes."
    });
});
app.get("/api/sortedusers", async (req, res) => {
    res.json(apiFT.getUsers());
});
app.get("/api/sortedusersall", async (req, res) => {
    res.json(apiFT.getAllUsers());
});
app.use(express.static("public"));

// setup server
app.listen(port, () => {
    console.log("running");
});