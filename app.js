//Criar o Server
const express = require('express');
const app = express();
const middleware = require('./src/middleware');
var bodyParser = require('body-parser');
const bd = require('./src/config/basedados');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('port', process.env.PORT||4000)

app.use(express.json());

bd.authenticate()
.then(console.log('Connection has been established successfully.'))
.catch(error => console.log('Error: '+error))

// Configurar CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type,Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
}); 

//Forçar atualização das tabelas
/* bd.sync({
    force: true
});  */

//Criar Tabelas

/* const indexmodels = require('./src/models/index'); */

// Rotas
const rota = require('./src/routes/RotasTestData');
const rotasCentro = require('./src/routes/RotasCentro');
const rotasSala = require('./src/routes/RotasSala');
const rotasUtilizador = require('./src/routes/RotasUtilizador'); 
const rotasReservas = require('./src/routes/RotasReserva');

app.use('/centros', rotasCentro);
app.use('/utilizadores', rotasUtilizador);
app.use('/salas', rotasSala); 
app.use('/testdata', middleware.checkToken, rota);
app.use('/reservas',middleware.checkToken, rotasReservas);  

app.listen(app.get('port'),()=>{
    console.log("Start server on port "+app.get('port'))
})

