// Importar los módulos necesarios
const express = require('express');
const bodyParser = require('body-parser');
const { db } = require('./firebase.js');
const path = require("path");

// Crear una instancia de Express
const app = express();

// Middleware para analizar solicitudes POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, ".", "/view")));

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
    const fbRes = await fbSensores.set({'Temperatura': tempAct , 'Humedad Ambiental':humAAct, "Humedad en Tierra":humTAct})
    //Si los valoes de temperatura o gas sobrepasan su limite entonces enciende el ventilador
    switch (true) {
        case temp > tempIdeal: //Enfriar
            res.send("0001");
            break;
        
        case humA < humAIdeal: //Vaporizar
            res.send("0100");
            break;
      
        case humT < humTIdeal: //Regar
            res.send("1000");
            break;
      
        case temp < tempIdeal: //Calentar
            res.send("0010");
            break;
      
        default:
          console.log("0000"); // Acción por defecto si no se cumple ninguna condición
      }
  });

  // Ruta POST para configurar valores ideales desde la pagina web
app.post('/configuraParam', async (req, res) => {
    const { temp, humA, humT} = req.body;
    tempIdeal = temp;
    humTIdeal = humT;
    humAIdeal = humA;

    res.json({ message: 'Datos configurados correctamente' });
  });


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/view/index.html');
});

// Iniciar el servidor en el puerto 3000
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});