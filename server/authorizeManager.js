const fs = require('fs');
const TOKENDATA = {
  "secret" : "djaslkfhdsflsdkjfasdfjöadsfsad",
  "expires": "120h"
};
var jwt = require('jsonwebtoken');
//const { isAdminUser } = require('node-windows');

module.exports = {

  /**
   * Generiert einen neuen Token
   * @param {Object} user 
   * @returns {String} new token
   */
  getUserToken: function (user) {
    return new Promise(resolve => {
      let token = jwt.sign(
        {
          user : {
            id: user._id,
            name: user.name
          }
        },
        TOKENDATA.secret,
        {
          expiresIn: TOKENDATA.expires,
        },
      );
      resolve(token);
    });
  },
  
  /**
   * Überprüft den Token auf seiner Gültikeit
   * Returned status 403, wenn Token verfallen ist
   * @param {Request} req 
   * @param {Response} res 
   * @param {Function} next 
   */
  verifyToken: function (req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if((typeof bearerHeader !== 'undefined') &&
        bearerHeader != '' && bearerHeader != null &&
        bearerHeader != "null") {

      jwt.verify(bearerHeader.split(' ')[1], TOKENDATA.secret, (err, authData) => {
        if(err){
          console.log(err.message);
          console.log("token has been expired (403)");
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Vary', 'Origin');
          res.status(403).send();
        } else {
            res.set('authorization', bearerHeader);
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Vary', 'Origin');
            next();
        }
      });
    } else {
      console.log("no token available (403)");
      res.status(403).send();
    }
  },

  getUser: function(token) {
    const user = jwt.decode(token.split(' ')[1]);
    return user.user;
  },

  /**
   * Liefert id von User im Token
   * @param {Request} req 
   * @returns {String} UserID
   */
  getUserId: function(req){
      const user = jwt.decode(req.headers['authorization'].split(' ')[1]);
      //return user.user.frn_id;
      return user.user.id;
  }
}