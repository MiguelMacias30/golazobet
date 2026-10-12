const test=require('node:test');const assert=require('node:assert/strict');const {hashPassword,checkPassword,seed}=require('./server');
test('passwords are salted and verifiable',()=>{const a=hashPassword('testpassword123'),b=hashPassword('testpassword123');assert.notEqual(a,b);assert.equal(checkPassword('testpassword123',a),true);assert.equal(checkPassword('wrong',a),false)});
test('seed contains four open events',()=>{const db=seed();assert.equal(db.events.length,4);assert.ok(db.events.every(e=>e.status==='open'))});
