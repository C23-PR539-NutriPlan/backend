const Hapi = require('@hapi/hapi');
const MySQL = require('mysql');
const { nanoid } = require('nanoid');
const HapiJwt = require('hapi-auth-jwt2');

const Jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { resolve } = require('path');
const axios = require('axios');

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

async function getEmail(email){
    return new Promise((resolve, reject)=>{
        connection.query(`SELECT * FROM users WHERE email='${email}'`, function(err, results, fields){
            if(results.length>0){
                console.log("coy ada")
                // console.log(err.message);
                return resolve(true);
            }
            else{
                return resolve(false);
            }
        });
    });
}


async function insertUser(id, name, email, password){
    const exist = await getEmail(email);
    console.log("exist " + exist);
    return new Promise((resolve, reject)=>{
    if(!exist){
        connection.query(`INSERT INTO users (id, name, email, password) VALUES ('${id}', '${name}', '${email}', '${password}')`, function(err, results, fields){
            if(err){
                console.log(err.message);
                return resolve(true);
            }
            else{
                return resolve(false);
            }
        });
    }
    else{
        return resolve(true);
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

function postForm(height, weight, weightGoal, gender, age, bmi, id, bmr){
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE users SET height='${height}', weight='${weight}', weightGoal='${weightGoal}', gender='${gender}', age='${age}', bmi='${bmi}', caloriesNeeded='${bmr}' WHERE id='${id}'`, (err, result, fields)=>{
            if(err){               
                return resolve(false);
            }

            return resolve(true);
        });
    })
}

async function getUserAllergies(id){
    return new Promise((resolve, reject) => {
    let allergiesName = [];
        connection.query(`SELECT ingredients.name FROM allergies INNER JOIN ingredients ON ingredients.id = ingredientsID where allergies.userID='${id}'`, (err, result, fields)=>{
            if(result.length>0){               
                for(let i=0; i<result.length; i++){
                    allergiesName.push(result[i].name);
                    if(i==result.length-1){
                        return resolve(allergiesName);
                    }
                }
            }
        });
    })
}

async function getUserPreferences(id){
    const userAllergies = await getUserAllergies(id);
    return new Promise((resolve, reject) => {
        let prefrencesName = [];
        connection.query(`SELECT foods.name FROM preference INNER JOIN foods ON foods.id = preference.foodID where preference.userID='${id}'`, (err, result, fields)=>{
            if(result.length>0){               
                for(let i =0; i<result.length; i++){
                    prefrencesName.push(result[i].name);

                    if(i==result.length-1){
                        break;
                    }
                }
                const userData = {
                    user_allergies: userAllergies,
                    user_preferences: prefrencesName
                }

                return resolve(userData);
            }
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

async function getAllFoodRecomendation(id){
    const datas = await getUserPreferences(id);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT foods.id, name, calories, image FROM foods INNER JOIN recommendation ON foods.ID = recommendation.foodID WHERE recommendation.userID = '${id}'`, (err, result, fields)=>{
            if(err){   
                console.log(err);            
                return reject(err);
            }
            const userDatas = {
                user_allergies : datas.user_allergies,
                user_preferences : datas.user_preferences,
                user_recommendation: result
            }
            return resolve(userDatas);
        });
    })
    
}

async function getFoodRecomendation(foodID){
    return new Promise((resolve, reject) => {
        connection.query(`SELECT foods.id, name, calories, fatContent, cholesterolContent, carbohydrateContent, fiberContent, sugarContent, proteinContent, image FROM foods WHERE foods.ID=${foodID}`, (err, result, fields)=>{
            if(err){   
                console.log(err);            
                return reject(err);
            }
            console.log(result[0]);
            return resolve(result);
        });
    })
    
}

async function getFoodLike(foodID, userID){
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM preference WHERE foodID=${foodID} AND userID='${userID}'`, (err, result, fields)=>{
            if(result.length>0){           
                console.log("masuk kok");  
                return resolve(true);
            }
            
            return resolve(false);
        });
    })
    
}

async function postLike(foodID, userID){
    const liked = await getFoodLike(foodID, userID);
    console.log("liked "+liked);
        console.log("delete");
        return new Promise((resolve, reject) => {
            if(liked){
                console.log(liked + " disini");
            connection.query(`DELETE FROM preference where userID ='${userID}' AND foodID= ${foodID}`, (err, result, fields)=>{
                if(err){           
                    console.log(err);  
                    return resolve(false);
                }
                
                return resolve(true);
            });
        }
        else{
            connection.query(`INSERT INTO preference (userID, foodID) VALUES ('${userID}', ${foodID})`, (err, result, fields)=>{
                if(err){           
                    console.log(err);  
                    return resolve(false);
                }
                
                return resolve(true);
            });
        }

    })
}

  server.route({
    method: 'POST',
    path: '/register',
    handler: async function(request, h) {
        const {
            name, email, password,
        } = request.payload;
    
        const id = nanoid(16);

        console.log("kok masuk");
        error = await insertUser(id, name, email, password);
        console.log(error);
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
                        bmi: error[0].bmi,
                        bmr: error[0].caloriesNeeded
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
            height, weight, weightGoal, gender, age, allergies, preferences
        } = request.payload;

        const bmi = (weight/(height*height))*10000;
        console.log(bmi);
        let bmr = 0;
        if(gender==="Female"){
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        else{
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        }
        console.log("req payload");

        const form = await postForm(height, weight, weightGoal, gender, age, bmi, id, bmr);

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

  server.route({
    method: 'GET',
    path: '/food/all/{id}',
    handler: async function(request, h) {
        const {
            id
        } = request.params;
        

        const listStory = await getAllFoodRecomendation(id);

        console.log(listStory);
      
        if(listStory){
            console.log(listStory);

            response = h.response({
            status: 'success',
            message: 'success',
            listStory
            // data1: 
            //     [
            //         {
            //             id: error[0].id,
            //             name: error[0].name,
            //             email: error[0].email,
            //             password: error[0].password,
            //             height: error[0].height,
            //             weight: error[0].weight,
            //             weightGoal: error[0].weightGoal,
            //             gender: error[0].gender,
            //             age: error[0].age,
            //             bmi: error[0].bmi
            //         }
            //     ],
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
    path: '/food/{foodID}/{userID}',
    handler: async function(request, h) {
        const {
            foodID, userID
        } = request.params;
        
        const recommendation = await getFoodRecomendation(foodID);

        const like = await getFoodLike(foodID, userID);
        console.log(like);
      
        if(recommendation.length>0){
            console.log(recommendation);

            response = h.response({
            status: 'success',
            message: 'success',
            story: {
                id: recommendation[0].id,
                name: recommendation[0].name,
                calories: recommendation[0].calories,
                fatContent: recommendation[0].fatContent,
                cholesterolContent: recommendation[0].cholesterolContent,
                carbohydrateContent: recommendation[0].carbohydrateContent,
                fiberContent: recommendation[0].fiberContent,
                sugarContent: recommendation[0].sugarContent,
                proteinContent: recommendation[0].proteinContent,
                image: recommendation[0].image,
                like: like
            }
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
    path: '/like',
    handler: async function(request, h) {

        const {
            foodID, userID
        } = request.payload;

        const likePost = await postLike(foodID, userID);
      
        if(likePost){
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