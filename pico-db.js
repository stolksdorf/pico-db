const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const shortid = (n=8)=>Array.from(new Array(n*1),(v,i)=>'23456789abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random()*32)]).join('');

const defaultOpts = {
	id_key     : '_id',
	id_func    : (obj)=>shortid(16),
	json_space : '\t'
};

const validate = (schema, data)=>{
	if(Array.isArray(schema) && Array.isArray(data)){
		return data.every((val)=>validate(schema[0], val));
	}else if(typeof schema === 'object' && typeof data === 'object'){
		return Object.entries(schema).every(([key, check])=>validate(check, data[key]));
	}else if(typeof schema === 'function'){
		return schema(data);
	}
	return false;
};

module.exports = (rootPath, opts={})=>{
	opts = {...defaultOpts, ...opts};

	const DB_PATH = path.resolve(process.cwd(), rootPath);
	fs.mkdirSync(DB_PATH, {recursive : true});

	return {
		table : (name)=>{
			const TBL_PATH = path.join(DB_PATH, ...name.split('.'));
			fs.mkdirSync(TBL_PATH, {recursive : true});

			const foo = { //TODO: rename
				put : async (obj)=>{
					if(!obj[opts.id_key]) obj[opts.id_key] = opts.id_func(obj);
					await fsp.writeFile(path.join(TBL_PATH, `${obj[opts.id_key]}.json`), JSON.stringify(obj, null, opts.json_space), 'utf8');
					return obj;
				},
				get : async (id)=>{
					if(Array.isArray(id)) return Promise.all(id.map(foo.get));
					try{
						return JSON.parse(await fsp.readFile(path.join(TBL_PATH, `${id}.json`), 'utf8'));
					}catch(err){
						return undefined;
					}
				},
				del : async (id)=>{
					if(Array.isArray(id)) return Promise.all(id.map(foo.del));
					return await fsp.unlink(path.join(TBL_PATH, `${id}.json`));
				},
				all : async () =>{
					const recordIds = (await fsp.readdir(TBL_PATH)).reduce((acc, filename)=>{
						if(path.extname(filename) == '.json') return acc.concat(path.basename(filename, '.json'));
						return acc;
					},[]);
					return foo.get(recordIds);
				},
				query : async (queryObj)=>{
					return (await foo.all()).filter((data)=>validate(queryObj, data));
				},
				drop : ()=>{
					fs.rmdirSync(TBL_PATH, {recursive : true});
					fs.mkdirSync(TBL_PATH, {recursive : true});
					return foo;
				}
			}
			return foo;
		},
		reset : ()=>{
			fs.rmdirSync(DB_PATH, {recursive : true});
		}
	}
};