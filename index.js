// Importaciones
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const expressFileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const secretKey = 'Mi Clave Super Secreta';

const { nuevoUsuario, getUsuarios, setUsuarioStatus, getUsuario, eliminarUsuario, editUsuario } = require('./consultas');

// Server
app.listen(3000, () => console.log("Servidor encendido en puerto 3000 !"))

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

app.use(
    expressFileUpload({
        limits: 5000000,
        abortOnLimit: true,
        responseOnLimit: 'El tamaño de la imagen supera el limite permitido',
    })
);

app.set('view engine', 'handlebars');
app.engine(
    'handlebars',
    exphbs.engine({
        defaultLayout: 'main',
        layoutsDir: `${__dirname}/views/mainLayout`,
    })
);

// Rutas
app.get('/', async (req, res) => {
    try {
        const usuarios = await getUsuarios();
        res.render('index', { usuarios });
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    };
});

app.get('/admin', async (req, res) => {
    try {
        const usuarios = await getUsuarios();
        res.render('Admin', { usuarios });
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    };
});

app.get('/registro', async (req, res) => {
    res.render('Registro');
});

app.post('/upload', (req, res) => {
    // console.log("req.files :", req.files);
    // console.log("req.body :", req.body);
    const { email, name, password1, password2, anos_exp, especialidad } = req.body;
    const { foto } = req.files;

    if (password1 != password2) {
        return res.status(401).send('Las contraseñas no coinciden!');
    }
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No se encontro ningun archivo de imagen para la foto');
    }

    foto.mv(`${__dirname}/public/${foto.name}`, async (err) => {
        if (err) return res.status(500).send({
            error: `Algo salio mal... ${err}`,
            code: 500
        })
        try {
            const usuario = await nuevoUsuario(email, name, password1, anos_exp, especialidad, foto.name);
            // console.log("usuario : ", usuario);
            // res.status(201).send(JSON.stringify(usuario));
            res.status(201).redirect('/');
        } catch (e) {
            res.status(500).send({
                error: `Algo salio mal... ${e}`,
                code: 500
            })
        };
    });
});

app.get('/login', (req, res) => {
    res.render('Login');
});

app.get('/datos', (req, res) => {
    const { token } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
        const { data } = decoded;
        // console.log("data : ", data);
        err
            ? res.status(401).send(
                res.send({
                    error: "401 Unauthorized",
                    message: "Usted no esta autorizado para estar aqui",
                    token_error: err.message
                })
            )
            : res.render('Datos', { data });
    });
});

app.post('/verify', async (req, res) => {
    const { email, password } = req.body;
    const user = await getUsuario(email, password);

    if (user) {
        if (user.estado) {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 1800,
                    data: user,
                },
                secretKey
            );
            res.send(token);
        } else {
            res.status(401).send({
                error: 'Este usuario no ha sido validado',
                code: 401,
            });
        }
    } else {
        res.status(404).send({
            error: 'Este usuario no esta registrado o la password es incorrecta',
            code: 404,
        });
    }
});

app.put('/usuarios', async (req, res) => {
    const { id, estado } = req.body;
    try {
        const usuario = await setUsuarioStatus(id, estado);
        res.status(200).send(JSON.stringify(usuario));
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    };
});

app.delete('/usuario', async (req, res) => {
    const { id } = req.query;
    try {
        await eliminarUsuario(id);
        res.status(200).send(JSON.stringify({ message: 'Usuario eliminado con exito' }));
    } catch (e) {
        console.log("e : ", e);
        res.status(500).send(JSON.stringify({ error: e }));
    }
});

app.put('/usuario', async (req, res) => {
    const { id } = req.query;
    try {
        await editUsuario(id, req.body);
        res.status(200).send(JSON.stringify({ message: 'Usuario modificado con exito' }));
    } catch (e) {
        console.log("e : ", e);
        res.status(500).send(JSON.stringify({ error: e }));
    }
});