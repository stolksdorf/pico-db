# 🗃 pico-db

[![npm version](https://badge.fury.io/js/pico-db.svg)](https://badge.fury.io/js/pico-db)

`pico-db` is an incredibly simple filesystem-based database where each table is a folder, and each record is it's own JSON file. Useful for small/local projects, unit testing, and quickly bootstrapping new projects.


### Features
- 75 lines of code
- no dependacies
- builtin query engine


*Why use json files for records?*
- easy to read and manually edit
- git diff-able
- completely flexible on schema



*Let's see it in action*
```js
const DB = require('pico-db')('./path/to/db_folder');

const Users = DB.table('users');
const Auth = DB.table('users.auth');

await Users.put({ _id : 'foofoo', name : 'Bob', points : 50 });

const alice = await Users.put({ name : 'Alice', points : 25 });
await Auth.put({ method : 'password', value : 'dont_look_plz', user_id : alice._id});
```


_Resulting filestructure_
```
/path/to/db_folder
	/users
		foofoo.json
		thx425nyt5z7nyuz.json
		/auth
			xz53vad9n4yi77tw.json
```


### api

#### `picodb(root_folder_path, opts)` -> `db instance`

Creates a `pico-db` instance for the given `root_folder_path`. All tables and records will be stored within that folder, and that folder will be created if it doesn't already exist.

##### opts
```js
default_opts = {
	id_key : '_id', //Key used to store the id field on records
	id_func : (record)=>base32(16), //Function used to generate the record ids. Can use a hash of the record data if you want
	json_space : '\t', //character used as spaces when stringifying the record JSON. Use '' for compressed JSON
}
```
*Example*
```js
const DB = require('pico-db')('./db', {
	id_key : '__ID__',
	id_func : (user)=>user.name[0], // Uses the user's name first letter as it's id (probably not a good idea)
	json_space : '',             // Produces a more compressed json file
});

const Users = DB.table('users');
Users.put({ name : 'bobert'});

/*
{__ID__:'b',name:'bobert'}
*/


```


#### `db.table(name)` -> `table instance`

Creates a table instance at `root_folder_path` + `name`. `name` can be `'.'` separated to created nested tables, eg. `.table('users.secrets.auth')`. Will create the folders if they don't already exist.


#### `db.reset()`

Completely removes everything at the `root_folder_path` from the filesystem.


#### `async table.get(id) / table.get([ids])` -> `record(s)`

Gets a single record from the filesystem or an array of ids. Returns `undefined` if the record does not exist.


#### `async table.put(record)` -> `record`

Inserts a new record into the filesystem. If the record did not have an `id` one will be generated. The record data will be returned.

#### `async table.query(queryObj)`

Look up records within a table using a query object. A query object is a object made of key-function pairs. For each of the key's within a record, it calls this function with that key's value. If the function returns a false value, the record is removed from this query. Nesting also works!


```js
const Users = require('pico-db')('./db').table('users');

await Users.put({ name : 'bobert', score: { points : 51 }});
await Users.put({ name : 'alice',  score: { points : 12 }});
await Users.put({ name : 'aaron',  score: { points : 26 }});

const result = await Users.query({
	name : (val)=>val[0]=='a', //Only names that start with 'a'
	score : {
		points : (val)=>val > 25, //Only points over 25
	}
});

/* result
[ { id:'...', name : 'aaron',  score: { points : 26 }} ]
*/
```


#### `async table.del(id)`

Removes a record from the filesystem based on it's id.

#### `table.drop()`

Removes all records from the filesystem in this table folder.

