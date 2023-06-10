CREATE TABLE users (
    id VARCHAR(16) PRIMARY KEY NOT NULL,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(25) NOT NULL,
    height INT,
    weight INT, 
    weightGoal INT,
    gender VARCHAR(10),
    age INT,
    bmi INT
);

CREATE TABLE foods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(500),
    recipeCategory  VARCHAR(500),
    calories FLOAT,
    fatContent FLOAT,
    saturatedFatContent FLOAT,
    cholesterolContent FLOAT,
    sodiumContent FLOAT,
    carbohydrateContent FLOAT,
    fiberContent FLOAT,
    sugarContent FLOAT,
    proteinContent FLOAT
);

CREATE TABLE ingredients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(500)
);

CREATE TABLE recipe (
    foodID INT,
    ingredientsID INT,
    PRIMARY KEY (foodID, ingredientsID),
    FOREIGN KEY (foodID) REFERENCES foods(id),
    FOREIGN KEY (ingredientsID) REFERENCES ingredients(id)
);

CREATE TABLE allergies (
    userID VARCHAR(16),
    ingredientsID INT,
    PRIMARY KEY (userID, ingredientsID),
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (ingredientsID) REFERENCES ingredients(id)
);

CREATE TABLE preference (
    userID VARCHAR(16),
    foodID INT,
    PRIMARY KEY (userID, foodID),
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (foodID) REFERENCES foods(id)
);

CREATE TABLE recommendation (
    userID VARCHAR(16),
    foodID INT,
    PRIMARY KEY (userID, foodID),
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (foodID) REFERENCES foods(id)
);