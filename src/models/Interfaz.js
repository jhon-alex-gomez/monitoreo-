const { Schema, model } = require("mongoose");

const InterfazSchema = new Schema(
  {
    name: {
      type: String,
      required: false
    },
    ubicacion: {
      type: String,
      required: false
    },
    info: {
      type: String,
      required: false
    },
    sensor_codigo: {
      type: String,
      required: false
    },
    user: {
      type: String,
      required: false
    },
    sensor_1:{
      type: String,
      require: false
    },
    sensor_2:{
      type: String,
      require: false
    }
  
  },
  {
    timestamps: true
  }
);

module.exports = model("interfaz", InterfazSchema);
