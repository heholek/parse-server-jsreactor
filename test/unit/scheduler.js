let RuleAction = require('./../../channel/Rule')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Scheduler  = require('./../../channel/Scheduler')
const z         = require('zora')

var sleep      = (sec) => new Promise((r,j) => setTimeout(r,sec*1000) )
var offset = -4

var testDummyRule = {
    config:{
        "basic": {
        "name": "testscheduler",
        "notes": ""
        },
        "extra": {
        "disabled": false,
        "language": "ALL",
        "priority": 1000,
        "triggered": 0,
        "formschema": ""
        },
        "action": [
        {
            "config": {
            "type": "javascript",
            "config": {
                "js": "console.log('hello world');"
            }
            },
            "channel": "Javascript"
        }
        ],
        "trigger": [
        {
            "config": {
            "type": "matchDatabaseObject",
            "field": "Foo.targetDate",
            "offset": offset
            },
            "channel": "Scheduler"
        }
        ]
    }
}


const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
require('./mock/Cloud')(Parse) 

ParseMockDB.mockDB();
// create database-classes
Parse.Object.extend('Rule') 
Parse.Object.extend('Foo')
const FooSchema = new Parse.Schema('Foo');
FooSchema.addDate('targetDate')


var BRE = false
var channel
var today     = new Date()
today.setHours(0, 0, 0, 0);
var targetDate  = new Date(today);
targetDate.setDate(targetDate.getDate() + (-offset) );

var setup = async (z) => {
    BRE = require('./../../.')(Parse) // index.js
    new Scheduler({bre:BRE})
    new Javascript({bre:BRE})
    channel = new RuleAction({bre:BRE})
    z.ok(true,"inited")
        // setup rules in DB
    var Rule = new Parse.Object("Rule")
    await Rule.save(testDummyRule)
    rules = await new Parse.Query("Rule").find() 
    z.equal(rules.length, 1,"1 rules should be saved to db")
    // setup User
    
    var u = new Parse.Object("Foo")
    u.set('targetDate', targetDate)
    await u.save()
    
    BRE.loadRuleConfigs = async () => {
        var rules = await new Parse.Query("Rule").find()
        return rules.map( (r) => r.toJSON() )
    }
}
    
z.test('run scheduler (match database date)', async (t) => new Promise( async (resolve,reject) => {
    //console.log("offsetdate: "+targetDate)
    //console.log("today: "+today)
    await setup(z)
    var result = []
    var output = []
    
    var result = await BRE.run({schedulerDaily:true})
    sleep(1) 
    t.ok(result.output.items.length == 1)
    resolve()
}))
    