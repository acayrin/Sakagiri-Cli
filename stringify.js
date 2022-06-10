const fs = require("fs");
fs.writeFileSync("out.json", JSON.stringify(JSON.parse(fs.readFileSync("./Sakagiri.json", "utf-8"))), "utf-8");
