const Hapi = require('@hapi/hapi');
const MySQL = require('mysql');
const { nanoid } = require('nanoid');

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

const connection = MySQL.createConnection({
    host: '34.101.224.88',
    user: 'root',
    password: 'nutriplanhore',
    database: 'NutriPlan_db'
})

function insertUser(id, name, email, password){
    connection.query(`INSERT INTO users (id, name, email, password) VALUES ('${id}', '${name}', '${email}', '${password}')`, function(err, results, fields){
        console.log("masuk");
        if(err){
            console.log(err.message);
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
            console.log(result);
            return resolve(result);
        });
    })
}

  server.route({
    method: 'POST',
    path: '/users',
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
            message: 'Successfully added user',
            data: {
                userId: id,
            },
            });
            response.code(201);
            return response;
        }

        response = h.response({
        status: 'fail',
        message: 'Failed to add user',
        });
        response.code(400);
        return response;
    }
  });

  server.route({
    method: 'GET',
    path: '/users/{email}/{password}',
    handler: async function(request, reply) {
        const {email, password} = request.params;
        const connect = await getUser(email, password);
        return{
            data:{
                user: connect
            }
        }
        // if(result!==null){
        //     console.log(result);
        //     return {
        //         status: 'success',
        //         data: {
        //             result,
        //         },
        //     }
        // }
        // const response = h.response({
        // status: 'fail',
        // message: 'User not found',
        // });
        // response.code(404);
        // return response;
        //const user = users.filter((user) => (user.email === email && user.password === String(password)))[0];
    
  }});

  await server.start();
};

init();