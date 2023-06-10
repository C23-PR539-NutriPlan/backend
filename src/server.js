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
    password: 'pass',
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

function postForm(height, weight, weightGoal, gender, age, bmi, id){
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE users SET height='${height}', weight='${weight}', weightGoal='${weightGoal}', gender='${gender}', age='${age}', bmi='${bmi}' WHERE id='${id}'`, (err, result, fields)=>{
            if(err){               
                return resolve(false);
            }

            return resolve(true);
        });
    })
}

function getAllergiesID(allergies){
    return new Promise((resolve, reject) => {
        let allergiesID = [];
        for(let i=0; i<allergies.length; i++){
            connection.query(`SELECT id FROM ingredients where name='${allergies[i]}'`, (err, result, fields)=>{
                if(!err){               
                    console.log(result[0].id);
                    allergiesID.push(result[0].id);
                    console.log(allergies.length + " bertambah");
                }
                if(i==allergies.length-1){
                    return resolve(allergiesID);
                }
            });
        }
        
    })
}

async function postAllergies(allergies, id){
    const allergiesID = await getAllergiesID(allergies);
    return new Promise((resolve, reject) => {
        console.log("lengthnya " + allergiesID.length);
        console.log("get id alergi")
        const insertAllergyPromises = allergiesID.map((allergyID) => {
            return new Promise((resolve, reject) => {
                console.log("masuk insert");
              connection.query(
                `INSERT INTO allergies (userID, ingredientsID) VALUES ('${id}', '${allergyID}')`,
                (err, result, fields) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(result);
                  }
                }
              );
            });
          });

          Promise.all(insertAllergyPromises)
          .then(() => {
            return resolve(true);
          })
          .catch(() => {
            return resolve(false);
          });
      });
}

function getPreferencesName(preferences){
    return new Promise((resolve, reject) => {
        let preferencesName = [];
        for(let i=0; i<preferences.length; i++){
            connection.query(`SELECT id FROM foods where name='${preferences[i]}'`, (err, result, fields)=>{
                if(result.length==0){               
                    preferencesName.push(preferences[i]);
                }
                if(preferences.length-1==i){
                    return resolve(preferencesName);
                }
            });
        }
    })
}


async function postPreferences(preferences){
    const listUnstoredPreferences = await getPreferencesName(preferences);
    console.log("preferensi yang belum ada "+listUnstoredPreferences.length);
    return new Promise((resolve, reject) => {
        const insertPreferencesNamePromises = listUnstoredPreferences.map((preferenceName) => {
            return new Promise((resolve, reject) => {
                console.log("masuk insert lagi");
                connection.query(`INSERT INTO foods (name) VALUES ('${preferenceName}')`, (err, result, fields)=>{
                    if(err){               
                        reject(err);
                    }
                    else{
                        resolve(result);
                    }
                });
            });
          });

          Promise.all(insertPreferencesNamePromises)
          .then(() => {
            return resolve(true);
          })
          .catch(() => {
            return resolve(false);
          });
    })
}

async function getPreferencesID(preferences){
    return new Promise((resolve, reject) => {
        let preferencesID = [];
        for(let i=0; i<preferences.length; i++){
            connection.query(`SELECT id FROM foods where name='${preferences[i]}'`, (err, result, fields)=>{
                    console.log("id preferensi "+result[0]);
                    preferencesID.push(result[0].id);
                    if(preferences.length-1==i){
                        return resolve(preferencesID);
                    }
            });
        }
    })
}



async function postPreferencesID(preferences, id){
    const preferencesID = await getPreferencesID(preferences);
    return new Promise((resolve, reject) => {
        const insertPreferencesIDPromises = preferencesID.map((preferenceID) => {
            return new Promise((resolve, reject) => {
                console.log("masuk insert lagi");
                connection.query(`INSERT INTO preference (userID, foodID) VALUES ('${id}', '${preferenceID}')`, (err, result, fields)=>{
                    if(err){               
                        console.log(err);
                    }
            
                    resolve(result);
                });
            });
          });

          Promise.all(insertPreferencesIDPromises)
          .then(() => {
            return resolve(true);
          })
          .catch(() => {
            return resolve(false);
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
            data1: 
                [
                    {
                        id: error[0].id,
                        name: error[0].name,
                        email: error[0].email,
                        password: error[0].password,
                        height: error[0].height,
                        weight: error[0].weight,
                        weightGoal: error[0].weightGoal,
                        gender: error[0].gender,
                        age: error[0].age,
                        bmi: error[0].bmi
                    }
                ],
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
    method: 'POST',
    path: '/user/form/{id}',
    handler: async function(request, h) {

        const {
            id
        } = request.params;
        
        console.log("req param");

        const {
            height, weight, weightGoal, gender, age, bmi, allergies, preferences
        } = request.payload;

        console.log("req payload");

        const form = await postForm(height, weight, weightGoal, gender, age, bmi, id);

        console.log("postForm");

        const allergiesForm = await postAllergies(allergies, id);
        console.log("post allergies");

        const postUnstoredPreferences = await postPreferences(preferences);
        console.log("post unstored preferences");

        const postPreferencesIDD = await postPreferencesID(preferences, id);
        console.log("post id preferensi");

        if(postPreferencesID){
            response = h.response({
            status: 'success',
            message: 'success',
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