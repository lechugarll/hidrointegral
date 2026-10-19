// Situaciones reales en las que el caudal q(t) cambia con el tiempo.
// q en litros por minuto, t en minutos, capacidad en litros.
//
// `q` es el texto que se envía al servidor (donde Python lo integra). `f` es la
// misma función en JavaScript, usada SOLO para dibujar la miniatura del selector;
// los cálculos reales siempre vienen de la API.
export const ESCENARIOS = [
  {
    id: "llave",
    nombre: "Llave que se abre",
    q: "2*t+3",
    a: 0,
    b: 4,
    capacidad: 40,
    forma: "una recta que sube",
    porque:
      "Al abrir una llave poco a poco, el caudal crece de forma pareja: arranca en 3 L/min y gana 2 L/min cada minuto. Es el caso que se resuelve a mano en clase.",
    f: (t) => 2 * t + 3,
  },
  {
    id: "constante",
    nombre: "Caudal constante",
    q: "10",
    a: 0,
    b: 6,
    capacidad: 80,
    forma: "una recta horizontal",
    porque:
      "Con la presión estable y la llave quieta, entra siempre lo mismo. Aquí el área es un rectángulo y basta multiplicar: V = q·t. La integral generaliza esta cuenta al caso en que q cambia.",
    f: () => 10,
  },
  {
    id: "acelerado",
    nombre: "Caudal que se acelera",
    q: "t^2+2",
    a: 0,
    b: 4,
    capacidad: 40,
    forma: "una curva que sube cada vez más rápido",
    porque:
      "Imagina un grifo que se abre cada vez más rápido, o una bomba que arranca y va ganando potencia: el caudal no solo sube, sube cada vez más deprisa. Es un modelo simplificado, pero sirve para ver una integral con la regla de la potencia: V = t³/3 + 2t.",
    f: (t) => t * t + 2,
  },
  {
    id: "bomba",
    nombre: "Bomba con ciclos",
    q: "10+8*sin(2*t)",
    a: 0,
    b: 6,
    capacidad: 80,
    forma: "una onda",
    porque:
      "Una bomba de pistón empuja y se recarga una y otra vez, así que el caudal sube y baja en ondas. El área suma todas las subidas y las bajadas en un solo número.",
    f: (t) => 10 + 8 * Math.sin(2 * t),
  },
  {
    id: "lluvia",
    nombre: "Lluvia sobre un techo",
    q: "20*exp(-(t-4)^2/4)",
    a: 0,
    b: 8,
    capacidad: 80,
    forma: "una campana",
    porque:
      "La canaleta de un techo recibe poco al empezar a llover, mucho en lo más fuerte del aguacero y poco otra vez cuando escampa. La cisterna guarda toda esa agua: es el área bajo la campana.",
    f: (t) => 20 * Math.exp(-((t - 4) ** 2) / 4),
  },
  {
    id: "vaciado",
    nombre: "Depósito que se vacía",
    q: "20*exp(-t/3)",
    a: 0,
    b: 9,
    capacidad: 70,
    forma: "una curva que baja",
    porque:
      "Cuando un depósito alto se vacía por un orificio, el agua pierde presión y el chorro se debilita: el caudal decae. Aun así, el área total es los litros que pasaron al tanque de abajo.",
    f: (t) => 20 * Math.exp(-t / 3),
  },
];

export const ESCENARIO_PROPIO = {
  id: "propio",
  nombre: "Mi propia función",
  q: "5+3*t",
  a: 0,
  b: 5,
  capacidad: 60,
  forma: "la que escribas",
  porque:
    "Escribe tu propia q(t) en litros por minuto usando t (minutos): por ejemplo 4+2*t, 15*exp(-t/4) o 8+6*sin(t). Puedes usar sin, cos, exp, log, sqrt y abs.",
  f: null,
};

export const porId = (id) => [...ESCENARIOS, ESCENARIO_PROPIO].find((e) => e.id === id);
