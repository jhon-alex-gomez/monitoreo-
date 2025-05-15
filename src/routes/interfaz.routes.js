const express = require("express");
const router = express.Router();

// Controller
const {
  renderInterfazForm,
  createNewInterfaz,
  renderInterfaz,
  updateInterfaz,
  editarInterfaz,
  postValorWireless,
  deleteinterfaz,
  dataiot,
  toggleSensor

} = require("../controllers/interfaz.controller");

// Helpers
const { isAuthenticated } = require("../helpers/auth");


router.get("/interfaz/addsensor", isAuthenticated, renderInterfazForm);
router.post("/interfaz/new-sensor", isAuthenticated, createNewInterfaz);
router.get("/interfaz", isAuthenticated, renderInterfaz);
router.get("/interfaz/edit-sensor/:id", isAuthenticated, updateInterfaz);
router.post("/interfaz/editar", isAuthenticated, editarInterfaz);
router.delete("/interfaz/delete-sensor/:id", isAuthenticated, deleteinterfaz);

// ver datos
router.get("/interfaz/visualizar-sensor/:id", isAuthenticated, dataiot);


// Recibir los valores por navegador

//recibir los valores desde equipo wireless
router.post("/interfaz/postadd", postValorWireless);

// Ruta para enviar comando al ESP32
router.post("/interfaz/toggle/:id", isAuthenticated, toggleSensor);

module.exports = router;
