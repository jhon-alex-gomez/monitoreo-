const interfazCtrl = {};
const nodemailer = require('nodemailer');
const dayjs = require('dayjs');
require('dayjs/locale/es');




//const Influx = require('influxdb-nodejs');
//const client = new Influx('http://127.0.0.1:8086/dbMultimodal');
//const {InfluxDB} = require('@influxdata/influxdb-client');
//const org = 'MicroRed'



// Models de datos usados en el controlador para guardar en MONGO
const Interfaz = require("../models/Interfaz");
const Users = require("../models/User");
const DatosIoT = require("../models/datosiot");
//const datosiot = require('../models/datosiot');


//PARA RESPUESTA A LOS POST
let respuesta = {
  error: false,
  codigo: 200,
  mensaje: ''
};

//CONFIGURACIÓN DE ENVIO DE MAIL
//var nodemailer = require('nodemailer'); // email sender 


//Lleva al formulario de nueva interfaz
interfazCtrl.renderInterfazForm = (req, res) => {
  res.render("interfaz/new-interfaz");
};

//Guarda los datos de la nueva interfaz 
interfazCtrl.createNewInterfaz = async (req, res) => {

  const { name, sensor_1 , sensor_2, sensor_3, n_sensor} = req.body;
  const errors = [];
  if (!name) {
    errors.push({ text: "Por favor indique un nombre para la interfaz" });
  }
 
  //if (!info) {
    //errors.push({ text: "Por favor indique información de los sensores (info general)" });
  

  if (errors.length > 0) {
    res.render("interfaz/new-interfaz", {
      errors,
      name,
      
      
      
    });
  } else {


    //Aqui código de generación de TOKEN, por el momento igual a ID de creación de la interfaz
    var sensor_codigo = 0;

    //
    const newSensor = new Interfaz({ name,sensor_codigo, sensor_1, sensor_2, sensor_3, n_sensor });
    newSensor.user = req.user.id;
    newSensor.sensor_codigo = newSensor.id;
    await newSensor.save();
  

    let testAccount = await nodemailer.createTestAccount();

    var elmensaje = "Se ha creado la interfaz:" + " " + newSensor.name + " " + "con el TOKEN::" + " " + newSensor.id + ". " + "En el link www.xxx.com encontrará las instrucciones de configuración de su interfaz.";
    //ENVIAR MAIL CON TOKEN
    // var transporter = nodemailer.createTransport({
    //   service: 'Gmail',
    //   auth: {
    //     user: 'proyectoenergetica2030@gmail.com',
    //     pass: 'VqKjDw140Q*}eRh8p"C;'
    //   }
    // });
    // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'clementine.mante@ethereal.email', // generated ethereal user
      pass: 'hAV4HaC6x2K7JkEWY4', // generated ethereal password
    },
  });
    // Definimos el email
    var mailOptions = {
      from: '"Proyecto ENERGETICA2030" <clementine.mante@ethereal.email>',
      to: req.user.email,
      subject: 'Energetica2030 Token Interfaz de adquisición',
      text: elmensaje,

    };
    // Enviamos el email
   /* transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.send(500, err.message);
      } else {
        console.log("Email sent");
        res.status(200).jsonp(req.body);
      }
    });*/

    req.flash("success_msg", "Interfaz adicionada, revisar su mail para obtener TOKEN ");
    res.redirect("/interfaz");
    
  }


};

//Redirecciona para mostrar todos los sensores creados
interfazCtrl.renderInterfaz = async (req, res) => {
  const interfaz = await Interfaz.find({ user: req.user.id }).sort({ date: "desc" });
  console.log(interfaz)
  res.render("interfaz/all-interfaz", { interfaz });
};

//Redirecciona a formulario de edición de datos de sensores
interfazCtrl.updateInterfaz = async (req, res) => {
  const sensor = await Interfaz.findById(req.params.id);
  console.log(sensor)
  res.render('interfaz/edit-interfaz', sensor);
};

// buscar los datos de de la base y manda los datos a la grafica
interfazCtrl.dataiot = async (req, res) => {
  try {
    const datos = await DatosIoT.find({ token: req.params.id });

    const cons = datos.map(d => d.consumo).filter(c => c !== undefined);
    const volt = datos.map(d => d.voltaje).filter(v => v !== undefined);
    const cor = datos.map(d => d.corriente).filter(v => v !== undefined);
    const fecha = datos.map(d => d.createdAt.toISOString());
    const consF = datos.map(d => parseFloat(d.consumo)); // forzamos a número
    const totalConsumo = consF.reduce((acc, val) => acc + val, 0);

    console.log(totalConsumo)

    console.log(fecha)
    console.log(consF)


    // Serializa a JSON desde el controlador
    res.render('interfaz/grafica', {
      cons: JSON.stringify(cons),
      volt: JSON.stringify(volt),
      cor: JSON.stringify(cor),
      fecha: JSON.stringify(fecha),
      totalConsumo: JSON.stringify(totalConsumo)
      
    });
  } catch (error) {
    console.error('Error al consultar datos:', error);
    res.status(500).send('Error al obtener los datos');
  }
};




//Eliminar sensor
interfazCtrl.deleteinterfaz = async (req , res ) => {
  console.log(req.params.id)
await Interfaz.findByIdAndDelete(req.params.id);
const borrar = await DatosIoT.deleteMany({ token :req.params.id });
console.log(borrar)
res.redirect('/interfaz')
};

//Guarda cambios de sensores en base de datos MongoDB
interfazCtrl.editarInterfaz = async (req, res) => {
  const idSensor = req.body.sensor_codigo;
  console.log(idSensor);
  Interfaz.findByIdAndUpdate(idSensor, {
    name: req.body.name,
    ubicacion: req.body.ubicacion,
    sensor_1: req.body.sensor_1,
    sensor_2: req.body.sensor_2,
    sensor_3: req.body.sensor_3,
    n_sensor: req.body.n_sensor
    

  }, (error, idSensor) => {
    console.log(error, idSensor)
    res.redirect('/interfaz');
  })

}

//EJEMPLO 1 - REGISTRA DATOS RECIBIDOS DE SENSOR MEDIANTE HTTP
interfazCtrl.postValorWireless = async (req, res) => {
  //CODIGO RECEPCIÓN con MODULO
  ///Codigo ESP32: "EspPostJson.io"
  
  var GSMprueba = req.body;
  console.log(GSMprueba);
  console.log("Funciona Recibido en PostValorWireless");
  //var recjson = JSON.parse(req.body);

  var token = GSMprueba.token; //el token dado por la APP
  console.log(token);
  const idSensor = token; //se podría habilitar otro token diferente al Id MongodB
  var sensor = await Interfaz.findById(idSensor);//se obtienen los datos de la interfaz con el IdSensor
  var  toksensor = sensor.sensor_codigo;
  console.log(toksensor); 
  if (token==toksensor) { //validación de seguridad

    //const datuser = await Users.findById(sensor.user);//busca los datos de usuario para guardar en influx esos datos
    
    
    //var nameUser = datuser.email; //mail registrado en la App

    //Inicialización
    const name = GSMprueba.name; //interfaz.name//sensor.name; //nombre de la interfaz dada en la App
    var ubicacion =GSMprueba.ubicacion //"Unisucre";
    const temperatura = GSMprueba.temperatura;
    const humedad = GSMprueba.humedad;
    const token = GSMprueba.token;
    const consumo = GSMprueba.consumo;
    const voltaje = GSMprueba.voltaje;
    const corriente = GSMprueba.corriente;
    const ip = GSMprueba.ip;
    
    const newDato = new DatosIoT({name, ubicacion, temperatura, humedad ,token, consumo, voltaje, corriente, ip});
    //datuser.user = req.user.id;
    await newDato.save();
    console.log("Dato almacenado en MongoDB")

     respuesta = {
       error: false,
       codigo: 200,
       mensaje: 'Dato recibido'
     };
     res.send(respuesta);
  }
  else {
     respuesta = {
       error: true,
       codigo: 501,
       mensaje: 'No existe el TOKEN->Interfaz no creada'
     };
     res.send(respuesta);
   }
  }



const axios = require('axios');

// Función para manejar el cambio de estado de un sensor
interfazCtrl.toggleSensor = async (req, res) => {
  try {
    // Obtener IP desde DatosIoT usando el token
    const sensorIoT = await DatosIoT.findOne({ token: req.params.id })
      .sort({ createdAt: -1 }) // obtener el último
      .exec();

    if (!sensorIoT) {
      return res.status(404).json({ message: 'Sensor no encontrado en DatosIoT' });
    }

    const ip = sensorIoT.ip;
    console.log('IP del sensor:', ip);

    // Obtener estado desde Interfaz por ID
    const sensorInterfaz = await Interfaz.findById(req.params.id);

    if (!sensorInterfaz) {
      return res.status(404).json({ message: 'Sensor no encontrado en Interfaz' });
    }

    const estadoActual = sensorInterfaz.estado || 'off';
    const nuevoEstado = estadoActual === 'on' ? 'off' : 'on';

    // Actualizar estado en Interfaz
    sensorInterfaz.estado = nuevoEstado;
    await sensorInterfaz.save();

    // Enviar solicitud al ESP32
    const esp32Url = `http://${ip}/toggle`; // o usar el webhook si estás simulando
    // const esp32Url = 'https://webhook.site/7bcc3c13-33d2-43b6-8d3e-dc128349d21f';

    await axios.post(esp32Url, { action: nuevoEstado });

    res.json({
      message: `Estado del sensor cambiado a ${nuevoEstado}`,
      success: true,
      estado: nuevoEstado,
    });

  } catch (error) {
    console.error('Error al cambiar el estado del sensor:', error.message);
    res.status(500).json({
      message: 'Error al cambiar el estado del sensor',
      error: error.message,
    });
  }
};


//

//FINAL - REGISTRA DATOS RECIBIDOS DE interfaz de Estaciones de Cargar en Versión INFLUX v1
/* interfazCtrl.postSensorStation = async (req, res) => {
  //CODIGO RECEPCIÓN con MODULO
  ///Codigo ESP32: "EspPostJson.io"


  var Data_sensor = req.body;
  console.log(Data_sensor);
  //console.log("Funciona Recibido en PostValorWireless");
  //var recjson = JSON.parse(req.body);

  var token = Data_sensor.token;
  console.log(token);
  const idSensor = token; //se podría habilitar otro token diferente al Id MongodB
  const sensor = await Interfaz.findById(idSensor);//se obtienen los datos de la interfaz con el IdSensor
  console.log(sensor)
  if (sensor) { //si existe la interfaz en MongoDb

    const datuser = await Users.findById(sensor.user);//busca los datos de usuario para guardar en influx esos datos
    //var interfaz = sensor.name; //nombre de la interfaz dada en la App
    //var nameUser = datuser.email; //mail registrado en la App


    //Inicialización
    const name= "javier";
    const ubicacion= "casa";
    const temperatura = "43"
    const humedad = "88";
    const newDato = new DatosIoT({name, ubicacion, temperatura, humedad});
    //datuser.user = req.user.id;
    await newDato.save();
    console.log("Dato almacenado en MongoDB")

    respuesta = {
      error: false,
      codigo: 200,
      mensaje: 'Dato recibido'
    };
    res.send(respuesta);


  } else {
    respuesta = {
      error: true,
      codigo: 501,
      mensaje: 'No existe el TOKEN->Interfaz no creada'
    };
    res.send(respuesta);
  }






}
 */

module.exports = interfazCtrl;