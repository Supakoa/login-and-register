CREATE TABLE users (
    id int(10) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name varchar(50) NOT NULL,
    email varchar(50) NOT NULL UNIQUE KEY,
    password varchar(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;