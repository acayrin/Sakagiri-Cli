### saki-cli
#### a cli tool to interact with the bot's data file

<hr>

**run** - ``npm run``

**jobs**

- sync index with coryn.club
- (un)zip data file

**how 2 zip a json (up to 5x)**

1. zip all values of a json
2. zip the json of zipped values
3. JSON.stringify the zipped json of zipped values

**how 2 unzip a zipped json**

1. JSON.parse the zipped json
2. unzip the parsed json of zipped json
3. unzip all values of the parsed json of zipped json

**confusing? yes**

**zip = lz-string(jsonpack(json))**

**unzip = jsonpack(lz-string(crap))**