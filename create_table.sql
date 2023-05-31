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