const mong = require('mongoose');
const User = require('./struct/user.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

mong.connect(
    "mongodb://localhost:27017/quiz",
    {useNewUrlParser: true, useUnifiedTopology: true}
  );
  //'mongodb://Admin:123456@localhost:27017/testdb?authSource=admin'

  mong.connection.once('open', () => {
    console.log('Connected to mongo-db');
  });

  mong.connection.on('error', error => {
    console.log(error);
  });

  module.exports = {

    login: function(name, pwd) {
        return new Promise(resolve => {
            User.findOne({name: name}).exec((err, data) => {
                if(err) resolve(-2);
                else if (data!==null) {
                    bcrypt.compare(pwd, data.pwd, function(err, result) {
                        if(err) resolve(-2);
                        else if(!result) resolve(-1);
                        else resolve(data);
                    });
                } else {
                    resolve(-1);
                }
            });
        });
    },

    addExUser: function() {
        console.log("add");
        return new Promise(resolve => {
            bcrypt.hash('123456', saltRounds ,function(err, hash) {
                let u = new User({name: 'Bob', pwd: hash});
                u.save((err, data) => {
                    if(err) resolve(-1);
                    else resolve(0);
                });
            });
        });
    }
  }