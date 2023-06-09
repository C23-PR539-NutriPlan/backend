const Hapi = require('@hapi/hapi');
const MySQL = require('mysql');
const { nanoid } = require('nanoid');
const HapiJwt = require('hapi-auth-jwt2');

const Jwt = require('jsonwebtoken');
const crypto = require('crypto');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    // port: process.env.PORT||3000,
    // host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

await server.register(HapiJwt);
const secretKey = crypto.randomBytes(32).toString('hex');
server.auth.strategy('jwt', 'jwt', {
    key: secretKey,
    validate: async (decoded, request, h) => {
      // Perform additional validation checks here if needed
      // For example, you can check if the user exists in the database or if the token is expired
  
      // Return the validation result
      return { isValid: true };
    }
  })

const connection = MySQL.createConnection({
    host: '34.101.224.88',
    user: 'root',
    password: 'nutriplanhore',
    database: 'NutriPlan_db'
})

function insertUser(id, name, email, password){
    connection.query(`INSERT INTO users (id, name, email, password) VALUES ('${id}', '${name}', '${email}', '${password}')`, function(err, results, fields){
        if(err){
            // console.log(err.message);
            return true;
        }
        else{
            return false;
        }
    });
}

function getUser(email, password){
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM users WHERE email='${email}' AND password='${password}'`, (err, result, fields)=>{
            if(err){               
                return reject(err)
            }

            return resolve(result);
        });
    })
}

function getProfile(id){
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM users WHERE id='${id}'`, (err, result, fields)=>{
            if(err){               
                return reject(err)
            }

            return resolve(result);
        });
    })
}

  server.route({
    method: 'POST',
    path: '/register',
    handler: function(request, h) {
        const {
            name, email, password,
        } = request.payload;
    
        const id = nanoid(16);
        
        const error = insertUser(id, name, email, password);
        
        console.log(error)
        if(!error){
            response = h.response({
            status: 'success',
            message: 'success',
            data: {
                userId: id,
            },
            });
            response.code(201);
            return response;
        }

        response = h.response({
        status: 'fail',
        message: 'error',
        });
        response.code(400);
        return response;
    }
  });

  server.route({
    method: 'POST',
    path: '/login',
    handler: async function(request, h) {

        const {
            email, password,
        } = request.payload;


        const error = await getUser(email, password);
        
        console.log(error[0]);
      
        if(error.length>0){
            console.log(error);
            const payload = {
                email: email,
                user: error[0].id
              };
            const token = Jwt.sign(payload, secretKey);
            response = h.response({
            status: 'success',
            message: 'success',
            data: {
                user: error[0].id,
                token: token
            },
            });
            response.code(201);
            return response;
        }

        response = h.response({
        status: 'fail',
        message: 'error',
        });
        response.code(400);
        return response;
    
  }});

  server.route({
    method: 'GET',
    path: '/user/{id}',
    options: {
        auth: 'jwt' // Require authentication using the 'jwt' strategy
      },
    handler: async function(request, h) {

        const {
            id
        } = request.params;
        
        const error = await getProfile(id);
        
        console.log(error[0]);
      
        if(error.length>0){
            console.log(error);

            response = h.response({
            status: 'success',
            message: 'success',
            data: {
                user: error
            },
            });
            response.code(201);
            return response;
        }

        response = h.response({
        status: 'fail',
        message: 'error',
        });
        response.code(400);
        return response;
    
  }});

  await server.start();
};

init();