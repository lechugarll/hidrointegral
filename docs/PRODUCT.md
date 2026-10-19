# Product

## Register

product

## Users

Principalmente el grupo de Cálculo II y su público en la exposición final: el profesor y los compañeros, viendo la página proyectada en pantalla grande y siguiendo al expositor. Secundariamente, estudiantes que la abren después para entender qué es el área bajo la curva. Nadie llega con conocimientos de hidráulica; todos conocen el concepto de integral a nivel de curso.

Trabajo a realizar: entender de un vistazo que **integrar un caudal da el agua acumulada**, ver que el cálculo coincide con lo que pasa físicamente, y poder cambiar los datos en vivo durante la exposición.

## Product Purpose

HidroIntegral aplica integrales definidas a dos problemas de agua: el volumen que se acumula en un tanque cuando el caudal cambia con el tiempo, y el caudal que transporta una tubería según su perfil de velocidades. Existe para que el área bajo la curva deje de ser abstracta: cada cálculo se ve como una escena física (un tanque que se llena, agua que fluye) sincronizada con la gráfica. Éxito: alguien que no sabía por qué se integra un caudal lo explica con sus palabras al terminar.

## Brand Personality

Explicativa, rigurosa, serena. Una explicación visual en la línea de Distill o de las explicaciones interactivas de Bret Victor: el texto bien escrito va acompañado de gráficos animados que se mueven mientras lees, y cada afirmación se puede comprobar manipulando algo. Voz directa, en español, sin jerga innecesaria; seria como trabajo universitario pero nunca árida.

## Anti-references

- El dashboard SaaS genérico: filas de tarjetas iguales con un número grande, una etiqueta pequeña y degradados.
- Lo infantil o caricaturesco.
- Pantallas dominadas por párrafos antes de ver algo moverse: lo visual y manipulable va primero, el texto lo acompaña.

## Design Principles

1. **Primero lo que se mueve, luego lo que se explica.** Cada sección abre con la escena o la gráfica interactiva; el texto la acompaña y no la precede.
2. **Todo lo calculado tiene un cuerpo físico.** Una cifra sin su escena (tanque, tubería, área sombreada) es una cifra sin sentido para esta audiencia.
3. **Un solo cursor manda.** El tiempo (o el radio) es el hilo: al moverlo, la gráfica, el área, la escena 3D y las lecturas cambian a la vez.
4. **Explicar el porqué, no solo el cómo.** Por qué el caudal cambia, por qué se integra, para qué sirve: respondido en la propia página con ejemplos reales.
5. **Legible desde el fondo del aula.** Tipografía grande, contraste alto y pocos elementos por pantalla; pensada para proyector.

## Accessibility & Inclusion

WCAG 2.1 AA como mínimo: contraste ≥ 4.5:1, foco visible, controles operables con teclado (incluida la escena 3D), etiquetas asociadas a cada campo, y alternativa textual en gráficas y escenas. Respetar `prefers-reduced-motion` (las animaciones arrancan en pausa). No codificar información solo con color: la velocidad o el nivel también se leen en cifras.
