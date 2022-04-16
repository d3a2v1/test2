const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const { response } = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const options = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'comicbook',
    port: '3306',
};

const connection = mysql.createConnection(options);

const app = express();

const sessionStore = new MySQLStore(options);

app.use(
    session({
        secret: 'secret key',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(bodyParser.urlencoded({
    extended: false,
}));

app.get('/', (request, response) => {
    response.redirect('/booklist');
})

app.get('/booklist', (request, response) => {
    if (request.session.user === undefined) {
        return response.redirect('/login');
    }
    fs.readFile('bookList.html', 'utf-8', (error,data) => {
        connection.query('SELECT * from books', (error, results, field) => {
            if (error) throw error;
            response.send(ejs.render(data, {
                data: results,
            }));
        });
    });
});

app.get('/create', (request, response) => {
    fs.readFile('insertNewBook.html', 'utf-8', (error, data) => {
        if (error) throw error;
        response.send(data);
    });
});

app.post('/create', (request, response) => {
    const body = request.body;
    connection.query('INSERT INTO books (genre, name, writer, releasedate) VALUE (?, ?, ?, ?)',
    [body.genre, body.name, body.writer, body.releasedate], () => {
        response.redirect('/');
    });
});

app.get('/modify/:id', (request, response) => {
    fs.readFile('modify.html', 'utf-8', (error, data) => {
        connection.query('SELECT * from books WHERE number =?', [request.params.id], (error, results) => {
            if (error) throw error;
            console.log(request.params.id);
            response.send(ejs.render(data, {
                data: results[0],
            }));
        });
    });
});

app.post('/modify/:id', (request, response) => {
    const body = request.body;
    connection.query('UPDATE books SET genre = ?, name = ?, writer = ? WHERE number = ?',
    [body.genre, body.name, body.writer, request.params.id], (error, results) => {
        if (error) throw error;
        response.redirect('/');
    });
});

app.get('/delete/:id', (request, response) => {
    connection.query('DELETE FROM books where number=?', [request.params.id], () => {
        response.redirect('/');
    });
}); 

app.get('/join', (request, response) => {
    fs.readFile('joinMember.html', 'utf-8', (error, data) => {
        if (error) throw error;
        response.send(data);
    });
});

app.post('/join', (request, response) => {
    const body = request.body;
    connection.query('INSERT INTO member (id, password, email) VALUE (?, ?, ?)', 
    [body.id, body.password, body.email], (error, results) => {
        if (error) throw error;
        response.redirect('/');
    });
});

app.get('/login', (request, response) => {
    if(request.session.user !== undefined) {
        return response.redirect('/');
    }
    fs.readFile('login.html', 'utf-8', (error, data) => {
        if (error) throw error;
        response.send(data);
    });
});

app.post('/login', (request, response) => {
    const body = request.body;
    connection.query('SELECT * from member', (error, results, field) => {
        for(const i in results) {
            if(body.id === results[i].id && body.password === results[i].password) {
                console.log('로그인 성공');
                request.session.user = body.id;
                request.session.save((error) => {
                    if (error) throw error;
                    response.redirect('/');
                });
                console.log(`리퀘스트 --------${request}-------`);
                console.log(`리퀘스트.세션 --------${request.session}----------`);
                console.log(`리퀘스트.유저 --------${request.session.user}----------`);
            } else {
                console.log('로그인 실패');
                response.redirect('/login');
            }
        }
    });
});

app.get('/logout', (request, response) => {
    request.session.destroy((error) => {
        if (error) throw error;
        response.redirect('/');
    })
})

app.listen(3000, () => {
    console.log('server running');
    connection.connect();
});