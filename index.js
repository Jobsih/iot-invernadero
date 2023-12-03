// Importar los módulos necesarios
const express = require('express');
const bodyParser = require('body-parser');
const { db } = require('./firebase.js');
const path = require("path");
const socketIO = require('socket.io');

// Crear una instancia de Express
const app = express();

//Variables de estado
var humTAct = 50;
var humAAct = 100;
var tempAct = 25;
//Variable configuracion
var humTIdeal = 100;
var humAIdeal = 100;
var tempIdeal = 22;

var prueba={
"1701361701780" : {
  "Humedad Ambiental": 50,
"Humedad en Tierra": 60,
"Temperatura" : 25,
"fecha":"1701361701780"} ,
"1701361781944":{
  "Humedad Ambiental": 69,
"Humedad en Tierra": 60,
"Temperatura" : 25,
"fecha":"1701361781944"} ,
"1701362079682" :{
  "Humedad Ambiental": 69,
"Humedad en Tierra": 60,
"Temperatura" : 25,
"fecha":"1701362079682"} };

// Puerto para la aplicación
const port = process.env.PORT || 3000; // Utiliza el puerto proporcionado por fly.io o el puerto 3000 por defecto

// Middleware para analizar solicitudes POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, ".", "/view")));

const server = app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

const io = socketIO(server);

//Variables de estado
var humTAct=50;
var humAAct=100;
var tempAct=25;
//Variable configuracion
var humTIdeal=100;
var humAIdeal=100;
var tempIdeal=22;

// Ruta POST para recibir las variables de temperatura y humedad
app.post('/valor', async (req, res) => {
    const { temp, humA, humT} = req.body;
    tempAct = temp;
    humTAct = humT;
    humAAct = humA;
    
    // Referencia a la collecion que esta en firebase y crea un nuevo documento
    const fbSensores = db.collection('sensores').doc('registros').collection('valores').doc(Date.now().toString())
    // Ingresa los datos al documento
    const fbRes = await fbSensores.set({'Temperatura': tempAct , 'Humedad Ambiental':humAAct, "Humedad en Tierra":humTAct, 'Fecha': Date.now().toString()})
    //Si los valoes de temperatura o gas sobrepasan su limite entonces enciende el ventilador
    let mensaje = [0,0,0,0];

    if (temp > tempIdeal) {
        mensaje[3]=1;

    }

    if (humA < humAIdeal) {
        mensaje[1]=1;
    }

    if (humT < humTIdeal) {
        mensaje[0]=1;
    }

    if (temp < tempIdeal) {
        mensaje[2]=1;
    }

    var mensajeP= mensaje.join("");
    res.send(mensajeP);

  });

  // Ruta POST para configurar valores ideales desde la pagina web
  app.post('/configuraParam', async (req, res) => {
    const { temp, humA, humT } = req.body;
    tempIdeal = parseInt(temp, 10);
    humTIdeal = parseInt(humT, 10);
    humAIdeal = parseInt(humA, 10);

    console.log('Variables actualizadas:', { tempIdeal, humTIdeal, humAIdeal });

    io.emit('nuevosValoresIdeales', { tempIdeal, humTIdeal, humAIdeal });

    res.redirect("/parametros");
});


  app.get('/', (req, res) => {
    const data = {
        humAAct,
        humTAct,
        tempAct,
    };
    
    res.render('index', { data });
});

app.get('/historial', (req, res) => {
  res.sendFile(__dirname + '/view/historial.html');
});

app.get('/valores', async(req,res)=>{
  /*db.collection('sensores').doc('registros').collection('valores')
  .orderBy("",  'desc')
  .onSnapshot((querySnapshot)=>{
    const valores = {};
    // Itera sobre los documentos y agrupa los datos en un objeto JSON
    querySnapshot.forEach((doc) => {
      valores[doc.id] = doc.data();
    });
    // Imprime el resultado en formato JSON
    prueba = JSON.stringify(valores, null, 2);
    }).catch((error) => {
        console.error('Error al obtener datos:', error);
    });*/
    let elem10 = prueba.slice(0,10);
    res.json(prueba)


});

app.post('/corregir', async (req, res) => {
  db.collection('sensores').doc('registros').collection('valores').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // Actualiza el documento actual añadiendo el campo 'id' con el valor del ID del documento
      db.collection('sensores').doc('registros').collection('valores').doc(doc.id).update({
        fecha: doc.id
      });
    });
  });
  res.redirect('/historial');
});

function consigueValores(){
  db.collection('sensores').doc('registros').collection('valores')
  .orderBy("fecha", "desc").onSnapshot((querySnapshot)=>{
    const valores = {};
    // Itera sobre los documentos y agrupa los datos en un objeto JSON
    querySnapshot.forEach((doc) => {
      valores[doc.id] = doc.data();
    });
        // Imprime el resultado en formato JSON
    prueba = JSON.stringify(valores, null, 2);
    });
    
}


app.get('/parametros', (req, res) => {
  res.sendFile(__dirname + '/view/parametros.html');
});
  
  // Manejo de conexiones WebSocket
  io.on('connection', (socket) => {
    console.log('Cliente conectado');
    consigueValores();  
    // Envía datos iniciales al cliente cuando se conecta
    socket.emit('data', { humAAct, humTAct, tempAct, humAIdeal, humTIdeal, tempIdeal, prueba});
  });

  setInterval(() => {
    // Emite los nuevos valores a todos los clientes conectados
    io.emit('data', { humAAct, humTAct, tempAct, humAIdeal, humTIdeal, tempIdeal, prueba});
  }, 5000);  // Actualiza cada 5 segundos
