var BRE = require('jsreactor')
var _   = require('jsreactor/_')

function bre(Parse){
    
    var parseAdapter = async (bre) => {

        bre.createRuleSchema = async () => new Promise((resolve,reject) => {
            var schema = new Parse.Schema("Rule")
            schema.get()
            .then( resolve )
            .catch( (e) => {
                schema.addString('name');
                schema.addString('language')
                schema.addString('triggerChannel')
                schema.addBoolean('disabled')
                schema.addObject('config')
                schema.save()
                .then(() => b.log("fallback: created Rule-Class schema in db") )
                .catch(reject)
            })
        })
   
        // lets specify the function to load rules from DB
        bre.loadRuleConfigs = () => {
            var q    = new Parse.Query("Rule")
            return new Promise( (resolve, reject) => {
                q.find()
                .then( (rules) => rules.map( (r) => r.toJSON() ) ) 
                .then( resolve )
                .catch( (e) => {
                    console.error(e)
                })
            })
        }

        bre.getInstalledTriggers = (channel) => {
            var q    = new Parse.Query("Rule")
            return new Promise( (resolve, reject) => {
                q.equalTo("triggerChannel",channel)
                q.find()
                .then( (rules) => rules.map( (r) => r.toJSON() ) ) 
                .then( resolve )
                .catch( (e) => {
                    console.error(e)
                })
            })    
        }

        bre.onDatabaseSave = (table,cb) => {
            Parse.Cloud.afterSave(table,cb) 
        }

        bre.Parse = Parse

        function enableParseLogging(req){
            var old = bre.log 
            var e   = console.error
            bre.log = function(str){
                old(str)
                req.log.info("BRE: "+str)
            }
            console.error = function(i){
                e(i)
                req.log.error(i)
            }
            bre.log.parse = true
        }

        // register endpoints
        for( var i in bre.endpoint ){
            console.log(`defining Parse.Cloud.${i}`)
            Parse.Cloud.define(i, function(cb,req){
                var userfields = ['objectId','firstName','lastName','email','username','createdAt','updatedAt']
                req.params.user = _.pluck(userfields,req.user.toJSON())
                if( !bre.log.parse ) enableParseLogging(req)
                return cb(req.params)
            }.bind(bre,bre.endpoint[i]))
        }
    
        bre.createRuleSchema()
        .then( () => b.log("checking Rule-class: exist") )
        .catch(console.error)
    }

    var b = BRE(parseAdapter)
    b.init() // first init
    
    return b
}

bre.Channel = {
    Input:      require('jsreactor/channel/Input'),
    HelloWorld: require('jsreactor/channel/HelloWorld'),
    Javascript: require('jsreactor/channel/Javascript')
}

module.exports = bre
