const picodb = require('../pico-db.js');


module.exports = {
	reset : ()=>{
		picodb('./temp').reset();
	},

	create_root : async (t)=>{
		const Users = picodb('./temp').table('users').drop();

		const user = await Users.put({name : 'scott', isDev : true});
		const scott = await Users.get(user._id);

		t.is(user.name, 'scott');
		t.is(scott.name, 'scott');

		t.is(user.isDev, true);
		t.is(scott.isDev, true);
	},
	all : async (t)=>{
		const Users = picodb('./temp').table('users').drop();

		await Users.put({name : 'foo1'})
		await Users.put({name : 'foo2'})
		await Users.put({name : 'foo3'})

		const records = await Users.all();

		t.is(records.length, 3)
	},
	custom_opts : {
		id_key : async (t)=>{
			const Users = picodb('./temp', {
				id_key : '__foo__'
			}).table('users');

			const record = await Users.put({name : 'scott'});
			t.type(record.__foo__, 'string');
		},
		id_func : async (t)=>{
			const Users = picodb('./temp', {
				id_func : (obj)=>obj.name
			}).table('users');

			const record = await Users.put({name : 'scott'});
			t.is(record._id, 'scott');
		},
	},
	get : {
		nonexisting_record : async (t)=>{
			const Users = picodb('./temp').table('users').drop();

			t.type(await Users.get('foo'), 'undefined');
		},

		multiple_records : async (t)=>{
			const Users = picodb('./temp').table('users').drop();

			const record1 = await Users.put({name : 'foo1'});
			const record2 = await Users.put({name : 'foo2'});
			const record3 = await Users.put({name : 'foo3'});
			const record4 = await Users.put({name : 'foo4'});

			const records = await Users.get([record1._id,record2._id,record3._id]);

			t.is(records[0].name, 'foo1');
			t.is(records[1].name, 'foo2');
			t.is(records[2].name, 'foo3');
			t.type(records[3], 'undefined');
		},
	},
	del : {
		existing : async (t)=>{
			const Users = picodb('./temp').table('users').drop();

			const record = await Users.put({yo : true});
			await Users.del(record._id);

			t.type(await Users.get(record._id), 'undefined');
		}
	},
	query : {
		basic : async (t)=>{
			const Users = picodb('./temp').table('users').drop();

			await Users.put({name : 'jim', score : 3});
			await Users.put({name : 'scott', score : 6});
			await Users.put({name : 'steve', score : 16});
			await Users.put({name : 'sarah', score : 1});
			await Users.put({name : 'lily', score : 30});

			const records = await Users.query({
				name : (val)=>val[0] == 's',
				score : (val)=>val>5
			});

			t.is(records.length, 2);
		},
		nested : async (t)=>{
			const Users = picodb('./temp').table('users').drop();

			await Users.put({
				name : 'jim',
				info : {
					role : 'dev'
				}
			});
			await Users.put({
				name : 'scott',
				info : {
					role : 'admin'
				}
			});
			await Users.put({
				name : 'steve',
				info : {
					role : 'dev'
				}
			});
			await Users.put({
				name : 'lily',
				info : {
					role : 'admin'
				}
			});

			const records = await Users.query({
				info : {
					role : (val)=>val=='admin'
				}
			});

			t.is(records.length, 2);
		},
		arrays : async (t)=>{
			const Users = picodb('./temp').table('users').drop();

			await Users.put({scores : [3,4,9]});
			await Users.put({scores : [6,2]});
			await Users.put({scores : [16,20,24]});
			await Users.put({scores : [1,2]});
			await Users.put({scores : [30,30,30,40]});

			const records = await Users.query({
				scores : [(val)=>val>5]
			});

			t.is(records.length, 2);
		},
	}
}