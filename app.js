'use strict';

/* =====================================================================
   INVENTARIO DESDE EL PISO — contenido + motor

   1. Contenido  (aquí se agregan lecciones; el motor no se toca)
   2. Utilidades
   3. Estado y progreso
   4. Preguntas
   5. Widgets (gráficos)
   6. Pantallas
   7. Voz
   8. Menú
   9. Validación del hilo
   10. Arranque
   ===================================================================== */


/* =====================================================================
   1. CONTENIDO
   ===================================================================== */

/* Glosario: cada palabra técnica se define UNA sola vez, con un bloque
   {t:'def', k:'clave'} en la pantalla donde aparece por primera vez.
   "re" es lo que el validador busca para saber si una pantalla usa la
   palabra antes de haberla definido. Las palabras comunes no llevan "re". */
const GLOSARIO = {
  inventario: {
    palabra: 'Inventario', re: /\binventario\b/i,
    x: 'Todo lo que el almacén tiene guardado, contado y anotado. Si no está contado y anotado, no es inventario: es un cuento.'
  },
  producto: {
    palabra: 'Producto <small>(o artículo)</small>',
    x: 'Cada cosa distinta que guarda el almacén. Un jugo, un aceite, una caja de guantes.'
  },
  sku: {
    palabra: 'SKU <small>(se dice “es-ka-iu”)</small>', re: /\bSKU\b/,
    x: 'El código único de un producto, con su tamaño y su empaque. JUG-NAR-1L, el que viste en la hoja y en la pantalla, es el SKU del jugo de naranja de 1 litro. Si cambia algo que el cliente nota, es otro SKU.'
  },
  unidadMedida: {
    palabra: 'Unidad de medida', re: /unidades? de medida/i,
    x: 'La forma en que cuentas algo: por unidad, por paquete, por caja o por paleta.'
  },
  unidad: {
    palabra: 'Unidad',
    x: 'Una sola botella de jugo. Es la medida más chiquita, y es en la que cuenta el sistema.'
  },
  paquete: {
    palabra: 'Paquete',
    x: 'Un grupo de unidades amarradas con plástico. En este jugo, 6 botellas. Son los que viste dentro de la caja.'
  },
  caja: {
    palabra: 'Caja',
    x: 'La caja de cartón que arma el proveedor, y en la que cuenta el chofer. En este jugo trae 4 paquetes.'
  },
  paleta: {
    palabra: 'Paleta', re: /\bpaletas?\b/i,
    x: 'Cada torre de cajas que bajó del camión. Las cajas se apilan sobre una base de madera para moverlas con el montacargas (la máquina con dos uñas que levanta paletas). Aquí, una paleta completa trae 5 capas de 8 cajas: 40 cajas.'
  },
  factor: {
    palabra: 'Factor de conversión', re: /\bfactor\b/i,
    x: 'Cuántas unidades trae una medida más grande. En este jugo, una caja trae 24 unidades (4 paquetes × 6). El factor de la caja es 24: el número por el que acabas de multiplicar.'
  },
  recepcion: {
    palabra: 'Recepción', re: /\brecepci[oó]n\b/i,
    x: 'Todo lo que haces desde que llega el camión hasta que firmas: contar, revisar y anotar. Es lo que acabas de hacer.'
  },
  lote: {
    palabra: 'Lote', re: /\blotes?\b/i,
    x: 'El grupo de producto que se fabricó junto, con un mismo número. Ese número va en la etiqueta. Si después hay un problema con el jugo, el lote dice de qué tanda salió. Aquí, el 4417.'
  },
  vencimiento: {
    palabra: 'Vencimiento', re: /\bvencimiento\b/i,
    x: 'La fecha en que el producto deja de servir. Va en la etiqueta, junto al lote. Pasada esa fecha, no se puede vender. Aquí, 10/2027: octubre de 2027.'
  },
  ubicacion: {
    palabra: 'Ubicación', re: /\bubicaci[oó]n(es)?\b/i,
    x: 'El código que dice exactamente dónde está guardada una paleta: el pasillo y el número del espacio. Por ejemplo, B-01 es el pasillo B, espacio 1.'
  },
  fefo: {
    palabra: 'FEFO <small>(se dice “fefo”)</small>', re: /\bFEFO\b/,
    x: 'Primero que vence, primero que sale. Se saca primero lo que se vence antes, sin importar cuándo llegó. Es lo que acabas de hacer en el pasillo.'
  },
  fifo: {
    palabra: 'FIFO <small>(se dice “fifo”)</small>', re: /\bFIFO\b/,
    x: 'Primero que entra, primero que sale. Se saca primero lo que llegó antes. Sirve cuando todo dura igual, pero no mira la fecha de vencimiento.'
  },
  despacho: {
    palabra: 'Despacho', re: /\bdespach(o|os|ar|ado)\b/i,
    x: 'La salida de mercancía hacia el cliente: sacarla de su espacio, revisarla, anotarla y entregarla. Es lo que haces con cada pedido.'
  },
  kardex: {
    palabra: 'Kárdex', re: /\bk[aá]rdex\b/i,
    x: 'El registro de todo lo que entra y sale de un producto, línea por línea, con lo que queda después de cada movimiento. Es la tabla que acabas de llenar.'
  },
  saldo: {
    palabra: 'Saldo', re: /\bsaldo\b/i,
    x: 'Lo que queda después de cada movimiento. Es la última columna del kárdex. Se calcula así: el saldo anterior, más lo que entra, menos lo que sale.'
  }
};

/* ---------------------------------------------------------------------
   LECCIÓN 1 — Qué estás contando
   Producto del hilo: JUG-NAR-1L (jugo de naranja, 1 litro)
   Caja = 4 paquetes x 6 unidades = 24 unidades. Paleta = 40 cajas.
   Camión de hoy = 10 paletas = 400 cajas = 9,600 unidades.
   Estos números se repiten en las 5 lecciones. No los cambies a la ligera.

   Orden: primero se hace, después se nombra.
   La lección 1 NO usa la palabra "paleta" (sale en la lección 2).
   --------------------------------------------------------------------- */
const L1 = {
  id: 'm1l1', hora: '6:30 a. m.', titulo: 'Qué estás contando', minutos: 6,
  pantallas: [

    /* 1 — EL PROBLEMA */
    {
      etiqueta: 'El problema', tono: 'azul', titulo: 'Primer día, 6:30 de la mañana',
      bloques: [
        { t: 'p', x: 'Eres auxiliar nuevo. Don Ramón, el supervisor, te pone una hoja en la mano: <b>“JUG-NAR-1L, jugo de naranja: 400 cajas.”</b> JUG-NAR-1L es el código de ese jugo. Todavía no importa saber más.' },
        { t: 'p', x: 'Abre el <b>sistema</b> (el programa de la computadora donde se anota todo lo que hay en el almacén). La pantalla dice: <b>“JUG-NAR-1L. Esperado: 9,600 unidades.”</b> Unidad, aquí, quiere decir una botella.' },
        { t: 'p', x: 'Suena la radio. Es el chofer, desde la garita: <b>“Llevo 400 cajas. Ábranme, que tengo prisa.”</b>' },
        { t: 'dialogo', quien: 'Don Ramón', x: 'Dime tú. ¿Quién está equivocado, el chofer o el sistema?' }
      ],
      items: [{
        id: 'm1l1.p1', tipo: 'opcion', corto: '400 cajas contra 9,600 unidades',
        texto: 'Don Ramón te está esperando. ¿Qué le contestas?',
        opciones: [
          { x: 'El sistema. 9,600 es mucho más que 400.', tono: 'mal',
            porque: 'Tranquilo, que esa es la confusión más común del primer día. Fíjate bien: 400 son cajas y 9,600 son botellas. Son dos medidas distintas. Es como comparar libras con onzas: no puedes decir cuál es más hasta ponerlas en la misma medida. Por eso todavía no puedes decir que el sistema se equivocó.' },
          { x: 'El chofer. Tiene que traer 9,600.', tono: 'mal',
            porque: 'Ojo aquí. El 9,600 de la pantalla habla de botellas, no de cajas. Si le pides 9,600 cajas al chofer, le estás cambiando la medida sin darte cuenta. Y todavía te falta un dato clave: cuántas botellas trae cada caja. Sin ese dato, no se le puede echar la culpa a nadie.' },
          { x: 'Puede que ninguno esté equivocado. Hablan en medidas distintas.', tono: 'ok',
            porque: '¡Eso es, bien pensado! El chofer habla en cajas y el sistema habla en botellas. Los dos pueden tener razón al mismo tiempo. Lo único que falta es saber cuántas botellas trae cada caja. Con ese dato se hace la cuenta y se sale de dudas. Ahora vas a abrir una caja para verlo con tus propios ojos.' },
          { x: 'Hay que llamar al proveedor.', tono: 'parcial',
            porque: 'No está mal pensado, pero vas muy rápido. Llamar al proveedor es el último paso, no el primero. Primero abres una caja y cuentas las botellas. Eso toma un minuto. Si después de contar el número no cuadra, ahí sí llamas, y llamas con el dato en la mano.' }
        ]
      }]
    },

    /* 2 — EL WIDGET: hay que tocarlo para seguir */
    {
      etiqueta: 'Pruébalo', tono: 'azul', titulo: 'Abre la caja de la hoja',
      bloques: [
        { t: 'p', x: 'Es el mismo jugo de la hoja, el JUG-NAR-1L. Don Ramón abre una caja de muestra para ver por qué el chofer dice 400 y la pantalla dice 9,600.' },
        { t: 'p', x: 'Adentro hay <b>4 paquetes</b>. Cada paquete trae <b>6 botellas</b>. O sea, 24 botellas por caja. Caja, empaque y embalaje, aquí, son la misma cosa: lo que envuelve las botellas.' },
        { t: 'dialogo', quien: 'Don Ramón', x: 'Mueve las cajas. El chofer cuenta cajas. La pantalla cuenta botellas. Con 4 paquetes de 6, cada caja son 24 botellas.' },
        { t: 'widget', id: 'unidades', exige: ['mover'] }
      ]
    },

    /* 3 — LA CUENTA LA HACE EL ALUMNO */
    {
      etiqueta: 'Haz la cuenta', tono: 'azul', titulo: 'La cuenta es tuya',
      bloques: [
        { t: 'dialogo', quien: 'Don Ramón', x: 'Cada caja trae 24 unidades. La hoja dice 400 cajas. Haz la cuenta tú.' }
      ],
      items: [{
        id: 'm1l1.c1', tipo: 'numero', corto: '400 cajas a unidades',
        texto: 'Cada caja trae 24 botellas y la hoja dice 400 cajas. ¿Cuántas <b>botellas</b> son en total?',
        campos: [{ etiqueta: 'Unidades', respuesta: 9600 }],
        porque: 'La cuenta es 400 × 24 = <b>9,600 botellas</b>. ¡Justo lo que decía el sistema! O sea, nadie estaba equivocado. El chofer contaba cajas y el sistema contaba botellas. Lo que faltaba era ponerlos a hablar en la misma medida.<br><b>Consejo de piso:</b> cuando dos números no cuadran, antes de buscar culpables, pregúntate si están en la misma medida.',
        pistas: [
          { si: v => v[0] === 1600, x: 'Vas bien, pero te quedaste a mitad de camino. 400 × 4 te da paquetes, no botellas. Recuerda que cada paquete trae 6 botellas. Te falta ese paso.' },
          { si: v => v[0] === 2400, x: 'Casi. Multiplicaste solo por 6, que son las botellas de un paquete. Pero cada caja trae 4 paquetes. Multiplica por 24, que es 4 × 6.' },
          { si: v => v[0] === 400, x: 'Ese número son las cajas, el dato de la hoja. Lo que te piden son las botellas. Multiplica las 400 cajas por las 24 botellas que trae cada una.' },
          { si: v => v[0] === 424, x: 'Sumaste 400 + 24. Aquí no se suma: cada una de las 400 cajas trae 24 botellas. Cuando algo se repite muchas veces, se multiplica.' }
        ]
      }]
    },

    /* 4 — RECIÉN AQUÍ LOS NOMBRES (solo los que ya usó) */
    {
      etiqueta: 'Ponle nombre', tono: 'azul', titulo: 'Ponle nombre a lo que ya usaste',
      bloques: [
        { t: 'p', x: 'Ya moviste cajas y ya hiciste la cuenta. Ahora ponle nombre a lo que usaste, para que Don Ramón y tú hablen igual.' },
        { t: 'def', k: 'unidad' },
        { t: 'def', k: 'paquete' },
        { t: 'def', k: 'caja' },
        { t: 'def', k: 'factor' }
      ]
    },

    /* 5 — EL CÓDIGO (SKU) */
    {
      etiqueta: 'Ponle nombre', tono: 'azul', titulo: 'Y el código del jugo',
      bloques: [
        { t: 'p', x: 'En la hoja y en la pantalla, el jugo venía con un código: <b>JUG-NAR-1L</b>.' },
        { t: 'def', k: 'sku' },
        { t: 'widget', id: 'skuCards' },
        { t: 'p', x: 'Los tres son jugo y los tres son SKU distintos: cambia el tamaño o cambia el sabor.' }
      ],
      items: [{
        id: 'm1l1.q1', tipo: 'opcion', corto: 'SKU: jugo de 1 L contra 1.5 L',
        texto: 'Llega jugo de naranja, pero en botella de 1.5 litros. El proveedor te dice: “Es el mismo jugo.” ¿Es el mismo SKU que JUG-NAR-1L?',
        opciones: [
          { x: 'Sí. Es jugo de naranja, es lo mismo.', tono: 'mal',
            porque: 'Se entiende por qué lo piensas, porque el sabor es el mismo. Pero cambió el tamaño de la botella, y eso el cliente lo nota y lo paga distinto. Si lo mezclas con el de 1 litro, el sistema va a contar botellas diferentes como si fueran iguales. Después nadie entiende por qué la cuenta no cuadra.' },
          { x: 'No. Cambió el tamaño, es otro SKU.', tono: 'ok',
            porque: '¡Exacto! Cambió el tamaño, así que es otro producto con su propio código. La regla es sencilla: si cambia algo que el cliente nota, como el tamaño, el sabor o el empaque, cambia el SKU. Ese jugo se recibe y se guarda aparte.<br><b>Consejo de piso:</b> guíate por el código, no por el nombre. Dos productos pueden llamarse casi igual, pero el código nunca se repite.' },
          { x: 'Depende de quién sea el proveedor.', tono: 'mal',
            porque: 'No depende de quién lo venda. El código lo define el producto mismo: su sabor, su tamaño y su empaque. Un mismo proveedor puede traerte diez productos distintos, y cada uno tiene su propio código.' },
          { x: 'Le pregunto al chofer.', tono: 'mal',
            porque: 'El chofer hace bien su trabajo, que es transportar la mercancía. Pero él no maneja la lista de códigos del almacén. Diga lo que diga, el código no cambia. Lo que manda es la etiqueta de la botella y el código que trae.' }
        ]
      }]
    },

    /* 6 — TRAMPA 1: el número sin medida */
    {
      etiqueta: 'Trampa 1 de 3', tono: 'rojo', titulo: '“Quedan 50”',
      bloques: [
        { t: 'p', x: 'Media mañana. Un compañero pasa con prisa y suelta: <b>“Quedan 50 de jugo.”</b>' },
        { t: 'p', x: 'Así se habla en el piso: el número y nada más.' }
      ],
      items: [{
        id: 'm1l1.q3', tipo: 'opcion', corto: '“Quedan 50” sin medida',
        texto: 'Tu compañero dijo “quedan 50 de jugo”, pero no dijo si son cajas, paquetes o botellas. ¿Qué haces antes de anotar?',
        opciones: [
          { x: 'Anoto 50 unidades.', tono: 'mal',
            porque: 'Ahí está la trampa. Mira lo que puede pasar: si eran 50 cajas, en realidad son 50 × 24 = 1,200 botellas. Si anotas 50, el sistema queda 1,150 botellas por debajo, porque 1,200 − 50 = 1,150. Nadie se robó nada. Simplemente nadie dijo la medida. Por eso no se anota nada hasta preguntar.' },
          { x: 'Pregunto: “¿50 qué? ¿Cajas, paquetes o unidades?”', tono: 'ok',
            porque: '¡Así mismo! Una pregunta de dos segundos te ahorra una tarde entera buscando botellas que nunca se perdieron.<br><b>Consejo de piso:</b> un número sin medida no es un dato. Pregunta “¿50 qué?” aunque parezca obvio. Y pregúntalo con respeto aunque te lo diga el supervisor: él también prefiere que preguntes a que anotes mal.' },
          { x: 'Anoto 50 cajas.', tono: 'mal',
            porque: 'Puede que le aciertes, pero estás adivinando. Y cuando se adivina en el almacén, eso después aparece como una diferencia en el conteo. Si en realidad eran paquetes o botellas, tu número queda muy por encima de lo que hay. No te la juegues: pregunta.' },
          { x: 'Voy y cuento yo mismo.', tono: 'parcial',
            porque: 'No está mal, y a veces toca hacerlo. Pero hay un camino más rápido: preguntarle a tu compañero, que está ahí mismo. Pregunta primero. Si la respuesta no te convence, entonces sí vas y cuentas.' }
        ]
      }]
    },

    /* 7 — TRAMPA 2: el empaque cambió */
    {
      etiqueta: 'Trampa 2 de 3', tono: 'rojo', titulo: '“La caja ahora trae 12”',
      bloques: [
        { t: 'p', x: 'Más tarde, Don Ramón abre una caja y se queda mirándola: <b>trae 12 botellas, no 24.</b> El proveedor cambió el empaque y no avisó.' },
        { t: 'p', x: 'El sistema sigue creyendo que cada caja trae 24. Llegan 400 cajas y alguien las recibe por lo que dice el sistema.' }
      ],
      items: [{
        id: 'm1l1.q2', tipo: 'numero', corto: 'La caja trae 12 y el sistema sigue en 24',
        texto: 'Llegan 400 cajas. El sistema sigue creyendo que cada caja trae 24 botellas, pero Don Ramón acaba de contar 12 en una caja de verdad. Haz las dos cuentas: ¿cuántas botellas anota el sistema y cuántas entran de verdad?',
        campos: [{ etiqueta: 'El sistema anota', respuesta: 9600 }, { etiqueta: 'Entran de verdad', respuesta: 4800 }],
        porque: 'El sistema multiplica con el dato viejo: 400 × 24 = <b>9,600 botellas</b>. Pero en el piso cada caja trae 12, así que entran 400 × 12 = <b>4,800 botellas</b>. La diferencia es 9,600 − 4,800 = 4,800 botellas que están en el papel pero no en el almacén. Nadie se robó nada: el proveedor cambió el empaque y nadie lo actualizó en el sistema.<br><b>Consejo de piso:</b> manda la caja, no la pantalla. Antes de recibir, abre una caja y cuenta. Si el empaque cambió, avísale a tu supervisor para que corrijan el sistema.',
        pistas: [
          { si: v => v[0] === 4800 && v[1] === 9600, x: 'Vas bien, pero los pusiste al revés. El sistema multiplica por 24, así que su número es el más grande. En el piso se multiplica por 12, así que entra menos. Cambia los dos números de casilla.' },
          { si: v => v[0] === 400 || v[1] === 400, x: 'El 400 son las cajas. Aquí te piden botellas. Haz dos cuentas: 400 × 24 para el sistema, y 400 × 12 para lo que entra de verdad.' },
          { si: v => v[0] === 9600 && v[1] === 9600, x: 'La primera está bien: 9,600 es lo que anota el sistema. Pero la segunda no. La caja de verdad trae 12 botellas, no 24. Haz 400 × 12.' },
          { si: v => v[1] === 9600, x: 'En la segunda casilla pusiste 9,600, que es lo que espera el sistema. Lo que entra de verdad se calcula con las 12 botellas que contó Don Ramón: 400 × 12.' }
        ]
      }]
    },

    /* 8 — TRAMPA 3: medidas mezcladas */
    {
      etiqueta: 'Trampa 3 de 3', tono: 'rojo', titulo: '“3 cajas y 2 paquetes”',
      bloques: [
        { t: 'p', x: 'Don Ramón te manda a armar un pedido. El cliente pide <b>3 cajas y 2 paquetes sueltos</b>.' },
        { t: 'cifras', filas: [
          { k: '1 paquete', v: '6 unidades' },
          { k: '1 caja', v: '24 unidades' }
        ] }
      ],
      items: [{
        id: 'm1l1.n3', tipo: 'numero', corto: '3 cajas y 2 paquetes sueltos',
        texto: 'Mira la tabla de arriba: 1 caja son 24 botellas y 1 paquete son 6. El cliente pide 3 cajas y 2 paquetes sueltos. Ojo: no sumes cajas con paquetes. ¿Cuántas <b>botellas</b> despachas en total?',
        campos: [{ etiqueta: 'Unidades', respuesta: 84 }],
        porque: 'Se hace en tres pasos sencillos. Primero las cajas: 3 × 24 = 72 botellas. Después los paquetes: 2 × 6 = 12 botellas. Y al final se suman: 72 + 12 = <b>84 botellas</b>.<br><b>Consejo de piso:</b> nunca sumes cajas con paquetes, porque son medidas distintas. Pasa todo a botellas, que es la medida más chiquita, y ahí sí sumas sin miedo.',
        pistas: [
          { si: v => v[0] === 5, x: 'Sumaste 3 + 2, como si cajas y paquetes fueran lo mismo. Esa es justo la trampa. Pasa primero cada cosa a botellas y después sumas.' },
          { si: v => v[0] === 72, x: 'Vas bien con las cajas: 3 × 24 = 72. Pero se te quedaron los 2 paquetes sueltos. Cada paquete trae 6 botellas. Súmalos.' },
          { si: v => v[0] === 78, x: 'Casi. Sumaste un solo paquete. El cliente pidió 2 paquetes: 2 × 6 = 12 botellas, no 6.' },
          { si: v => v[0] === 12, x: 'Esas 12 son solo las botellas de los 2 paquetes. Te faltan las 3 cajas: 3 × 24.' }
        ]
      }]
    },

    /* 9 — LA REGLA + GANCHO (solo texto) */
    {
      etiqueta: 'Para que no se te olvide', tono: 'verde', titulo: 'La regla de esta lección',
      bloques: [
        { t: 'regla', x: 'Un número sin medida no es un dato.' },
        { t: 'formula', x: 'cajas × factor = unidades' },
        { t: 'p', x: 'Y el factor lo manda la caja, no la pantalla.' },
        { t: 'gancho', hora: '7:40 a. m.', titulo: 'Lo que viene: el camión',
          x: 'Don Ramón mira el reloj: “Ya sabes qué estamos contando. Ven, que el camión está entrando.” Son 400 cajas. El chofer ya está tocando la bocina. Ahí se cuenta y se firma. Y una firma no se devuelve.' }
      ]
    }
  ]
};

/* ---------------------------------------------------------------------
   LECCIÓN 2 — Recepción (7:40 a. m.)
   Mismo producto y mismos números. El camión trae 10 paletas.
   Cada paleta completa = 5 capas de 8 cajas = 40 cajas.
   SEMBRADO PARA LAS LECCIONES 3 A 5 (no cambiar sin revisar esas lecciones):
   - La paleta 7 trae 38 cajas (la última capa viene con 6): llegan 398 cajas,
     no 400. Faltan 2 cajas = 48 unidades.
   - La paleta 10 es de otro lote: 4392, vence 08/2027. Las demás: 4417, 10/2027.
     Se vence antes y llegó de última (para la lección 3).
   - La respuesta de 'm1l2.f1' guarda si el alumno firmó 400 sin contar.
     (E.items['m1l2.f1'].primero === 'fallo') -> el faltante vuelve a las 5:30.
   La hoja del proveedor se llama "la hoja", igual que en la lección 1.
   --------------------------------------------------------------------- */
const L2 = {
  id: 'm1l2', hora: '7:40 a. m.', titulo: 'Recepción', minutos: 6,
  pantallas: [

    /* 1 — EL PROBLEMA */
    {
      etiqueta: 'El problema', tono: 'azul', titulo: 'Son las 7:40 y el camión ya está en el muelle',
      bloques: [
        { t: 'p', x: 'Es el camión del jugo, el que esperabas desde las 6:30. Don Ramón está metido en otra cosa y te manda a ti.' },
        { t: 'p', x: 'El chofer baja con la hoja del proveedor: <b>“JUG-NAR-1L, 400 cajas.”</b> Te la pone enfrente, con el bolígrafo encima.' },
        { t: 'dialogo', quien: 'Chofer', x: 'Firma ahí y me voy, que tengo otra entrega y voy tarde.' }
      ],
      items: [{
        id: 'm1l2.p1', tipo: 'opcion', corto: 'El chofer con prisa quiere que firmes',
        texto: 'El chofer está apurado y quiere que firmes ya. ¿Qué haces?',
        opciones: [
          { x: 'Firmo. La hoja dice 400 y el chofer es de confianza.', tono: 'mal',
            porque: 'La confianza es buena, pero aquí no alcanza. La hoja dice lo que el proveedor mandó, no lo que de verdad bajó del camión. En el camino pueden pasar muchas cosas. Cuando firmas, estás diciendo que llegó todo completo. Y desde ese momento, si falta algo, la responsabilidad es tuya.' },
          { x: 'Cuento lo que bajó del camión antes de firmar, aunque el chofer proteste.', tono: 'ok',
            porque: '¡Así se hace! Tu firma quiere decir “esto llegó y ahora es responsabilidad mía”. Por eso, antes de firmar, tienes que saber qué es “esto”. Que el chofer esté apurado se entiende, pero es una razón para contar con más atención, no con menos. Le puedes decir con respeto: “Dame un chance, que lo cuento rápido y te firmo.”' },
          { x: 'Firmo y cuento después.', tono: 'mal',
            porque: 'Ese orden no funciona. Después de firmar, el chofer se va y la hoja dice que llegó todo. Si al contar te falta algo, ya no hay a quién reclamarle. Te quedas con el problema en las manos y sin pruebas.' },
          { x: 'Le digo que espere a Don Ramón.', tono: 'parcial',
            porque: 'Avisarle a Don Ramón no está mal. Pero contar es parte de tu trabajo y no necesitas esperar a nadie para empezar. Cuenta tú. Si algo no cuadra, ahí sí lo llamas y le llevas el dato exacto.' }
        ]
      }]
    },

    /* 2 — CUENTA EL CAMIÓN (hay que tocar las 10) */
    {
      etiqueta: 'Cuenta el camión', tono: 'azul', titulo: 'Toca cada paleta',
      bloques: [
        { t: 'p', x: 'El jugo viene en torres de cajas armadas sobre una base de madera. Cada torre tiene nombre:' },
        { t: 'def', k: 'paleta' },
        { t: 'p', x: 'Son 10 paletas. Cuéntalas por capas: cada capa trae 8 cajas y una paleta completa trae 5 capas. Toca las 10 para ver cuántas cajas trae cada una.' },
        { t: 'widget', id: 'camion', exige: ['contar'] }
      ]
    },

    /* 3 — LA CUENTA LA HACE EL ALUMNO */
    {
      etiqueta: 'Haz la cuenta', tono: 'azul', titulo: 'Lo que no llegó',
      bloques: [
        { t: 'p', x: 'Contaste 398 cajas. La hoja decía 400. Faltan 2 cajas.' },
        { t: 'p', x: 'Acuérdate: cada caja trae 24 unidades.' }
      ],
      items: [{
        id: 'm1l2.c1', tipo: 'numero', corto: '2 cajas que faltan, en unidades',
        texto: 'Contaste 398 cajas y la hoja dice 400. Faltan 2 cajas, y cada caja trae 24 botellas. ¿Cuántas <b>botellas</b> faltan?',
        campos: [{ etiqueta: 'Unidades', respuesta: 48 }],
        porque: 'La cuenta es 2 × 24 = <b>48 botellas</b>. Parece poquito, pero son 48 botellas que la hoja dice que llegaron y no llegaron. Si no se anota ahora, más tarde alguien las va a buscar en el almacén, y no van a aparecer.',
        pistas: [
          { si: v => v[0] === 2, x: 'El 2 son las cajas que faltan. Aquí te piden botellas. Multiplica esas 2 cajas por las 24 botellas que trae cada una.' },
          { si: v => v[0] === 8, x: 'Multiplicaste por 4 y te quedaste en paquetes. Recuerda que cada paquete trae 6 botellas. Multiplica por 24, que son las botellas de una caja.' },
          { si: v => v[0] === 12, x: 'Multiplicaste por 6, que son las botellas de un solo paquete. Pero cada caja trae 4 paquetes. Multiplica por 24.' },
          { si: v => v[0] === 9552, x: 'Buena cuenta, pero responde otra pregunta. 398 × 24 = 9,552 es lo que sí llegó. Aquí te piden lo que falta: 2 cajas × 24.' }
        ]
      }]
    },

    /* 4 — LA FIRMA (aquí se siembra el error que vuelve a las 5:30) */
    {
      etiqueta: 'La firma', tono: 'azul', titulo: 'Con qué firmas',
      bloques: [
        { t: 'dialogo', quien: 'Chofer', x: '¡Ya! Son 400, firma que me están esperando.' },
        { t: 'p', x: 'Tú sabes que llegaron 398.' }
      ],
      items: [{
        id: 'm1l2.f1', tipo: 'opcion', corto: 'Firmar 400 cuando llegaron 398',
        texto: 'El chofer insiste en que son 400, pero tú contaste 398. ¿Cómo firmas?',
        opciones: [
          { x: 'Firmo 400, como dice la hoja. Son solo 2 cajas.', tono: 'mal',
            porque: 'Puede parecer poco, pero mira la cuenta: 2 cajas × 24 = 48 botellas. Si firmas 400, tu firma dice que esas 48 botellas llegaron, y no llegaron. Ese faltante se queda escondido en el papel. Y va a salir a la luz a las 5:30, cuando toque contar lo que hay y no cuadre.' },
          { x: 'Anoto en la hoja “llegaron 398, faltan 2” y firmo debajo de eso.', tono: 'ok',
            porque: '¡Muy bien! Tu firma queda sobre lo que de verdad recibiste. El faltante queda por escrito, y con el chofer todavía presente. Si el proveedor se equivocó, la empresa le reclama con la hoja en la mano.<br><b>Consejo de piso:</b> lo que no está escrito en la hoja, no pasó. Escríbelo antes de firmar y con el chofer delante. Cuando el camión se va, ya no hay quien lo confirme.' },
          { x: 'Firmo 400 y después le escribo un mensaje al proveedor.', tono: 'mal',
            porque: 'La intención es buena, pero un mensaje después no tiene el mismo peso. Lo que vale es la hoja firmada, y esa hoja dice 400. Cuando el proveedor la revise, va a decir que tú firmaste completo. Y tendrá razón.' },
          { x: 'No firmo y mando el camión de vuelta con todo.', tono: 'parcial',
            porque: 'Eso es irse al otro extremo. Devolver 398 cajas buenas por 2 que faltan le hace daño a la operación: el almacén se queda sin jugo. Lo normal es recibir lo que llegó y dejar escrito lo que faltó. Si tu empresa tiene otra regla para estos casos, Don Ramón te la explica.' }
        ]
      }]
    },

    /* 5 — LOS NOMBRES (solo los que ya usó) */
    {
      etiqueta: 'Ponle nombre', tono: 'azul', titulo: 'Ponle nombre a lo que hiciste',
      bloques: [
        { t: 'p', x: 'Contar, revisar y firmar. Eso que acabas de hacer tiene nombre:' },
        { t: 'def', k: 'recepcion' },
        { t: 'p', x: 'Y cada paleta traía una etiqueta con dos datos: <b>4417</b> y <b>10/2027</b>. Esos datos también tienen nombre:' },
        { t: 'def', k: 'lote' },
        { t: 'def', k: 'vencimiento' }
      ]
    },

    /* 6 — TRAMPA 1: el lote que no coincide */
    {
      etiqueta: 'Trampa 1 de 2', tono: 'rojo', titulo: '“Es el mismo jugo”',
      bloques: [
        { t: 'p', x: 'Vuelves a mirar las etiquetas. La hoja del proveedor, en letra chiquita, decía: <b>lote 4417, vencimiento 10/2027.</b>' },
        { t: 'p', x: 'Las paletas 1 a 9 dicen eso mismo. La paleta 10 dice <b>lote 4392, vencimiento 08/2027</b>: se vence dos meses antes.' }
      ],
      items: [{
        id: 'm1l2.q1', tipo: 'opcion', corto: 'Paleta 10 con otro lote y otro vencimiento',
        texto: 'La paleta 10 trae otro lote y se vence dos meses antes que las demás. ¿Qué haces?',
        opciones: [
          { x: 'Lo dejo así. Es el mismo jugo.', tono: 'mal',
            porque: 'Es el mismo jugo y el mismo SKU, pero es otro lote, y se vence dos meses antes. Si lo mezclas con los demás, nadie va a saber cuál sacar primero. Esas cajas se pueden quedar en el estante hasta vencerse. Y eso es dinero que se pierde.' },
          { x: 'Anoto lo que dice la etiqueta de esa paleta y la dejo separada de las demás.', tono: 'ok',
            porque: '¡Excelente ojo! Aquí manda la etiqueta del producto, no la hoja. Son dos lotes distintos, así que se anotan como dos.<br><b>Consejo de piso:</b> revisa la etiqueta de cada paleta, no solo la de la primera. Lo que se vence primero tiene que estar a la vista para que salga primero. En la próxima lección vas a ver por qué es tan importante.' },
          { x: 'Cambio el lote en la hoja para que cuadre.', tono: 'mal',
            porque: 'Eso no se hace. Esa hoja es un documento del proveedor, y tú no la cambias. Lo que te toca es anotar lo que ves, aparte. Cambiarla para que cuadre es esconder el problema, y después nadie va a poder rastrear ese lote.' },
          { x: 'Rechazo esa paleta.', tono: 'parcial',
            porque: 'Puede que toque rechazarla, si tu empresa tiene esa regla. Pero esa decisión no la tomas tú solo. Primero anotas lo que dice la etiqueta, la separas y le consultas a Don Ramón.' }
        ]
      }]
    },

    /* 7 — TRAMPA 2: la caja mojada */
    {
      etiqueta: 'Trampa 2 de 2', tono: 'rojo', titulo: '“Una caja mojada”',
      bloques: [
        { t: 'p', x: 'En la paleta 3, una caja de abajo tiene el cartón mojado y blando. El jugo no se derramó. La caja ya está contada entre las 40.' }
      ],
      items: [{
        id: 'm1l2.q2', tipo: 'opcion', corto: 'Una caja con el cartón mojado',
        texto: 'Hay una caja con el cartón mojado y blando, aunque el jugo no se derramó. ¿Qué haces?',
        opciones: [
          { x: 'La recibo, la anoto en la hoja como “1 caja con cartón mojado” y le tomo una foto antes de que el camión se vaya.', tono: 'ok',
            porque: '¡Perfecto! Así queda constancia de cómo llegó la caja, y con el chofer presente. Si más adelante esa caja da problemas, no va a ser tu palabra contra la del proveedor: tienes la nota y la foto.<br><b>Consejo de piso:</b> una foto con el celular toma cinco segundos y vale más que cualquier explicación después. Tómala antes de que el camión arranque.' },
          { x: 'La recibo y no digo nada. Es una sola caja.', tono: 'mal',
            porque: 'Parece poca cosa, pero es un riesgo. Si después esa caja aparece dañada, nadie va a poder probar que llegó así. Va a parecer que se dañó en tu almacén, y la pérdida la carga tu empresa.' },
          { x: 'La saco a un lado y no la cuento.', tono: 'mal',
            porque: 'Separarla está bien, pero no contarla no. Si no la cuentas, tu conteo te da 397 cajas en vez de 398, y te inventas una diferencia de 24 botellas. Lo dañado también se cuenta. Lo único que cambia es que se anota aparte, como dañado.' },
          { x: 'Le pido al chofer que se la lleve de vuelta.', tono: 'parcial',
            porque: 'Si la caja está mojada pero entera, devolverla o no depende de la regla de tu empresa. Antes de dejar que el chofer se la lleve, anótala en la hoja y consúltalo con Don Ramón.' }
        ]
      }]
    },

    /* 8 — LA REGLA + GANCHO (solo texto) */
    {
      etiqueta: 'Para que no se te olvide', tono: 'verde', titulo: 'La regla de esta lección',
      bloques: [
        { t: 'regla', x: 'Tu firma dice que es tuyo.' },
        { t: 'p', x: 'Primero cuentas. Después anotas. Al final firmas. Y lo que no está escrito en la hoja no pasó.' },
        { t: 'gancho', hora: '9:30 a. m.', titulo: 'Lo que viene: dónde se guarda',
          x: 'Ya terminó la recepción y las 10 paletas están en el muelle. Don Ramón te dice: “Eso no se puede quedar ahí. Hay que decidir dónde va cada paleta.” Y las 2 cajas que no llegaron no se te van a olvidar a las 5:30.' }
      ]
    }
  ]
};

/* ---------------------------------------------------------------------
   LECCIÓN 3 — Dónde se guarda (9:30 a. m.)
   Pasillo B: 15 espacios, B-01 (junto a la puerta de salida) a B-15 (fondo).
   Se saca de la puerta hacia el fondo.
   YA HABÍA: 4 paletas de 40 cajas, lote 4401, vence 09/2027, en B-02 a B-05.
   LLEGA HOY: paletas 1 a 9 (lote 4417, 10/2027) y la 10 (lote 4392, 08/2027).
   Única solución: la paleta 10 va en B-01. Las otras 9, en B-06 a B-15.
   NÚMEROS PARA LA LECCIÓN 4 (kárdex): saldo del pasillo B tras guardar =
   160 cajas viejas + 398 nuevas = 558 cajas = 13,392 unidades.
   SEMBRADO PARA LA LECCIÓN 5:
   - 'm1l3.q2' guarda si el alumno anotó la ubicación de memoria o después.
     (E.items['m1l3.q2'].primero === 'fallo') -> una paleta anotada en el
     lugar equivocado: faltante en un lado y sobrante en otro, a las 5:30.
   - 'm1l2.f1' (lección 2): si firmó 400, el sistema cree 560 y hay 558.
   --------------------------------------------------------------------- */
const L3 = {
  id: 'm1l3', hora: '9:30 a. m.', titulo: 'Dónde se guarda', minutos: 6,
  pantallas: [

    /* 1 — EL PROBLEMA */
    {
      etiqueta: 'El problema', tono: 'azul', titulo: 'Son las 9:30 y hay 10 paletas estorbando',
      bloques: [
        { t: 'p', x: 'La recepción terminó. Las 10 paletas del jugo siguen en el muelle y estorban el paso.' },
        { t: 'p', x: 'Don Ramón te lleva al pasillo B. Tiene 15 espacios, de <b>B-01</b> a <b>B-15</b>. <b>B-01</b> es el que queda más cerca de la puerta de salida y <b>B-15</b> el del fondo. Cuando hay un pedido, se saca desde la puerta hacia el fondo.' },
        { t: 'p', x: 'Hay 4 espacios ocupados, en el medio: jugo que ya estaba, de otro lote, que vence 09/2027.' },
        { t: 'dialogo', quien: 'Don Ramón', x: 'Hay espacio libre de sobra. ¿Cómo decides dónde va cada paleta?' }
      ],
      items: [{
        id: 'm1l3.p1', tipo: 'opcion', corto: 'Cómo decidir dónde va cada paleta',
        texto: 'Don Ramón quiere saber cuál es tu criterio. ¿Qué le contestas?',
        opciones: [
          { x: 'En el primer hueco libre que vea, una tras otra, en el orden en que bajaron del camión.', tono: 'mal',
            porque: 'Es rápido, pero así no controlas qué sale primero. Recuerda que en el pasillo se saca desde la puerta hacia el fondo. Si la paleta que se vence antes termina en el fondo, se queda esperando hasta vencerse. Y ese jugo se pierde.' },
          { x: 'Miro qué se vence primero y lo pongo donde se saque primero.', tono: 'ok',
            porque: '¡Eso es pensar como almacenista! En el pasillo no solo se guarda: se decide en qué orden va a salir todo. Lo que se vence primero va donde se saca primero. Ahora vas a hacerlo con las 10 paletas.' },
          { x: 'Donde me quede más cerca del muelle, para caminar menos.', tono: 'mal',
            porque: 'Querer caminar menos se entiende, pero ese no puede ser el criterio. Si solo piensas en tu comodidad, el jugo que se vence primero se queda atrás. Y cuando lo encuentres, ya puede estar vencido.' },
          { x: 'Le pregunto a Don Ramón dónde va cada una.', tono: 'parcial',
            porque: 'Preguntar nunca está de más. Pero Don Ramón te va a responder con una regla: lo que se vence primero tiene que salir primero. Mejor apréndela ahora, y así las próximas veces decides tú solo.' }
        ]
      }]
    },

    /* 2 — EL PASILLO (hay que guardar las 10 bien para seguir) */
    {
      etiqueta: 'Guarda las paletas', tono: 'azul', titulo: 'Una paleta en cada espacio',
      bloques: [
        { t: 'p', x: 'Toca una paleta del muelle y después un espacio libre del pasillo. Cada paleta y cada espacio ocupado muestra cuándo vence.' },
        { t: 'p', x: 'Recuerda: se saca desde la puerta hacia el fondo. Piensa qué tiene que salir primero.' },
        { t: 'widget', id: 'almacen', exige: ['guardar'] }
      ]
    },

    /* 3 — LA CUENTA LA HACE EL ALUMNO */
    {
      etiqueta: 'Haz la cuenta', tono: 'azul', titulo: 'Cuántas cajas hay en el pasillo',
      bloques: [
        { t: 'p', x: 'Antes de que llegara el camión, el pasillo ya tenía 4 paletas de 40 cajas. Hoy entraron las cajas que tú contaste en la recepción.' }
      ],
      items: [{
        id: 'm1l3.c1', tipo: 'numero', corto: 'Cajas en el pasillo B',
        texto: 'Ya había 4 paletas de 40 cajas, o sea 160 cajas. Hoy entraron las 398 que tú contaste, no las 400 de la hoja. ¿Cuántas <b>cajas</b> hay ahora en el pasillo B?',
        campos: [{ etiqueta: 'Cajas', respuesta: 558 }],
        porque: 'Se suma lo que había más lo que entró: 160 + 398 = <b>558 cajas</b>. Y si lo pasas a botellas: 558 × 24 = 13,392. Ese número, 13,392, es el que vas a ver en el sistema más tarde. No sale de la nada: sale de esta misma cuenta.',
        pistas: [
          { si: v => v[0] === 560, x: 'Usaste las 400 de la hoja. Pero lo que entró de verdad fue lo que tú contaste: 398 cajas. Siempre se suma lo que llegó, no lo que dice el papel.' },
          { si: v => v[0] === 398, x: 'Esas son solo las cajas que entraron hoy. Te faltan las 160 que ya estaban en el pasillo. Súmalas.' },
          { si: v => v[0] === 160, x: 'Esas son solo las cajas que ya estaban. Te falta sumar las 398 que entraron hoy.' }
        ]
      }]
    },

    /* 4 — LOS NOMBRES (solo los que ya usó) */
    {
      etiqueta: 'Ponle nombre', tono: 'azul', titulo: 'Ponle nombre a lo que hiciste',
      bloques: [
        { t: 'p', x: 'Cada espacio del pasillo tiene un código, como B-01. Ese código tiene nombre:' },
        { t: 'def', k: 'ubicacion' },
        { t: 'p', x: 'Y la regla que seguiste, sin que nadie te la dijera: se saca primero lo que se vence antes. Esa regla tiene nombre:' },
        { t: 'def', k: 'fefo' },
        { t: 'p', x: 'Hay otra regla que casi todo el mundo conoce, y que se usa por costumbre:' },
        { t: 'def', k: 'fifo' }
      ]
    },

    /* 5 — TRAMPA 1: el sistema dice FIFO */
    {
      etiqueta: 'Trampa 1 de 2', tono: 'rojo', titulo: '“El sistema dice B-02”',
      bloques: [
        { t: 'p', x: 'Más tarde sale un pedido de 40 cajas de JUG-NAR-1L. El sistema está puesto en FIFO, la regla de sacar lo que llegó primero, y te dice: <b>“Saca la paleta de B-02.”</b>' },
        { t: 'p', x: 'En el pasillo, B-01 se vence en 08/2027 y B-02 en 09/2027. B-01 se vence antes, aunque llegó hoy.' }
      ],
      items: [{
        id: 'm1l3.q1', tipo: 'opcion', corto: 'El sistema dice FIFO y la fecha dice otra cosa',
        texto: 'El sistema te dice que saques de B-02, pero B-01 se vence antes. ¿De cuál sacas?',
        opciones: [
          { x: 'De B-02, como dice el sistema. El sistema sabe.', tono: 'mal',
            porque: 'El sistema es una herramienta, pero aquí está configurado en FIFO: mira cuándo llegó el producto, no cuándo se vence. Si sacas de B-02, la paleta de B-01 se queda esperando. Y como se vence primero, se puede vencer en el estante.' },
          { x: 'De B-01, que se vence primero, y aviso para que corrijan el sistema.', tono: 'ok',
            porque: '¡Bien hecho! Aquí manda la fecha de vencimiento. Si sacas por orden de llegada y lo que llegó después se vence antes, pierdes producto. Y además avisas, para que corrijan el sistema y no siga sugiriendo mal.<br><b>Consejo de piso:</b> un sistema configurado en FIFO no mira la fecha del producto, pero tú sí. Si la pantalla y la etiqueta no coinciden, manda la etiqueta.' },
          { x: 'De B-15, que es la que menos estorba.', tono: 'mal',
            porque: 'Que estorbe menos no es un criterio para sacar mercancía. Además, B-15 está al fondo y es de las que se vencen más tarde. Sacarla primero es justo lo contrario de lo que hay que hacer.' },
          { x: 'Le pregunto a Don Ramón qué hago.', tono: 'parcial',
            porque: 'Si tienes dudas, preguntar está bien. Pero esta ya la sabes: manda la fecha. Lo mejor es avisarle con el dato claro: “El sistema dice B-02, pero B-01 se vence antes. Voy a sacar de B-01.”' }
        ]
      }]
    },

    /* 6 — TRAMPA 2: anotar la ubicación (aquí se siembra el error de las 5:30) */
    {
      etiqueta: 'Trampa 2 de 2', tono: 'rojo', titulo: '“Después la anoto”',
      bloques: [
        { t: 'p', x: 'Dejaste la paleta 10 en B-01. Ahora hay que anotar en el sistema dónde quedó. Vas apurado: ya vienen dos camiones más.' }
      ],
      items: [{
        id: 'm1l3.q2', tipo: 'opcion', corto: 'Anotar la ubicación de la paleta',
        texto: 'Vas apurado y todavía no has anotado dónde dejaste la paleta 10. ¿Cómo la anotas?',
        opciones: [
          { x: 'De memoria, cuando termine con todas las paletas.', tono: 'mal',
            porque: 'La memoria falla, sobre todo cuando hay prisa. Sin darte cuenta, B-01 se convierte en B-10. Y una paleta anotada en el lugar equivocado es una paleta perdida: el sistema la busca donde no está. Eso va a aparecer a las 5:30 como un faltante en un lado y un sobrante en otro.' },
          { x: 'En el momento, leyendo el código del espacio donde la dejé.', tono: 'ok',
            porque: '¡Así mismo! La ubicación se anota en el momento, leyendo el código del espacio, no de memoria. Toma unos segundos y te evita horas de búsqueda.<br><b>Consejo de piso:</b> un sobrante no es ganancia, es un faltante escondido en otro lado. Si algo aparece donde no debía, busca primero el faltante gemelo antes de ajustar nada.' },
          { x: 'Después, cuando tenga un momento tranquilo.', tono: 'mal',
            porque: 'Mientras tanto, la paleta existe, pero para el sistema no está en ningún lado. Si alguien necesita ese jugo para un pedido, no lo va a encontrar. Y en un almacén con trabajo, ese “después” casi nunca llega.' },
          { x: 'Le pego un papel con el número y la anoto luego.', tono: 'parcial',
            porque: 'El papel ayuda, pero sigue siendo anotar después. Un papel se cae, se moja o alguien se lo lleva. Sirve como respaldo, pero lo que cuenta es lo que queda en el sistema en el momento.' }
        ]
      }]
    },

    /* 7 — LA REGLA + GANCHO (solo texto) */
    {
      etiqueta: 'Para que no se te olvide', tono: 'verde', titulo: 'La regla de esta lección',
      bloques: [
        { t: 'regla', x: 'Lo que se vence primero sale primero.' },
        { t: 'p', x: 'Y la ubicación se anota en el momento, con el código a la vista.' },
        { t: 'gancho', hora: '2:00 p. m.', titulo: 'Lo que viene: lo que sale',
          x: 'Son las 2:00 de la tarde. Llega el primer pedido grande del día y Don Ramón te dice: “Ahora sí vas a sacar mercancía. Y todo lo que salga tiene que quedar anotado.” Cada paleta que guardaste tiene que estar donde dice el sistema.' }
      ]
    }
  ]
};

/* ---------------------------------------------------------------------
   LECCIÓN 4 — Despacho y registro (2:00 p. m.)
   El kárdex va en UNIDADES (el sistema cuenta unidades; 1 caja = 24).
   Día de JUG-NAR-1L:
     6:00 a. m.  había        3,840 un (160 cajas)
     7:40 a. m.  entra        9,552 un (398 cajas, lo que se contó)  -> 13,392
     2:10 p. m.  sale pedido 1  960 un (40 cajas, de B-01)          -> 12,432
     3:15 p. m.  sale pedido 2 1,320 un (55 cajas)                  -> 11,112
     4:30 p. m.  sale pedido 3  720 un (30 cajas)                   -> 10,392
   Saldo al cierre del kárdex: 10,392 un = 433 cajas.
   ESTE ES EL NÚMERO QUE LA LECCIÓN 5 COMPARA CON EL CONTEO FÍSICO.
   SEMBRADO PARA LA LECCIÓN 5 (si el alumno falló esa pregunta a la primera):
   - 'm1l4.q1' = 'fallo': salieron 5 cajas (120 un) sin anotar -> el estante
     tiene 120 un menos de lo que dice el kárdex.
   - 'm1l2.f1' = 'fallo': firmó 400 -> el kárdex tiene 48 un de más.
   - 'm1l3.q2' = 'fallo': ubicación anotada de memoria -> una paleta "perdida".
   --------------------------------------------------------------------- */
const L4 = {
  id: 'm1l4', hora: '2:00 p. m.', titulo: 'Despacho y registro', minutos: 7,
  pantallas: [

    /* 1 — EL PROBLEMA */
    {
      etiqueta: 'El problema', tono: 'azul', titulo: 'Son las 2:00 y llega el primer pedido',
      bloques: [
        { t: 'p', x: 'Un cliente se lleva <b>40 cajas</b> de JUG-NAR-1L. Las vas a sacar de B-01: es la paleta que se vence primero, la de 08/2027.' },
        { t: 'p', x: 'El sistema dice que hay <b>13,392 botellas</b>. Ese número no sale de la nada: son las 558 cajas del pasillo × 24.' },
        { t: 'dialogo', quien: 'Don Ramón', x: 'Cuando se lleven esas 40 cajas, ¿cuántas botellas van a quedar? Pasa las cajas a botellas antes de restar.' }
      ],
      items: [{
        id: 'm1l4.p1', tipo: 'numero', corto: '13,392 botellas menos 40 cajas',
        texto: 'En el sistema hay 13,392 botellas. Salen 40 cajas y cada caja trae 24 botellas. ¿Cuántas <b>botellas</b> quedan?',
        campos: [{ etiqueta: 'Botellas que quedan', respuesta: 12432 }],
        porque: 'Son dos pasos. Primero pasas las cajas a botellas: 40 × 24 = 960. Después restas lo que sale: 13,392 − 960 = <b>12,432 botellas</b>.<br><b>Consejo de piso:</b> antes de sumar o restar, pon todo en la misma medida. Botellas con botellas, nunca botellas con cajas.',
        pistas: [
          { si: v => v[0] === 13352, x: 'Restaste 40 directamente. Pero esas 40 son cajas, y 13,392 son botellas. Primero pasa las cajas a botellas: 40 × 24.' },
          { si: v => v[0] === 14352, x: 'Sumaste 960, pero esas botellas están saliendo. Lo que sale se resta: 13,392 − 960.' },
          { si: v => v[0] === 960, x: 'Bien, 960 es lo que sale. Pero te piden lo que queda. Réstalo de las 13,392.' },
          { si: v => v[0] === 13392, x: 'Ese es el número de antes del pedido. Te falta restar lo que salió: las 40 cajas pasadas a botellas.' },
          { si: v => v[0] === 40, x: 'El 40 son las cajas del pedido. Te piden cuántas botellas quedan en el almacén después de sacarlas.' }
        ]
      }]
    },

    /* 2 — LLENA LA TABLA DEL DÍA (hay que anotar los 4 movimientos) */
    {
      etiqueta: 'Llena la tabla', tono: 'azul', titulo: 'Todo lo que se movió hoy',
      bloques: [
        { t: 'p', x: 'Esta es la tabla del jugo. Empieza con lo que había a las 6:00 de la mañana. Cada movimiento del día viene en cajas, y tú lo anotas en <b>unidades</b>: cada caja trae 24.' },
        { t: 'p', x: 'La última columna, <b>Queda</b>, va sumando lo que entra y restando lo que sale.' },
        { t: 'widget', id: 'kardex', exige: ['anotar'] }
      ]
    },

    /* 3 — LA CUENTA LA HACE EL ALUMNO */
    {
      etiqueta: 'Haz la cuenta', tono: 'azul', titulo: 'Cuántas cajas son',
      bloques: [
        { t: 'p', x: 'Al terminar la tabla, quedaron <b>10,392 unidades</b>.' },
        { t: 'p', x: 'A las 5:30 vas a tener que contar lo que hay en el pasillo, y ahí se cuentan cajas, no botellas sueltas.' }
      ],
      items: [{
        id: 'm1l4.c1', tipo: 'numero', corto: '10,392 unidades a cajas',
        texto: 'La tabla cerró en 10,392 botellas. Cada caja trae 24. ¿Cuántas <b>cajas</b> son? Pista: divide 10,392 entre 24.',
        campos: [{ etiqueta: 'Cajas', respuesta: 433 }],
        porque: 'La cuenta es 10,392 ÷ 24 = <b>433 cajas</b>. Puedes comprobarla al revés: 433 × 24 = 10,392. Y cuadra con el día completo: en la mañana había 558 cajas y en los pedidos salieron 125, porque 40 + 55 + 30 = 125. Entonces 558 − 125 = 433.',
        pistas: [
          { si: v => v[0] === 10392, x: 'Ese número son las botellas. Te piden cuántas cajas son. Divide 10,392 entre 24.' },
          { si: v => v[0] === 1732, x: 'Dividiste entre 6, y eso te da paquetes. Cada caja trae 24 botellas. Divide entre 24.' },
          { si: v => v[0] === 2598, x: 'Dividiste entre 4, que son los paquetes de una caja. Divide entre 24, que son las botellas de una caja.' },
          { si: v => v[0] === 432, x: '¡Muy cerca! Pero 432 × 24 = 10,368, y te faltan 24 botellas para llegar a 10,392. Esas 24 son una caja más.' }
        ]
      }]
    },

    /* 4 — LOS NOMBRES (solo los que ya usó) */
    {
      etiqueta: 'Ponle nombre', tono: 'azul', titulo: 'Ponle nombre a lo que hiciste',
      bloques: [
        { t: 'p', x: 'Sacar un pedido, revisarlo, anotarlo y entregarlo. Eso que hiciste a las 2:00 tiene nombre:' },
        { t: 'def', k: 'despacho' },
        { t: 'p', x: 'Y la tabla que llenaste, con todo lo que entra y sale del jugo, también:' },
        { t: 'def', k: 'kardex' },
        { t: 'p', x: 'Y la columna de “Queda” tiene su nombre:' },
        { t: 'def', k: 'saldo' },
        { t: 'formula', x: 'saldo nuevo = saldo anterior + entra − sale' }
      ]
    },

    /* 5 — TRAMPA 1: lo que sale sin papel (aquí se siembra el error de las 5:30) */
    {
      etiqueta: 'Trampa 1 de 2', tono: 'rojo', titulo: '“Cinco cajas, sin papel”',
      bloques: [
        { t: 'p', x: 'Son las 3:00. El vendedor de la empresa pasa corriendo: <b>“Dame 5 cajas de jugo para una muestra. Eso lo apuntamos después, que voy tarde.”</b>' },
        { t: 'p', x: 'Un <b>vale</b> es el papel que dice qué sale, cuánto y para quién. Sin ese papel, la salida no queda anotada.' }
      ],
      items: [{
        id: 'm1l4.q1', tipo: 'opcion', corto: 'Cinco cajas para una muestra, sin papel',
        texto: 'El vendedor quiere 5 cajas para una muestra y dice que lo apuntan después. ¿Qué haces?',
        opciones: [
          { x: 'Se las doy y las anoto cuando tenga tiempo.', tono: 'mal',
            porque: 'Mientras no lo anotes, esas 5 cajas ya no están en el estante, pero siguen en el papel. Son 5 × 24 = 120 botellas. Esa diferencia va a aparecer a las 5:30, y a esa hora nadie se va a acordar de dónde salió.' },
          { x: 'Le digo que sin vale no sale nada, y si es urgente le hago el vale ahí mismo y lo anoto en el momento.', tono: 'ok',
            porque: '¡Así se trabaja! Todo lo que sale lleva su papel y su línea en el kárdex, aunque sea una muestra y aunque lo pida el vendedor. Hacer un vale toma 30 segundos. Le puedes decir con respeto: “Claro que sí, déjame hacerte el vale y te las entrego ahora mismo.”<br><b>Consejo de piso:</b> lo que sale “de favor” es lo que más descuadra las cuentas. Lo grande todo el mundo lo vigila. Lo chiquito es lo que se pierde.' },
          { x: 'Se las doy y no las anoto. Son solo 5 cajas.', tono: 'mal',
            porque: 'Parece poco, pero son 5 cajas, o sea 5 × 24 = 120 botellas. Y lo chiquito, repetido todos los días, es justo lo que se va sin que nadie lo note. Al final del mes, eso es mucho dinero.' },
          { x: 'Le digo que hable con Don Ramón.', tono: 'parcial',
            porque: 'Don Ramón puede autorizar esa salida, y está bien consultarle. Pero autorizar no es anotar. Aunque él diga que sí, la salida igual lleva su vale y su línea en el kárdex.' }
        ]
      }]
    },

    /* 6 — TRAMPA 2: el kárdex no se borra */
    {
      etiqueta: 'Trampa 2 de 2', tono: 'rojo', titulo: '“Se me fue un cero”',
      bloques: [
        { t: 'p', x: 'Repasas el kárdex y ves que en el pedido 3 anotaste <b>7,200</b> botellas en vez de <b>720</b>. Se te fue un cero.' },
        { t: 'p', x: 'La cuenta del error es 7,200 − 720 = <b>6,480</b>. El papel quedó 6,480 botellas por debajo de lo que de verdad hay.' }
      ],
      items: [{
        id: 'm1l4.q2', tipo: 'opcion', corto: 'Un cero de más en el kárdex',
        texto: 'Anotaste 7,200 botellas en vez de 720. ¿Cómo lo arreglas?',
        opciones: [
          { x: 'Borro la línea y la escribo bien.', tono: 'mal',
            porque: 'Parece lo más rápido, pero en el kárdex no se borra. Si se puede borrar para corregir, también se puede borrar para esconder algo. Sin rastro, nadie puede saber qué pasó ni quién lo hizo.' },
          { x: 'Dejo la línea como está y anoto otra que la corrige, con una nota que dice qué pasó.', tono: 'ok',
            porque: '¡Correcto! En el kárdex no se borra: se corrige con otra línea. Así quedan las dos, el error y la corrección, y cualquiera que lo revise entiende lo que pasó.<br><b>Consejo de piso:</b> escribe la nota pensando en alguien que no estuvo ahí: qué se anotó mal, cuál era el número correcto y a qué hora lo arreglaste.' },
          { x: 'No hago nada. En el conteo de hoy se arregla solo.', tono: 'mal',
            porque: 'El conteo no arregla nada solo. Lo que va a hacer es mostrarte la diferencia que ya calculamos: 6,480 botellas. Y vas a perder la tarde buscando algo que ya sabías.' },
          { x: 'Le pido a Don Ramón que la borre.', tono: 'parcial',
            porque: 'Avisarle está bien, y puede que él tenga que autorizar la corrección. Pero el arreglo sigue siendo el mismo: otra línea que corrige, no borrar la que está.' }
        ]
      }]
    },

    /* 7 — LA REGLA + GANCHO (solo texto) */
    {
      etiqueta: 'Para que no se te olvide', tono: 'verde', titulo: 'La regla de esta lección',
      bloques: [
        { t: 'regla', x: 'Lo que sale sin anotar es lo que se pierde.' },
        { t: 'p', x: 'Y en el kárdex no se borra: se corrige con otra línea.' },
        { t: 'gancho', hora: '5:30 p. m.', titulo: 'Lo que viene: la hora de la verdad',
          x: 'Son las 5:30. Don Ramón apaga la luz del muelle: “Cerramos el día. Vamos a contar lo que de verdad hay en el pasillo y a compararlo con el kárdex.” Ahí sale a la luz cada cosa que se hizo, y cada cosa que no se hizo, desde las 6:30 de la mañana.' }
      ]
    }
  ]
};

/* Estructura del curso. Las lecciones con "pendiente" aparecen en el mapa
   del día pero todavía no tienen contenido. */
const CURSO = {
  titulo: 'Inventario desde el piso',
  modulos: [
    {
      id: 'm1', rol: 'Auxiliar de almacén', titulo: 'Tu primer día',
      intro: 'Un día entero en un almacén. Cinco tramos y un solo producto que recorre todo el camino. Lo que hagas mal en un tramo, te lo cobra el siguiente.',
      lecciones: [
        L1,
        L2,
        L3,
        L4,
        { id: 'm1l5', hora: '5:30 p. m.', titulo: 'El conteo del cierre', resumen: 'Cuentas lo que hay y lo comparas con lo anotado.', pendiente: true }
      ],
      caso: { hora: '6:30 p. m.', titulo: 'Caso final', resumen: 'Aparece una diferencia. Tú rastreas de cuál tramo salió.' }
    },
    { id: 'm2', rol: 'Supervisor de inventario', bloqueado: true },
    { id: 'm3', rol: 'Gerente de almacén', bloqueado: true }
  ]
};

/* Una insignia se gana por competencia: la lección terminada y ninguna
   pregunta floja (todas firmes). */
const INSIGNIAS = [
  { id: 'i-m1l1', leccion: 'm1l1', nombre: 'Sabe qué está contando', texto: 'Cajas, paquetes, unidades y factor, sin lagunas.' },
  { id: 'i-m1l2', leccion: 'm1l2', nombre: 'Cuenta antes de firmar', texto: 'Contar, anotar y firmar, en ese orden.' },
  { id: 'i-m1l3', leccion: 'm1l3', nombre: 'Lo que vence primero, sale primero', texto: 'Guardar pensando en el orden de salida, y anotar en el momento.' },
  { id: 'i-m1l4', leccion: 'm1l4', nombre: 'Todo lo que sale, anotado', texto: 'Sacar con vale y anotar en el kárdex en el momento, sin borrar.' }
];

/* Índices para buscar rápido */
const LECCIONES = {};
const INDICE = {};   // id de pregunta -> { q, l }
CURSO.modulos.forEach(m => (m.lecciones || []).forEach(l => {
  LECCIONES[l.id] = l;
  (l.pantallas || []).forEach(p => (p.items || []).forEach(q => { INDICE[q.id] = { q, l }; }));
}));
const itemsDe = l => (l.pantallas || []).flatMap(p => p.items || []);


/* =====================================================================
   2. UTILIDADES
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);

function el(tag, props, ...hijos) {
  const n = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const h of hijos.flat()) {
    if (h == null || h === false) continue;
    n.append(h.nodeType ? h : document.createTextNode(h));
  }
  return n;
}

const fmt = n => Number(n).toLocaleString('en-US');
const plural = (n, a, b) => `${fmt(n)} ${n === 1 ? a : b}`;
const pad = n => String(n).padStart(2, '0');
function hoy() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function sumarDias(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1, d + n);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}
function barajar(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
const sinTags = s => String(s).replace(/<[^>]+>/g, '');

let avisoTimer = null;
function aviso(texto) {
  const zona = $('#aviso');
  zona.replaceChildren(el('div', { class: 'toast' }, texto));
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => zona.replaceChildren(), 4000);
}


/* =====================================================================
   3. ESTADO Y PROGRESO
   ===================================================================== */

const LS_KEY = 'inventario_desde_el_piso_v2';
const INTERVALOS = [1, 3, 7];   // días hasta repasar, según la "caja" (0, 1, 2)
let guardadoOk = true;

function estadoInicial() {
  return { v: 1, puntos: 0, racha: { dias: 0, ultimo: null }, letra: 2, sonido: true, items: {}, lecciones: {}, insignias: {} };
}
function cargar() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return estadoInicial();
    return Object.assign(estadoInicial(), JSON.parse(raw));
  } catch (e) { guardadoOk = false; return estadoInicial(); }
}
let E = cargar();
function guardar() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(E)); } catch (e) { guardadoOk = false; }
}

function tocarRacha() {
  const h = hoy(), r = E.racha;
  if (r.ultimo === h) return;
  r.dias = (r.ultimo === sumarDias(h, -1)) ? r.dias + 1 : 1;
  r.ultimo = h;
}
function rachaVisible() {
  const r = E.racha, h = hoy();
  return (r.ultimo === h || r.ultimo === sumarDias(h, -1)) ? r.dias : 0;
}

/* Cada pregunta tiene una "caja" (Leitner):
     0 = la fallaste        -> vuelve mañana
     1 = la repasaste bien  -> vuelve en 3 días
     2 = firme              -> vuelve en 7 días
     3 = dominada           -> ya no vuelve
   Acertar a la primera la deja en 2. Fallar la manda a 0. */

function registrarPrimeraLeccion(id, ok) {
  const meta = INDICE[id]; if (!meta) return;
  if (E.items[id] && E.items[id].box >= 0) return;   // ya la habías visto: práctica libre
  const it = E.items[id] = { box: 0, fallos: 0, aciertos: 0, due: null, primero: null, corregida: false, leccion: meta.l.id };
  tocarRacha();
  if (ok) { it.box = 2; it.due = null; it.primero = 'ok'; it.aciertos = 1; E.puntos += 10; }
  else    { it.box = 0; it.due = hoy(); it.primero = 'fallo'; it.fallos = 1; }
  revisarInsignias(); guardar(); pintarBarra();
}
function registrarCorreccion(id) {
  const it = E.items[id];
  if (it && it.primero === 'fallo' && !it.corregida) { it.corregida = true; it.aciertos++; E.puntos += 5; guardar(); pintarBarra(); }
}
function registrarRepaso(id, ok) {
  const it = E.items[id]; if (!it) return;
  tocarRacha();
  if (ok) {
    it.aciertos++; it.box = Math.min(3, it.box + 1); E.puntos += 5;
    it.due = it.box >= 3 ? null : sumarDias(hoy(), INTERVALOS[it.box]);
  } else {
    it.fallos++; it.box = 0; it.due = hoy();
  }
  revisarInsignias(); guardar(); pintarBarra();
}

const paraHoy = () => Object.keys(E.items).filter(id => { const it = E.items[id]; return INDICE[id] && it.box >= 0 && it.box < 3 && it.due && it.due <= hoy(); });
/* Aciertos = preguntas que tienes firmes (bien a la primera o ya rehechas).
   Se cuenta contra el total de preguntas del curso que ya tienen contenido. */
const totalPreguntas = () => Object.keys(INDICE).length;
const aciertosFirmes = (ids) => (ids || Object.keys(INDICE)).filter(id => E.items[id] && E.items[id].box >= 2).length;
const debiles = () => Object.keys(E.items).filter(id => { const it = E.items[id]; return INDICE[id] && it.box >= 0 && it.box < 2; });

function revisarInsignias() {
  INSIGNIAS.forEach(b => {
    if (E.insignias[b.id]) return;
    const l = LECCIONES[b.leccion];
    if (!l || !(E.lecciones[l.id] && E.lecciones[l.id].completa)) return;
    const its = itemsDe(l);
    if (its.length && its.every(q => E.items[q.id] && E.items[q.id].box >= 2)) {
      E.insignias[b.id] = { fecha: hoy() };
      guardar();
      aviso('Insignia ganada: ' + b.nombre);
    }
  });
}

function estadoLeccion(m, i) {
  const l = m.lecciones[i];
  if (l.pendiente) return 'pronto';
  const reg = E.lecciones[l.id];
  if (reg && reg.completa) return 'hecha';
  const prev = m.lecciones[i - 1];
  if (prev && !(E.lecciones[prev.id] && E.lecciones[prev.id].completa)) return 'bloqueada';
  return (reg && reg.paso > 0) ? 'en_curso' : 'nueva';
}


/* =====================================================================
   4. PREGUNTAS
   ctx = { alPrimera(id, ok), alResolver(id, okFinal), origen? }
   ===================================================================== */

/* ya = true: la pregunta ya se contestó en esta sesión (el alumno volvió con
   "Atrás"). Se muestra resuelta, con su explicación, y no se vuelve a pedir. */
function crearPregunta(q, ctx, ya) {
  return q.tipo === 'numero' ? preguntaNumero(q, ctx, ya) : preguntaOpcion(q, ctx, ya);
}

function origenDOM(q, ctx) {
  if (!ctx.origen) return null;
  const meta = INDICE[q.id];
  return el('p', { class: 'origen', html: `Esto viene de: ${meta.l.titulo} (${meta.l.hora}).` });
}

/* Si fallaste la primera y la pregunta quedó en la caja 0, vuelve mañana.
   Se dice en el momento, para que el repaso se vea y no sea una sorpresa. */
function avisoVuelve() { return null; }

function feedback(tono, titulo, texto, extra) {
  return el('div', { class: 'feedback t-' + tono },
    el('span', { class: 'veredicto' }, titulo),
    el('p', { html: texto }),
    extra || null);
}

/* Al hablar, el término de almacén va con su nombre de piso, para que se quede.
   Se aclara solo la PRIMERA vez que aparece en lo que se dice; repetirlo en
   cada frase hace la voz pesada y confusa. Después se lee limpio. */
const ACLARAR = [
  [/\bcajas\b/i, 'cajas, o sea los empaques', 'caja'],
  [/\bcaja\b/i, 'caja, o sea el empaque', 'caja'],
  [/\bunidades\b/i, 'unidades, las botellas sueltas', 'unidad'],
  [/\bunidad\b/i, 'unidad, la botella suelta', 'unidad'],
  [/\bpaletas\b/i, 'paletas, las tarimas', 'paleta'],
  [/\bpaleta\b/i, 'paleta, la tarima', 'paleta'],
  [/\bk[aá]rdex\b/i, 'kárdex, la libreta de entradas y salidas', 'kardex'],
  [/\bvale\b/i, 'vale, el papel de lo que sale', 'vale'],
  [/\blote\b/i, 'lote, el grupo de la misma fabricación', 'lote'],
  [/\brecepción\b/i, 'recepción, el momento en que entra la mercancía', 'recepcion']
];
function explicar(texto) {
  let t = sinTags(texto).replace(/\bSKU\b/g, 'código del producto');
  const hechos = new Set();
  ACLARAR.forEach(([re, por, grupo]) => {
    if (hechos.has(grupo)) return;
    if (re.test(t)) { t = t.replace(re, por); hechos.add(grupo); }
  });
  return t;
}

const Sonido = {
  ctx: null,
  preparar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  nota(frecuencia, duracion, tipo, volumen) {
    if (E.sonido === false) return;
    const ctx = this.preparar();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo || 'sine';
    o.frequency.value = frecuencia;
    g.gain.setValueAtTime(volumen || 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracion);
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + duracion);
  },
  pregunta() { this.nota(523, 0.12, 'sine', 0.06); setTimeout(() => this.nota(659, 0.14, 'sine', 0.06), 90); },
  bien() { this.nota(523, 0.1, 'sine', 0.07); setTimeout(() => this.nota(784, 0.18, 'sine', 0.07), 100); },
  mal() { this.nota(220, 0.16, 'sine', 0.05); },
  parcial() { this.nota(440, 0.14, 'sine', 0.05); },
  decir(texto) {
    if (E.sonido === false || !texto) return;
    this.preparar();
    Voz.hablar(explicar(texto));
  }
};

function preguntaOpcion(q, ctx, ya) {
  const raiz = el('section', { class: 'pregunta' });
  raiz.append(el('p', { class: 'enunciado', html: q.texto }));
  const zona = el('div', { class: 'no-voz' });
  const fb = el('div', { class: 'zona-fb' });
  raiz.append(zona, fb);

  let primera = true, resuelta = false, okPrimera = false;
  const botones = barajar(q.opciones).map(op => {
    const b = el('button', { class: 'opcion', type: 'button', html: op.x, 'data-tono': op.tono });
    b.addEventListener('click', () => {
      if (resuelta) return;
      Sonido.preparar();
      const ok = op.tono === 'ok';
      if (primera) { primera = false; okPrimera = ok; ctx.alPrimera(q.id, ok); }
      b.classList.add(op.tono); b.disabled = true;
      if (ok) {
        resuelta = true;
        Sonido.bien();
        botones.forEach(x => { if (!x.classList.contains('ok')) { x.disabled = true; if (!x.classList.contains('mal') && !x.classList.contains('parcial')) x.classList.add('apagada'); } });
        const vuelve = avisoVuelve(q.id, !okPrimera);
        fb.replaceChildren(feedback('verde', '¡Correcto!', op.porque, origenDOM(q, ctx)));
        Sonido.decir(op.porque);
        ctx.alResolver(q.id, true);
      } else if (op.tono === 'parcial') {
        Sonido.parcial();
        fb.replaceChildren(feedback('amarillo', 'Vas por buen camino', op.porque + ' Revisa las otras opciones, que hay una más completa.'));
        Sonido.decir(op.porque);
      } else {
        Sonido.mal();
        fb.replaceChildren(feedback('rojo', 'Esa no es', op.porque + ' No te preocupes, que así también se aprende. Prueba con otra opción.'));
        Sonido.decir(op.porque);
      }
    });
    return b;
  });
  botones.forEach(b => zona.append(b));
  if (!ya) Sonido.pregunta();
  if (!ya && E.sonido !== false) setTimeout(() => Sonido.decir(q.texto), 280);
  if (ya) {
    resuelta = true; primera = false;
    botones.forEach(b => { b.disabled = true; b.classList.add(b.dataset.tono === 'ok' ? 'ok' : 'apagada'); });
    fb.replaceChildren(feedback('verde', 'Ya la contestaste', q.opciones.find(o => o.tono === 'ok').porque));
  }
  return raiz;
}

function preguntaNumero(q, ctx, ya) {
  const raiz = el('section', { class: 'pregunta' });
  raiz.append(el('p', { class: 'enunciado', html: q.texto }));
  const campos = el('div', { class: 'campos no-voz' });
  const inputs = q.campos.map(c => {
    const inp = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'campo-num', 'aria-label': c.etiqueta });
    campos.append(el('label', { class: 'campo' }, el('span', null, c.etiqueta), inp));
    return inp;
  });
  const bComprobar = el('button', { class: 'btn', type: 'button' }, 'Comprobar');
  const fila = el('div', { class: 'fila-btn no-voz' }, bComprobar);
  const fb = el('div', { class: 'zona-fb' });
  raiz.append(campos, fila, fb);

  let intentos = 0, primera = true, resuelta = false, okPrimera = false;
  const leer = i => { const s = i.value.replace(/[\s,.]/g, ''); return s === '' ? NaN : Number(s); };
  const cerrar = (okFinal) => { resuelta = true; inputs.forEach(i => { i.disabled = true; }); fila.replaceChildren(); ctx.alResolver(q.id, okFinal); };

  bComprobar.addEventListener('click', () => {
    if (resuelta) return;
    const vals = inputs.map(leer);
    if (vals.some(Number.isNaN)) {
      Sonido.parcial();
      fb.replaceChildren(feedback('amarillo', 'Falta el número', 'Escribe un número en cada casilla. Fíjate bien en la pregunta: ahí dice si te piden cajas o botellas.'));
      return;
    }
    const ok = vals.every((v, i) => v === q.campos[i].respuesta);
    if (primera) { primera = false; okPrimera = ok; ctx.alPrimera(q.id, ok); }
    if (ok) {
      const vuelve = avisoVuelve(q.id, !okPrimera);
      fb.replaceChildren(feedback('verde', '¡Correcto!', q.porque, origenDOM(q, ctx)));
      Sonido.bien();
      Sonido.decir(q.porque);
      cerrar(true);
      return;
    }
    intentos++;
    const pista = (q.pistas || []).find(p => p.si(vals));
    const extra = intentos >= 2
      ? el('div', { class: 'fila-btn' }, el('button', {
          class: 'btn btn-sec btn-chico', type: 'button',
          onclick: () => {
            inputs.forEach((i, k) => { i.value = String(q.campos[k].respuesta); });
            const vuelve = avisoVuelve(q.id, true);
            fb.replaceChildren(feedback('amarillo', 'Así se hace', q.porque, origenDOM(q, ctx)));
            Sonido.decir(q.porque);
            cerrar(false);
          }
        }, 'Ver cómo se hace'))
      : null;
    Sonido.mal();
    fb.replaceChildren(feedback('rojo', 'Todavía no cuadra', (pista ? pista.x : 'Vas bien, no te apures. Lee la pregunta otra vez con calma: ahí están los números que necesitas y te dice si toca multiplicar, sumar o restar.') , extra));
    if (pista) Sonido.decir(pista.x);
  });
  inputs.forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); bComprobar.click(); } }));
  if (ya) {
    resuelta = true; primera = false;
    inputs.forEach((i, k) => { i.value = String(q.campos[k].respuesta); i.disabled = true; });
    fila.replaceChildren();
    fb.replaceChildren(feedback('verde', 'Ya la contestaste', q.porque));
  }
  if (!ya) Sonido.pregunta();
  if (!ya && E.sonido !== false) setTimeout(() => Sonido.decir(q.texto), 280);
  return raiz;
}


/* =====================================================================
   5. WIDGETS (gráficos)
   Cada widget es una función (contenedor) => void. Para una lección nueva
   se agrega un widget aquí y se usa con {t:'widget', id:'nombre'}.
   ===================================================================== */

let widgetSeq = 0;
const WIDGETS = {};

/* Tres SKU para ver qué cambia cuando cambia el código */
WIDGETS.skuCards = function (cont) {
  const tarjetas = [
    { cod: 'JUG-NAR-1L',  nom: 'Jugo de naranja', det: 'Botella de 1 litro', sigue: true },
    { cod: 'JUG-NAR-1.5L', nom: 'Jugo de naranja', det: 'Botella de 1.5 litros' },
    { cod: 'JUG-MAN-1L',  nom: 'Jugo de manzana', det: 'Botella de 1 litro' }
  ];
  cont.append(
    el('div', { class: 'widget-titulo' }, 'Tres productos, tres SKU'),
    el('div', { class: 'sku-grid' }, tarjetas.map(t =>
      el('div', { class: 'sku-card' + (t.sigue ? ' sigue' : '') },
        el('div', { class: 'cod' }, t.cod),
        el('div', { class: 'nom' }, t.nom),
        el('div', { class: 'det' }, t.det),
        t.sigue ? el('div', { class: 'marca-sigue' }, 'El que vas a seguir en el curso') : null))));
};

WIDGETS.skuCards.narra = 'Aquí hay tres productos con tres códigos distintos. Primero, el jugo de naranja de un litro, que es el que vas a seguir en el curso. Segundo, el jugo de naranja de litro y medio. Y tercero, el jugo de manzana de un litro. Los tres son jugo, pero cada uno tiene su propio código.';

/* Escalera de medidas: el chofer habla en cajas, el sistema en unidades.
   api.exige = lo que hay que hacer para poder seguir ('mover', 'empaque').
   api.hecho(clave) avisa a la pantalla que ya se hizo. */
WIDGETS.unidades = function (cont, api) {
  api = api || { exige: [], hecho() {} };
  const SIS = 24;      // factor que tiene el sistema
  const UXP = 6;       // unidades por paquete
  const st = { cajas: 1, cambio: false };
  const hechas = new Set();
  const id = 'w-cajas-' + (++widgetSeq);

  cont.innerHTML = `
    <div class="widget-titulo">Las cajas del chofer, en botellas</div>
    <div class="control">
      <label for="${id}">Cajas que dice el chofer</label>
      <div class="valor" data-valor></div>
      <input id="${id}" type="range" min="1" max="100" step="1" value="1">
    </div>
    <div class="escalera fila" data-esc></div>
    <div class="atajos">
      <button type="button" class="btn btn-sec btn-chico" data-set="1">1 caja</button>
      <button type="button" class="btn btn-sec btn-chico" data-set="10">10 cajas</button>
      <button type="button" class="btn btn-sec btn-chico" data-set="100">100 cajas</button>
    </div>
    <div class="veredicto-w" data-ver></div>
    <svg class="caja-svg" viewBox="0 0 320 190" role="img"></svg>
    <div class="pie-svg" data-pie></div>
    <div class="veredicto-w" data-req style="margin-top:1rem"></div>`;

  const q = s => cont.querySelector(s);
  const rango = q('input[type=range]'), svg = q('svg');

  /* Caja de 24: 4 paquetes. Caja de 12: 2 paquetes, y la caja es más chica.
     No se dibuja una caja a medias: es otra caja, llena. */
  function dibujar(ppc) {
    const alto = ppc > 2 ? 178 : 98;
    let s = `<rect class="svg-caja" x="6" y="6" width="308" height="${alto}" rx="6"/>`;
    [[22, 20], [168, 20], [22, 104], [168, 104]].slice(0, ppc).forEach(([x, y]) => {
      s += `<rect class="svg-paq" x="${x}" y="${y}" width="130" height="66" rx="5"/>`;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++)
        s += `<circle class="svg-bot" cx="${x + 28 + c * 37}" cy="${y + 20 + r * 26}" r="10"/>`;
    });
    svg.setAttribute('viewBox', `0 0 320 ${alto + 12}`);
    return s;
  }

  const FALTA = { mover: 'mover las cajas para ver las botellas' };
  function pintarReq() {
    const caja = q('[data-req]');
    if (!api.exige.length) { caja.remove(); return; }
    const pend = api.exige.filter(k => !hechas.has(k));
    if (pend.length) {
      caja.className = 'veredicto-w t-amarillo';
      caja.innerHTML = '<b>Para seguir</b>Te falta: ' + pend.map(k => FALTA[k]).join(' y ') + '.';
    } else {
      caja.className = 'veredicto-w t-verde';
      caja.innerHTML = '<b>Listo</b>Ya puedes seguir.';
    }
  }
  function marcar(clave) {
    if (hechas.has(clave)) return;
    hechas.add(clave);
    api.hecho(clave);
    pintarReq();
  }

  function pintarW() {
    const ppc = 4;
    const porCaja = ppc * UXP;
    const n = st.cajas;
    const botellas = n * porCaja;

    q('[data-valor]').textContent = `${plural(n, 'caja', 'cajas')} = ${plural(botellas, 'botella', 'botellas')}`;
    svg.innerHTML = dibujar(ppc);
    svg.setAttribute('aria-label', 'Una caja con 4 paquetes de 6 botellas, 24 en total');
    q('[data-pie]').textContent = 'Esta caja trae 4 paquetes de 6 botellas. Total: 24 botellas.';

    q('[data-esc]').innerHTML = `
      <div class="peldano habla"><span class="nombre">Caja</span><span class="cant">${fmt(n)}</span><span class="quien-habla">Esto dice el chofer</span><span class="nota-p">1 caja = 4 paquetes</span></div>
      <div class="peldano"><span class="nombre">Paquete</span><span class="cant">${fmt(n * ppc)}</span><span class="nota-p">1 paquete = 6 botellas</span></div>
      <div class="peldano habla"><span class="nombre">Botella</span><span class="cant">${fmt(botellas)}</span><span class="quien-habla">Esto dice la pantalla</span></div>`;

    const ver = q('[data-ver]');
    ver.className = 'veredicto-w t-verde';
    ver.innerHTML = `<b>Así se pasa</b>${plural(n, 'caja', 'cajas')} × 24 botellas = ${plural(botellas, 'botella', 'botellas')}. El chofer dice cajas. La pantalla dice botellas.`;
  }

  rango.addEventListener('input', () => { st.cajas = Number(rango.value); pintarW(); marcar('mover'); });
  cont.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => {
    st.cajas = Number(b.dataset.set); rango.value = st.cajas; pintarW(); marcar('mover');
  }));
  pintarW();
  pintarReq();
};
WIDGETS.unidades.narra = 'En el dibujo, la caja trae 4 paquetes de 6 botellas, o sea 24. Cuando mueves el número de cajas, las botellas suben de 24 en 24. El chofer cuenta cajas y la pantalla cuenta botellas. Pruébalo en la pantalla.';


/* Camión con 10 paletas: se toca cada una para contarla por capas.
   La paleta 7 trae 38 (la última capa viene con 6) y la 10 es de otro lote.
   Las etiquetas se muestran SIN nombre ("4417 · 10/2027"); los nombres
   (lote, vencimiento) se enseñan después, en la pantalla de nombres. */
WIDGETS.camion = function (cont, api) {
  api = api || { exige: [], hecho() {}, ya: false };
  const HOJA = 400;
  const paletas = [];
  for (let n = 1; n <= 10; n++) {
    paletas.push({
      n,
      capas: n === 7 ? [8, 8, 8, 8, 6] : [8, 8, 8, 8, 8],
      etq: n === 10 ? '4392 · 08/2027' : '4417 · 10/2027'
    });
  }
  const total = p => p.capas.reduce((a, b) => a + b, 0);
  const contadas = new Set(api.ya ? paletas.map(p => p.n) : []);
  let avisado = !!api.ya;
  let ultima = null;

  cont.innerHTML = `
    <div class="widget-titulo">Toca cada paleta para contarla</div>
    <div class="paletas" data-paletas></div>
    <div class="detalle-paleta" data-det></div>
    <div class="cifras" data-cifras></div>
    <div class="veredicto-w" data-ver style="margin-top:1rem"></div>`;
  const q = s => cont.querySelector(s);

  paletas.forEach(p => {
    const b = el('button', { type: 'button', class: 'paleta-btn', 'data-n': p.n, 'aria-label': 'Paleta ' + p.n }, el('b', { html: `<i class="largo">Paleta </i>${p.n}` }), el('span', { html: '<i class="largo">sin contar</i><i class="corto">?</i>' }));
    b.addEventListener('click', () => {
      ultima = p.n; contadas.add(p.n); pintar();
      if (!avisado && contadas.size === paletas.length) { avisado = true; api.hecho('contar'); }
    });
    q('[data-paletas]').append(b);
  });

  function detalle(p) {
    const llenas = p.capas.filter(c => c === 8).length;
    const parcial = p.capas.filter(c => c !== 8);
    const capas = `${llenas} ${llenas === 1 ? 'capa' : 'capas'} de 8 cajas` + (parcial.length ? ` y 1 capa de ${parcial[0]} cajas` : '');
    return `<b>Paleta ${p.n}</b><br>${capas} = <b>${total(p)} cajas</b><br>Etiqueta: <b>${p.etq}</b>`;
  }

  function pintar() {
    const sumaContada = paletas.filter(p => contadas.has(p.n)).reduce((a, p) => a + total(p), 0);
    const todas = contadas.size === paletas.length;
    cont.querySelectorAll('.paleta-btn').forEach(b => {
      const p = paletas[Number(b.dataset.n) - 1];
      const hecha = contadas.has(p.n);
      b.className = 'paleta-btn' + (hecha ? ' contada' : '') + (todas && total(p) < 40 ? ' falta' : '');
      b.lastChild.innerHTML = hecha ? `<i class="largo">${total(p)} cajas</i><i class="corto">${total(p)}</i>` : '<i class="largo">sin contar</i><i class="corto">?</i>';
    });
    const det = q('[data-det]');
    const p = ultima ? paletas[ultima - 1] : null;
    det.innerHTML = p ? detalle(p) : 'Toca una paleta para ver cuántas capas y cuántas cajas trae.';
    q('[data-cifras]').innerHTML = `
      <div class="cifra"><span>Paletas contadas</span><span class="v">${contadas.size} de ${paletas.length}</span></div>
      <div class="cifra"><span>Cajas que contaste</span><span class="v">${fmt(sumaContada)}</span></div>
      <div class="cifra"><span>La hoja dice</span><span class="v">${fmt(HOJA)} cajas</span></div>`;
    const ver = q('[data-ver]');
    if (!todas) {
      ver.className = 'veredicto-w t-amarillo';
      const resto = paletas.length - contadas.size;
      ver.innerHTML = `<b>Para seguir</b>${resto === 1 ? 'Te falta 1 paleta' : `Te faltan ${resto} paletas`} por contar.`;
    } else if (sumaContada === HOJA) {
      ver.className = 'veredicto-w t-verde';
      ver.innerHTML = `<b>Cuadra</b>Contaste ${fmt(sumaContada)} cajas, igual que la hoja.`;
    } else {
      ver.className = 'veredicto-w t-rojo';
      ver.innerHTML = `<b>No cuadra</b>Contaste ${fmt(sumaContada)} cajas y la hoja dice ${fmt(HOJA)}. Faltan ${fmt(HOJA - sumaContada)}. Mira cuál paleta no llegó a 40.`;
    }
  }
  pintar();
};
WIDGETS.camion.narra = 'Aquí hay diez paletas. Toca cada una para contarla por capas. Una capa trae 8 cajas, y una paleta completa trae 5 capas, o sea 40 cajas. Cuando termines las diez, vas a ver si el total cuadra con lo que dice la hoja. Pruébalo en la pantalla.';


/* Pasillo B: se guarda tocando (primero la paleta, luego el espacio).
   No se arrastra: en el celular arrastrar falla mucho.
   Regla: de B-01 (puerta) hacia el fondo, los vencimientos no pueden bajar. */
WIDGETS.almacen = function (cont, api) {
  api = api || { exige: [], hecho() {}, ya: false };
  const N = 15;
  const cod = i => 'B-' + String(i).padStart(2, '0');
  const VIEJO = { lote: '4401', venc: 202709, txt: '09/2027', cajas: 40 };
  const ocupados = { 2: VIEJO, 3: VIEJO, 4: VIEJO, 5: VIEJO };
  const paletas = [];
  for (let n = 1; n <= 10; n++) {
    paletas.push({ n, cajas: n === 7 ? 38 : 40, lote: n === 10 ? '4392' : '4417', venc: n === 10 ? 202708 : 202710, txt: n === 10 ? '08/2027' : '10/2027' });
  }
  const enEspacio = {};          // espacio -> número de paleta
  let sel = null;                // paleta seleccionada
  let ultima = null;             // lo que se muestra en el detalle
  let avisado = !!api.ya;
  if (api.ya) { enEspacio[1] = 10; for (let n = 1; n <= 9; n++) enEspacio[n + 5] = n; }

  cont.innerHTML = `
    <div class="widget-titulo">Guarda las 10 paletas en el pasillo B</div>
    <div class="pasillo-etq">En el muelle</div>
    <div class="paletas" data-muelle></div>
    <div class="detalle-paleta" data-det></div>
    <div class="pasillo-etq">Puerta de salida: de aquí se saca primero</div>
    <div class="pasillo" data-pasillo></div>
    <div class="pasillo-etq">Fondo</div>
    <div class="veredicto-w" data-ver style="margin-top:1rem"></div>`;
  const q = s => cont.querySelector(s);
  const guardada = n => Object.values(enEspacio).includes(n);

  function ocupante(i) {
    if (ocupados[i]) return ocupados[i];
    if (enEspacio[i]) return paletas[enEspacio[i] - 1];
    return null;
  }

  function violaciones() {
    const lista = [];
    for (let i = 1; i <= N; i++) { const o = ocupante(i); if (o) lista.push({ i, o }); }
    const mal = [];
    for (let k = 0; k < lista.length - 1; k++) {
      if (lista[k].o.venc > lista[k + 1].o.venc) mal.push([lista[k], lista[k + 1]]);
    }
    return mal;
  }

  function pintar() {
    const mal = violaciones();
    const malEspacios = new Set();
    mal.forEach(([a, b]) => { malEspacios.add(a.i); malEspacios.add(b.i); });

    const muelle = q('[data-muelle]');
    muelle.replaceChildren();
    const pendientes = paletas.filter(p => !guardada(p.n));
    pendientes.forEach(p => {
      const b = el('button', { type: 'button', class: 'paleta-btn' + (sel === p.n ? ' sel' : ''), 'aria-label': 'Paleta ' + p.n + ', vence ' + p.txt },
        el('b', { html: `<i class="largo">Paleta </i>${p.n}` }),
        el('span', { html: `<i class="largo">vence ${p.txt}</i><i class="corto">${p.txt.replace('/20', '/')}</i>` }));
      b.addEventListener('click', () => { sel = p.n; ultima = { paleta: p }; pintar(); });
      muelle.append(b);
    });
    if (!pendientes.length) muelle.append(el('p', { class: 'vacio' }, 'El muelle quedó vacío.'));

    const pas = q('[data-pasillo]');
    pas.replaceChildren();
    for (let i = 1; i <= N; i++) {
      const o = ocupante(i);
      let clase = 'espacio', linea2 = 'libre', corta = 'libre';
      if (ocupados[i]) { clase += ' viejo'; linea2 = 'ya había ' + o.txt; corta = o.txt.replace('/20', '/'); }
      else if (o) { clase += malEspacios.has(i) ? ' mal' : ' puesto'; linea2 = 'P' + o.n + ' · ' + o.txt; corta = 'P' + o.n; }
      if (ocupados[i] && malEspacios.has(i)) clase += ' mal';
      const b = el('button', { type: 'button', class: clase, 'aria-label': cod(i) + ', ' + linea2 }, el('b', null, cod(i)),
        el('span', { html: `<i class="largo">${linea2}</i><i class="corto">${corta}</i>` }));
      b.addEventListener('click', () => {
        if (ocupados[i]) { ultima = { viejo: i }; sel = null; pintar(); return; }
        if (enEspacio[i]) {                      // levantar la paleta de ahí
          sel = enEspacio[i]; ultima = { paleta: paletas[sel - 1] }; delete enEspacio[i]; pintar(); return;
        }
        if (sel) {                               // guardarla aquí
          enEspacio[i] = sel; ultima = { paleta: paletas[sel - 1], en: i }; sel = null; pintar();
          if (!avisado && Object.keys(enEspacio).length === 10 && !violaciones().length) { avisado = true; api.hecho('guardar'); }
        }
      });
      pas.append(b);
    }

    const det = q('[data-det]');
    if (ultima && ultima.viejo) det.innerHTML = `<b>${cod(ultima.viejo)}: jugo que ya estaba</b><br>Lote ${VIEJO.lote} · vence ${VIEJO.txt}<br>${VIEJO.cajas} cajas`;
    else if (ultima && ultima.paleta) {
      const p = ultima.paleta;
      det.innerHTML = `<b>Paleta ${p.n}</b>${ultima.en ? ' en <b>' + cod(ultima.en) + '</b>' : ''}<br>Lote ${p.lote} · vence ${p.txt}<br>${p.cajas} cajas`;
    } else det.textContent = 'Toca una paleta del muelle para ver su lote y su vencimiento.';

    const ver = q('[data-ver]');
    const faltan = paletas.length - Object.keys(enEspacio).length;
    if (mal.length) {
      const [a, b] = mal[0];
      ver.className = 'veredicto-w t-rojo';
      ver.innerHTML = `<b>Ese orden no sirve</b>En ${cod(a.i)} hay jugo que vence ${a.o.txt}. Más al fondo, en ${cod(b.i)}, hay jugo que vence ${b.o.txt}. Saldría primero el que vence después. Cámbialos de lugar.`;
    } else if (faltan > 0) {
      ver.className = 'veredicto-w t-amarillo';
      ver.innerHTML = `<b>Para seguir</b>${faltan === 1 ? 'Te falta 1 paleta' : 'Te faltan ' + faltan + ' paletas'} por guardar.`;
    } else {
      ver.className = 'veredicto-w t-verde';
      ver.innerHTML = '<b>Bien</b>De la puerta hacia el fondo, todo sale en orden de vencimiento.';
    }
  }
  pintar();
};
WIDGETS.almacen.narra = 'Aquí hay un pasillo con 15 espacios, de B-01 a B-15. B-01 es el que queda junto a la puerta de salida, y de ahí se saca primero. En el medio hay cuatro paletas viejas, que vencen en septiembre de 2027. Toca una paleta del muelle y después un espacio libre para guardarla. Lo que vence primero tiene que quedar más cerca de la puerta. Si el orden está mal, el pasillo te lo marca en rojo. Pruébalo en la pantalla.';


/* Tabla del día: se anota cada movimiento en UNIDADES y el saldo corre solo.
   Se muestra SIN los nombres (kárdex, saldo): el encabezado dice "Queda".
   Los nombres se enseñan después, en la pantalla de nombres. */
WIDGETS.kardex = function (cont, api) {
  api = api || { exige: [], hecho() {}, ya: false };
  const UXC = 24, INICIAL = 3840;
  const movs = [
    { hora: '7:40 a. m.', que: 'Entra el camión (lo que contaste)', cajas: 398, tipo: 'entra' },
    { hora: '2:10 p. m.', que: 'Sale el pedido 1', cajas: 40, tipo: 'sale' },
    { hora: '3:15 p. m.', que: 'Sale el pedido 2', cajas: 55, tipo: 'sale' },
    { hora: '4:30 p. m.', que: 'Sale el pedido 3', cajas: 30, tipo: 'sale' }
  ];
  let hechas = api.ya ? movs.length : 0;
  let avisado = !!api.ya;

  cont.innerHTML = `
    <div class="widget-titulo">Llena la tabla, movimiento por movimiento</div>
    <div class="tabla-scroll"><table class="kardex-t">
      <thead><tr><th>Hora</th><th>Movimiento</th><th class="n">Entra</th><th class="n">Sale</th><th class="n">Queda</th></tr></thead>
      <tbody data-filas></tbody>
    </table></div>
    <div class="detalle-paleta" data-pedido></div>
    <div class="veredicto-w" data-ver style="margin-top:1rem"></div>`;
  const q = s => cont.querySelector(s);

  function filas() {
    let saldo = INICIAL;
    let h = `<tr><td>6:00 a. m.</td><td>Lo que había</td><td class="n"></td><td class="n"></td><td class="n queda">${fmt(saldo)}</td></tr>`;
    for (let i = 0; i < hechas; i++) {
      const m = movs[i], u = m.cajas * UXC;
      saldo += m.tipo === 'entra' ? u : -u;
      h += `<tr><td>${m.hora}</td><td>${m.que}</td><td class="n">${m.tipo === 'entra' ? fmt(u) : ''}</td><td class="n">${m.tipo === 'sale' ? fmt(u) : ''}</td><td class="n queda">${fmt(saldo)}</td></tr>`;
    }
    q('[data-filas]').innerHTML = h;
    return saldo;
  }

  function pista(m, v) {
    const ok = m.cajas * UXC;
    if (v === m.cajas) return 'Eso son las cajas. La tabla va en unidades: cada caja trae 24.';
    if (m.tipo === 'entra' && v === 400 * UXC) return 'Eso es lo que decía la hoja. Tú contaste ' + m.cajas + ' cajas.';
    if (v === m.cajas * 4) return 'Multiplicaste por 4 y te quedaste en paquetes. Cada paquete trae 6 unidades.';
    if (v === m.cajas * 6) return 'Multiplicaste por 6 y te quedaste a medio camino. Falta contar los 4 paquetes de cada caja.';
    return 'No es. Revisa la cuenta: ' + m.cajas + ' cajas × 24.';
  }

  function pintar() {
    const saldo = filas();
    const ped = q('[data-pedido]'), ver = q('[data-ver]');
    if (hechas >= movs.length) {
      ped.style.display = 'none';
      ver.className = 'veredicto-w t-verde';
      ver.innerHTML = `<b>Listo</b>Al final del día quedan ${fmt(saldo)} unidades.`;
      return;
    }
    const m = movs[hechas];
    ped.style.display = '';
    ped.innerHTML = '';
    ped.append(
      el('p', { html: `<b>${m.hora}. ${m.que}: ${m.cajas} cajas.</b><br>¿Cuántas unidades anotas?` }),
      el('div', { class: 'fila-btn' },
        el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'campo-num', 'aria-label': 'Unidades' }),
        el('button', { type: 'button', class: 'btn' }, 'Anotar')));
    ver.className = 'veredicto-w t-amarillo';
    ver.innerHTML = `<b>Para seguir</b>${movs.length - hechas === 1 ? 'Te falta 1 movimiento' : 'Te faltan ' + (movs.length - hechas) + ' movimientos'} por anotar.`;
    const inp = ped.querySelector('input'), btn = ped.querySelector('button');
    const probar = () => {
      const s = inp.value.replace(/[\s,.]/g, '');
      if (s === '' || Number.isNaN(Number(s))) { ver.className = 'veredicto-w t-amarillo'; ver.innerHTML = '<b>Falta algo</b>Escribe un número.'; return; }
      const v = Number(s);
      if (v === m.cajas * UXC) {
        hechas++; pintar();
        if (!avisado && hechas === movs.length) { avisado = true; api.hecho('anotar'); }
      } else {
        ver.className = 'veredicto-w t-rojo';
        ver.innerHTML = '<b>No es</b>' + pista(m, v);
      }
    };
    btn.addEventListener('click', probar);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); probar(); } });
  }
  pintar();
};
WIDGETS.kardex.narra = 'Aquí vas a llenar una tabla con todo lo que entró y salió del jugo durante el día. Empieza con 3,840 unidades. Cada movimiento viene en cajas, y tú anotas las unidades: cada caja trae 24. La última columna va sumando lo que entra y restando lo que sale. Pruébalo en la pantalla.';


/* =====================================================================
   6. PANTALLAS
   ===================================================================== */

const app = $('#app');

function renderBloque(b, api) {
  switch (b.t) {
    case 'p':
      return el('p', { html: b.x });
    case 'dialogo':
      return el('p', { class: 'dialogo', html: `<span class="quien">${b.quien}:</span> ${b.x}` });
    case 'def': {
      const g = GLOSARIO[b.k];
      return el('div', { class: 'def' },
        el('div', { class: 'def-etq' }, 'Palabra nueva'),
        el('div', { class: 'def-palabra', html: g.palabra }),
        el('div', { class: 'def-texto', html: g.x }));
    }
    case 'citas':
      return el('ul', { class: 'citas t-' + (b.tono || 'neutro') }, b.items.map(x => el('li', { html: x })));
    case 'nota':
      return el('aside', { class: 'nota' }, el('p', { html: '<b>Entre tú y yo.</b> ' + b.x }));
    case 'formula':
      return el('div', { class: 'formula', html: b.x });
    case 'cifras':
      return el('div', { class: 'cifras' }, b.filas.map(f =>
        el('div', { class: 'cifra t-' + (f.tono || 'neutro') }, el('span', { class: 'k', html: f.k }), el('span', { class: 'v', html: f.v }))));
    case 'consejos':
      return el('div', { class: 'consejos t-' + (b.tono || 'amarillo') }, b.items.map(c =>
        el('div', { class: 'consejo' }, el('b', { html: c.c }), el('p', { html: c.x }))));
    case 'regla':
      return el('div', { class: 'regla', html: b.x });
    case 'gancho':
      return el('div', { class: 'gancho' },
        el('div', { class: 'hora-g' }, b.hora),
        el('h2', { html: b.titulo }),
        el('p', { html: b.x }));
    case 'widget': {
      const w = el('div', { class: 'widget no-voz' });
      if (WIDGETS[b.id].narra) w.setAttribute('data-narra', WIDGETS[b.id].narra);   // lo que "Escuchar" dice en su lugar
      WIDGETS[b.id](w, { exige: b.exige || [], ya: !!(api && api.ya), hecho: k => { if (api) api.hecho(k); } });
      return w;
    }
    default:
      return el('p', { html: b.x || '' });
  }
}

function pantallaDOM(p, ctxPreguntas) {
  const art = el('article', { class: 'pantalla t-' + (p.tono || 'azul') });
  if (p.etiqueta) art.append(el('div', { class: 'etiqueta' }, p.etiqueta));
  art.append(el('h1', { class: 'titulo' }, p.titulo));
  /* Lo que el widget exige tocar antes de poder seguir */
  const faltan = new Set();
  (p.bloques || []).forEach(b => { if (b.t === 'widget' && b.exige) b.exige.forEach(k => faltan.add(k)); });
  const api = { ya: !!ctxPreguntas.widgetYa, hecho: k => { if (faltan.delete(k) && faltan.size === 0 && ctxPreguntas.alWidget) ctxPreguntas.alWidget(); } };
  (p.bloques || []).forEach(b => art.append(renderBloque(b, api)));
  if (p.items) {
    const zona = el('div', { class: 'preguntas' });
    art.append(zona);
    const mostrar = i => {
      const q = p.items[i];
      const ya = !!(ctxPreguntas.yaResuelta && ctxPreguntas.yaResuelta(q.id));
      zona.append(crearPregunta(q, {
        alPrimera: ctxPreguntas.alPrimera,
        alResolver: (id, ok) => {
          ctxPreguntas.alResolver(id, ok);
          if (i + 1 < p.items.length) mostrar(i + 1);
        },
        origen: ctxPreguntas.origen
      }, ya));
      if (ya && i + 1 < p.items.length) mostrar(i + 1);
    };
    mostrar(0);
  }
  return art;
}

/* ---------- Inicio ---------- */
function pintarInicio() {
  const m = CURSO.modulos[0];
  const cont = el('div', { class: 'inicio' });
  cont.append(el('p', { class: 'rol' }, 'Módulo 1: ' + m.rol));
  cont.append(el('h1', null, m.titulo));
  cont.append(el('p', { class: 'intro' }, m.intro));

  const n = paraHoy().length;
  if (n) {
    cont.append(el('div', { class: 'aviso-repaso t-amarillo' },
      el('p', null, n === 1 ? 'Tienes 1 pregunta para repasar hoy.' : `Tienes ${n} preguntas para repasar hoy.`),
      el('button', { class: 'btn btn-chico', type: 'button', onclick: () => { location.hash = '#/repaso'; } }, 'Ir al repaso')));
  }

  const hilo = el('ol', { class: 'hilo' });
  m.lecciones.forEach((l, i) => {
    const est = estadoLeccion(m, i);
    const reg = E.lecciones[l.id] || {};
    const cuerpo = el('div', { class: 'hito-cuerpo' }, el('div', { class: 'hora' }, l.hora), el('h2', null, `Lección ${i + 1}: ${l.titulo}`));
    if (l.pendiente) {
      cuerpo.append(el('p', null, l.resumen), el('span', { class: 'chip' }, 'En construcción'));
    } else if (est === 'bloqueada') {
      cuerpo.append(el('span', { class: 'chip' }, 'Se abre al terminar la anterior'));
    } else {
      const total = l.pantallas.length;
      if (est === 'hecha') cuerpo.append(el('span', { class: 'chip t-verde' }, 'Tramo cerrado'));
      else if (est === 'en_curso') cuerpo.append(el('p', null, `Vas por la pantalla ${Math.min(reg.paso + 1, total)} de ${total}.`));
      else cuerpo.append(el('p', null, `Unos ${l.minutos} minutos.`));
      cuerpo.append(el('div', { class: 'fila-btn' }, el('button', {
        class: 'btn btn-chico' + (est === 'hecha' ? ' btn-sec' : ''), type: 'button',
        onclick: () => {
          if (est === 'hecha') { reg.paso = 0; E.lecciones[l.id] = reg; guardar(); }
          location.hash = '#/leccion/' + l.id;
        }
      }, est === 'hecha' ? 'Verla otra vez' : est === 'en_curso' ? 'Seguir' : 'Empezar')));
    }
    hilo.append(el('li', { class: 'hito ' + est }, cuerpo));
  });
  cont.append(hilo);

  const ganadas = INSIGNIAS.filter(b => E.insignias[b.id]);
  if (ganadas.length) {
    cont.append(el('h2', { class: 'seccion-titulo' }, 'Tus insignias'),
      el('div', { class: 'insignias' }, ganadas.map(b => el('div', { class: 'insignia' }, el('b', null, b.nombre), el('span', null, b.texto)))));
  }

  app.replaceChildren(cont);
}

/* ---------- Lección ---------- */
const widgetsHechos = new Set();   // pantallas con widget ya tocado (para ir y volver sin repetir)
const resueltas = new Set();       // preguntas ya resueltas en esta sesión (para ir y volver sin repetir)

function pintarLeccion(id) {
  const l = LECCIONES[id];
  const reg = E.lecciones[id] || (E.lecciones[id] = { completa: false, paso: 0 });
  vistaLeccion(l, reg);
}
function irPaso(l, reg, paso) {
  reg.paso = paso; guardar();
  vistaLeccion(l, reg);
  window.scrollTo(0, 0);
}
function completarLeccion(l, reg) {
  if (!reg.completa) { reg.completa = true; reg.fecha = hoy(); tocarRacha(); }
  revisarInsignias(); guardar(); pintarBarra();
}

function vistaLeccion(l, reg) {
  Voz.parar();
  const n = l.pantallas.length;
  const paso = Math.min(reg.paso || 0, n);
  const num = Object.keys(LECCIONES).indexOf(l.id) + 1;
  const cont = el('div', { class: 'leccion' });

  const info = el('span', { class: 'info' }, `Lección ${num}: ${l.titulo} (${l.hora})`);
  const cab = el('div', { class: 'cab-lec' }, info);
  cont.append(cab);
  cont.append(el('div', { class: 'segs', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': n, 'aria-valuenow': paso },
    l.pantallas.map((_, i) => el('span', { class: 'seg' + (i < paso ? ' hecho' : i === paso ? ' actual' : '') }))));

  if (paso >= n) {
    cont.append(resumenDOM(l));
    app.replaceChildren(cont);
    return;
  }

  const p = l.pantallas[paso];
  const esUltima = paso === n - 1;
  const bSeguir = el('button', { class: 'btn', type: 'button' }, esUltima ? 'Terminar lección' : 'Seguir');
  const bAtras = el('button', { class: 'btn btn-sec', type: 'button' }, paso === 0 ? 'Volver al curso' : 'Atrás');

  const claveW = l.id + ':' + paso;
  const exigeW = (p.bloques || []).some(b => b.t === 'widget' && b.exige && b.exige.length) && !reg.completa && !widgetsHechos.has(claveW);
  let pendientes = reg.completa ? 0 : (p.items ? p.items.filter(q => !resueltas.has(q.id)).length : 0) + (exigeW ? 1 : 0);
  bSeguir.disabled = pendientes > 0;

  const art = pantallaDOM(p, {
    widgetYa: widgetsHechos.has(claveW),
    alWidget: () => {
      widgetsHechos.add(claveW);
      pendientes = Math.max(0, pendientes - 1);
      if (pendientes === 0) bSeguir.disabled = false;
    },
    alPrimera: registrarPrimeraLeccion,
    yaResuelta: id => resueltas.has(id),
    alResolver: (id, ok) => {
      resueltas.add(id);
      if (ok) registrarCorreccion(id);
      pendientes = Math.max(0, pendientes - 1);
      if (pendientes === 0) bSeguir.disabled = false;
    }
  });

  if (Voz.soportada) {
    const bVoz = el('button', { class: 'btn btn-sec btn-chico', type: 'button' }, 'Escuchar');
    bVoz.addEventListener('click', () => {
      if (Voz.activa) { Voz.parar(); return; }
      Voz.hablar(narrable(art), () => { bVoz.textContent = 'Escuchar'; });
      bVoz.textContent = 'Parar';
    });
    cab.append(bVoz);
  }

  if (reg.completa && paso === 0) {
    art.insertBefore(el('aside', { class: 'nota' }, el('p', null, 'Ya terminaste esta lección. Puedes verla otra vez; lo que contestes aquí no cambia tus aciertos.')), art.firstChild);
  }

  cont.append(art);
  bSeguir.addEventListener('click', () => {
    if (esUltima) { completarLeccion(l, reg); irPaso(l, reg, n); }
    else irPaso(l, reg, paso + 1);
  });
  bAtras.addEventListener('click', () => {
    if (paso === 0) location.hash = '#/'; else irPaso(l, reg, paso - 1);
  });
  cont.append(el('div', { class: 'pie-nav no-voz' }, bAtras, bSeguir));
  app.replaceChildren(cont);
}

function resumenDOM(l) {
  const its = itemsDe(l);
  const est = its.map(q => E.items[q.id]).filter(Boolean);
  const primera = est.filter(s => s.primero === 'ok').length;
  const flojas = its.filter(q => E.items[q.id] && E.items[q.id].box < 2);
  const insignia = INSIGNIAS.find(b => b.leccion === l.id);
  const gano = insignia && E.insignias[insignia.id];

  const cont = el('article', { class: 'pantalla t-verde' },
    el('div', { class: 'etiqueta' }, 'Tramo cerrado'),
    el('h1', { class: 'titulo' }, l.titulo));

  /* Primera marca: el tramo se cierra siempre, aunque hayas fallado.
     Segunda marca: la insignia, solo cuando no queda ninguna pregunta floja. */
  const filaInsignia = !insignia ? null : gano
    ? el('div', { class: 'cifra t-verde' }, el('span', null, 'Insignia: ' + insignia.nombre), el('span', { class: 'v' }, 'Ganada'))
    : el('div', { class: 'cifra t-amarillo' }, el('span', null, 'Insignia: ' + insignia.nombre),
        el('span', { class: 'v' }, `Pendiente (${flojas.length} ${flojas.length === 1 ? 'floja' : 'flojas'})`));

  const racha = rachaVisible();
  cont.append(el('div', { class: 'cifras' },
    el('div', { class: 'cifra t-verde' }, el('span', null, `Tramo de las ${l.hora}`), el('span', { class: 'v' }, 'Cerrado')),
    racha ? el('div', { class: 'cifra t-azul' }, el('span', null, 'Días'), el('span', { class: 'v' }, racha === 1 ? '1 día' : `${racha} días`)) : null,
    filaInsignia,
    el('div', { class: 'cifra' }, el('span', null, 'Contestadas bien a la primera'), el('span', { class: 'v' }, `${primera} de ${its.length}`)),
    el('div', { class: 'cifra' }, el('span', null, 'Aciertos en esta lección'), el('span', { class: 'v' }, `${aciertosFirmes(its.map(q => q.id))} de ${its.length}`))));

  if (gano) {
    cont.append(el('p', null, insignia.texto));
  } else if (flojas.length) {
    cont.append(el('p', null, `Te quedaron ${flojas.length} ${flojas.length === 1 ? 'pregunta' : 'preguntas'} por rehacer. Están en Rehacer, ahora. La insignia se gana cuando no te quede ninguna.`));
  }

  const mod = CURSO.modulos.find(x => (x.lecciones || []).includes(l));
  const sig = mod && mod.lecciones[mod.lecciones.indexOf(l) + 1];
  const haySig = sig && !sig.pendiente;
  cont.append(el('div', { class: 'fila-btn' },
    haySig ? el('button', { class: 'btn', type: 'button', onclick: () => { location.hash = '#/leccion/' + sig.id; } }, `Seguir con la lección ${Object.keys(LECCIONES).indexOf(sig.id) + 1}`) : null,
    el('button', { class: haySig ? 'btn btn-sec' : 'btn', type: 'button', onclick: () => { location.hash = '#/'; } }, 'Volver al curso'),
    flojas.length ? el('button', { class: 'btn btn-sec', type: 'button', onclick: () => { location.hash = '#/repaso'; } }, 'Rehacer las que fallé') : null));
  return cont;
}

/* ---------- Repaso ---------- */
let sesion = null;   // { ids, i, bien }

function pintarRepaso() {
  if (sesion) { pintarSesion(); return; }
  const cont = el('div', { class: 'inicio' });
  cont.append(el('h1', null, 'Rehacer'));
  const vistos = Object.keys(E.items).filter(id => INDICE[id]);
  const hoyIds = paraHoy(), flojos = debiles();
  const firmes = vistos.filter(id => E.items[id].box >= 2).length;

  if (!vistos.length) {
    cont.append(el('p', { class: 'intro' }, 'Todavía no hay nada que rehacer. Si una pregunta no te queda, aparece aquí enseguida.'));
    app.replaceChildren(cont); return;
  }

  cont.append(el('p', { class: 'intro' }, 'Aquí están las que no te quedaron. Las puedes rehacer ahora. No hace falta esperar a otro día.'));

  const filaBtn = el('div', { class: 'fila-btn' });
  if (hoyIds.length) filaBtn.append(el('button', { class: 'btn', type: 'button', onclick: () => iniciarRepaso(hoyIds) }, `Rehacer ahora (${hoyIds.length})`));
  if (flojos.length && flojos.length !== hoyIds.length) filaBtn.append(el('button', { class: hoyIds.length ? 'btn btn-sec' : 'btn', type: 'button', onclick: () => iniciarRepaso(flojos) }, `Ver las que fallé (${flojos.length})`));
  if (!hoyIds.length && !flojos.length) cont.append(el('p', null, 'No tienes ninguna por rehacer.'));
  cont.append(filaBtn);

  if (flojos.length) {
    cont.append(el('h2', { class: 'seccion-titulo' }, 'Las que no te quedaron'));
    const ul = el('ul', { class: 'lista-debil' });
    flojos.forEach(id => {
      const { q, l } = INDICE[id];
      ul.append(el('li', null, q.corto || sinTags(q.texto).slice(0, 60),
        el('small', null, `Viene de la lección: ${l.titulo}. La has fallado ${E.items[id].fallos} ${E.items[id].fallos === 1 ? 'vez' : 'veces'}.`)));
    });
    cont.append(ul);
  }
  cont.append(el('p', null, `Firmes: ${firmes} de ${vistos.length}.`));
  app.replaceChildren(cont);
}

function iniciarRepaso(ids) {
  sesion = { ids: barajar(ids).slice(0, 8), i: 0, bien: 0 };
  pintarSesion();
  window.scrollTo(0, 0);
}

function pintarSesion() {
  Voz.parar();
  if (sesion.i >= sesion.ids.length) {
    const s = sesion; sesion = null;
    const cont = el('div', { class: 'inicio' },
      el('h1', null, 'Listo'),
      el('p', { class: 'intro' }, `Acertaste ${s.bien} de ${s.ids.length} a la primera. Las que no, siguen aquí para rehacerlas.`),
      el('div', { class: 'fila-btn' },
        el('button', { class: 'btn', type: 'button', onclick: () => { location.hash = '#/'; } }, 'Volver al curso'),
        el('button', { class: 'btn btn-sec', type: 'button', onclick: pintarRepaso }, 'Volver a la lista')));
    app.replaceChildren(cont);
    return;
  }
  const id = sesion.ids[sesion.i];
  const { q } = INDICE[id];
  const bSig = el('button', { class: 'btn', type: 'button', disabled: true },
    sesion.i + 1 === sesion.ids.length ? 'Terminar' : 'Siguiente');
  bSig.addEventListener('click', () => { sesion.i++; pintarSesion(); window.scrollTo(0, 0); });
  const bSalir = el('button', { class: 'btn btn-sec', type: 'button', onclick: () => { sesion = null; pintarRepaso(); } }, 'Salir');

  const cont = el('div', { class: 'leccion' },
    el('div', { class: 'cab-lec' }, el('span', { class: 'info' }, `Rehacer: ${sesion.i + 1} de ${sesion.ids.length}`)),
    crearPregunta(q, {
      origen: true,
      alPrimera: (qid, ok) => { if (ok) sesion.bien++; registrarRepaso(qid, ok); },
      alResolver: () => { bSig.disabled = false; }
    }),
    el('div', { class: 'pie-nav' }, bSalir, bSig));
  app.replaceChildren(cont);
}


/* =====================================================================
   7. VOZ  (usa la voz del navegador; la calidad depende del aparato)
   ===================================================================== */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* Deja el texto listo para que la voz lo lea claro:
   9,600 -> 9600 (si no, la voz en español lee "nueve coma seiscientos"),
   × ÷ = − + en palabras, 08/2027 -> agosto de 2027, B-01 -> B 1. */
function paraVoz(t) {
  return String(t)
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/×/g, ' por ').replace(/÷/g, ' entre ').replace(/=/g, ' igual a ').replace(/−/g, ' menos ').replace(/\+/g, ' más ')
    .replace(/\b(0?[1-9]|1[0-2])\/(20\d\d)\b/g, (m, mes, a) => `${MESES[Number(mes) - 1]} de ${a}`)
    .replace(/\b([A-Z])-0*(\d+)\b/g, '$1 $2')
    .replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
}

const Voz = {
  soportada: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  activa: false, token: 0, alFin: null, elegida: null,

  /* Busca la voz más clara del aparato. Primero las voces naturales o
     neuronales (Edge: "Online (Natural)"; Chrome: "Google"; Apple:
     "Mejorada" o "Premium"), y entre ellas el español latino (RD, EE. UU.,
     México) antes que el de España. */
  elegir() {
    if (this.elegida) return this.elegida;
    const vs = (speechSynthesis.getVoices() || []).filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
    if (!vs.length) return null;
    const LUGAR = ['es-do', 'es-us', 'es-mx', 'es-419', 'es-pr', 'es-co', 'es-ve', 'es-es'];
    const nota = v => {
      const n = (v.name || '').toLowerCase(), l = v.lang.replace('_', '-').toLowerCase();
      let p = 0;
      if (/natural|neural|online|premium|enhanced|mejorad/.test(n)) p += 100;
      if (/google/.test(n)) p += 60;
      if (/microsoft/.test(n)) p += 20;
      if (/compact|espeak/.test(n)) p -= 80;
      const i = LUGAR.findIndex(x => l.startsWith(x));
      p += i === -1 ? 0 : (LUGAR.length - i) * 5;
      return p;
    };
    this.elegida = vs.slice().sort((a, b) => nota(b) - nota(a))[0];
    return this.elegida;
  },
  trocear(texto) {
    const frases = texto.match(/[^.!?]+[.!?]*\s*/g) || [texto];
    const partes = []; let acum = '';
    frases.forEach(f => {
      if ((acum + f).length > 180 && acum) { partes.push(acum); acum = f; } else acum += f;
    });
    if (acum.trim()) partes.push(acum);
    return partes;
  },
  hablar(texto, alFin) {
    if (!this.soportada) return;
    this.parar();
    const mio = ++this.token;
    this.activa = true; this.alFin = alFin || null;
    const voz = this.elegir();
    const partes = this.trocear(paraVoz(texto));
    partes.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = voz ? voz.lang : 'es-US';
      if (voz) u.voice = voz;
      u.rate = 0.95;
      u.pitch = 1;
      if (i === partes.length - 1) u.onend = () => { if (this.token === mio) this.terminar(); };
      u.onerror = () => { if (this.token === mio) this.terminar(); };
      speechSynthesis.speak(u);
    });
  },
  terminar() { this.activa = false; const f = this.alFin; this.alFin = null; if (f) f(); },
  parar() {
    if (!this.soportada) return;
    this.token++;
    try { speechSynthesis.cancel(); } catch (e) { /* nada */ }
    if (this.activa) this.terminar();
  }
};
/* Algunos navegadores cargan las voces tarde: cuando llegan, se vuelve a elegir. */
if (Voz.soportada) {
  try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => { Voz.elegida = null; }); } catch (e) { /* nada */ }
}

/* Convierte la pantalla en texto corrido para escuchar */
function narrable(nodo) {
  const c = nodo.cloneNode(true);
  /* Un widget no se puede leer tal cual: se cambia por su descripción hablada */
  c.querySelectorAll('.widget[data-narra]').forEach(w => w.replaceWith(document.createTextNode(' ' + w.getAttribute('data-narra') + ' ')));
  c.querySelectorAll('.no-voz, button, input, svg, label').forEach(n => n.remove());
  c.querySelectorAll('h1, .etiqueta, .def-palabra, .def-etq, .consejo b, .nombre').forEach(n => n.append(document.createTextNode('. ')));
  c.querySelectorAll('p, li, div, .quien').forEach(n => n.append(document.createTextNode(' ')));
  return explicar(c.textContent
    .replace(/×/g, ' por ').replace(/÷/g, ' entre ').replace(/=/g, ' igual a ').replace(/−/g, ' menos ').replace(/\+/g, ' más ')
    .replace(/\bFEFO\b/g, 'fefo, lo que se vence primero').replace(/\bFIFO\b/g, 'fifo, lo que llegó primero').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim());
}


/* =====================================================================
   8. MENÚ
   ===================================================================== */

function aplicarLetra() {
  document.documentElement.classList.remove('letra-1', 'letra-2', 'letra-3');
  document.documentElement.classList.add('letra-' + (E.letra || 2));
}
function exportar() {
  const blob = new Blob([JSON.stringify(E, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `progreso-inventario-${hoy()}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importar(archivo) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const o = JSON.parse(fr.result);
      if (!o || o.v !== 1 || typeof o.items !== 'object') throw new Error('formato');
      if (!confirm('Esto reemplaza tu progreso actual. ¿Seguir?')) return;
      E = Object.assign(estadoInicial(), o);
      guardar(); aplicarLetra(); cerrarMenu(); pintarBarra(); sesion = null; resueltas.clear(); widgetsHechos.clear(); pintar();
      aviso('Progreso importado.');
    } catch (e) { aviso('Ese archivo no es un progreso válido de este curso.'); }
  };
  fr.readAsText(archivo);
}
function cerrarMenu() { $('#menu').hidden = true; }
function abrirMenu() {
  const velo = $('#menu'), caja = $('.menu-caja', velo);
  const archivo = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  archivo.addEventListener('change', () => { if (archivo.files[0]) importar(archivo.files[0]); });
  caja.replaceChildren(
    el('h2', null, 'Menú'),
    el('h3', null, 'Sonido'),
    el('p', null, 'Activo lee la pregunta y la respuesta, y suena al acertar o al fallar. Inactivo deja la lección en silencio. Escuchar, en la lección, sigue funcionando.'),
    el('div', { class: 'fila-btn' },
      el('button', {
        class: 'btn btn-chico' + (E.sonido !== false ? '' : ' btn-sec'), type: 'button',
        onclick: () => { E.sonido = true; guardar(); Sonido.preparar(); Sonido.bien(); abrirMenu(); }
      }, 'Activo'),
      el('button', {
        class: 'btn btn-chico' + (E.sonido === false ? '' : ' btn-sec'), type: 'button',
        onclick: () => { E.sonido = false; guardar(); Voz.parar(); abrirMenu(); }
      }, 'Inactivo')),
    el('h3', null, 'Tamaño de letra'),
    el('div', { class: 'fila-btn' }, ['Normal', 'Grande', 'Más grande'].map((t, i) =>
      el('button', {
        class: 'btn btn-chico' + (E.letra === i + 1 ? '' : ' btn-sec'), type: 'button',
        onclick: () => { E.letra = i + 1; guardar(); aplicarLetra(); abrirMenu(); }
      }, t))),
    el('h3', null, 'Tu progreso'),
    el('p', null, guardadoOk
      ? 'Se guarda solo en este navegador. Si cambias de celular o de navegador, exporta aquí e importa allá.'
      : 'Este navegador no deja guardar. Exporta tu progreso antes de cerrar la página.'),
    el('div', { class: 'fila-btn' },
      el('button', { class: 'btn btn-sec btn-chico', type: 'button', onclick: exportar }, 'Exportar progreso'),
      el('button', { class: 'btn btn-sec btn-chico', type: 'button', onclick: () => archivo.click() }, 'Importar progreso')),
    archivo,
    el('h3', null, 'Empezar de cero'),
    el('div', { class: 'fila-btn' }, el('button', {
      class: 'btn btn-peligro btn-chico', type: 'button',
      onclick: () => {
        if (!confirm('Se borra todo tu progreso: puntos, racha e insignias. ¿Seguro?')) return;
        E = estadoInicial(); guardar(); aplicarLetra(); sesion = null; resueltas.clear(); widgetsHechos.clear(); cerrarMenu(); pintarBarra(); pintar();
      }
    }, 'Borrar mi progreso')),
    el('div', { class: 'fila-btn' }, el('button', { class: 'btn', type: 'button', onclick: cerrarMenu }, 'Cerrar')));
  velo.hidden = false;
}


/* =====================================================================
   9. VALIDACIÓN DEL HILO
   Revisa el contenido al abrir la página y avisa en la consola (F12) si:
   - una pregunta no tiene exactamente una respuesta correcta
   - una respuesta no explica el porqué
   - una pantalla usa una palabra técnica antes de definirla
   ===================================================================== */

const CLAVES_IGNORAR = new Set(['id', 'k', 't', 'tipo', 'tono', 'corto', 'respuesta', 'hora']);
function textoDe(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v !== 'object') return '';
  if (Array.isArray(v)) return v.map(textoDe).join(' ');
  return Object.entries(v).filter(([k]) => !CLAVES_IGNORAR.has(k)).map(([, x]) => textoDe(x)).join(' ');
}

function validarContenido() {
  const av = [], ids = new Set(), definidos = new Set();
  CURSO.modulos.forEach(m => (m.lecciones || []).forEach(l => {
    (l.pantallas || []).forEach((p, i) => {
      const donde = `${l.id}, pantalla ${i + 1}`;
      (p.bloques || []).forEach(b => {
        if (b.t === 'def') {
          if (!GLOSARIO[b.k]) av.push(`${donde}: “${b.k}” no está en el glosario.`);
          definidos.add(b.k);
        }
        if (b.t === 'widget' && !WIDGETS[b.id]) av.push(`${donde}: el widget “${b.id}” no existe.`);
      });
      const texto = textoDe(p);
      Object.entries(GLOSARIO).forEach(([k, g]) => {
        if (g.re && g.re.test(texto) && !definidos.has(k)) av.push(`${donde}: usa “${sinTags(g.palabra)}” antes de definirlo.`);
      });
      (p.items || []).forEach(q => {
        if (ids.has(q.id)) av.push(`${donde}: id repetido ${q.id}.`);
        ids.add(q.id);
        if (q.tipo === 'opcion') {
          const ok = q.opciones.filter(o => o.tono === 'ok').length;
          if (ok !== 1) av.push(`${q.id}: debe tener exactamente 1 respuesta correcta (tiene ${ok}).`);
          q.opciones.forEach((o, k) => { if (!o.porque) av.push(`${q.id}: la opción ${k + 1} no explica el porqué.`); });
        } else if (q.tipo === 'numero') {
          if (!q.porque) av.push(`${q.id}: falta explicar cómo se hace.`);
        } else av.push(`${q.id}: tipo desconocido.`);
      });
    });
  }));
  return av;
}


/* =====================================================================
   10. ARRANQUE
   ===================================================================== */

function pintarBarra() {
  $('#datoRacha').innerHTML = `Días <b>${rachaVisible()}</b>`;
  $('#datoPuntos').innerHTML = `Aciertos <b>${aciertosFirmes()} de ${totalPreguntas()}</b>`;
  const n = paraHoy().length;
  $('#tabRepaso').innerHTML = 'Rehacer' + (n ? `<span class="num">${n}</span>` : '');
}

function pintar() {
  Voz.parar();
  const h = location.hash.replace(/^#\/?/, '');
  const [vista, arg] = h.split('/');
  if (vista !== 'repaso') sesion = null;
  if (vista === 'leccion' && LECCIONES[arg] && !LECCIONES[arg].pendiente) pintarLeccion(arg);
  else if (vista === 'repaso') pintarRepaso();
  else pintarInicio();
  $('#tabCurso').classList.toggle('activa', vista !== 'repaso');
  $('#tabRepaso').classList.toggle('activa', vista === 'repaso');
  pintarBarra();
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}

function irA(hash) {
  if (location.hash === hash || (hash === '#/' && (location.hash === '' || location.hash === '#'))) pintar();
  else location.hash = hash;
}

function init() {
  aplicarLetra();
  const avisos = validarContenido();
  window.__validacion = avisos;
  if (avisos.length) console.warn('Revisión del hilo del curso:\n- ' + avisos.join('\n- '));

  $('#btnInicio').addEventListener('click', () => irA('#/'));
  $('#tabCurso').addEventListener('click', () => irA('#/'));
  $('#tabRepaso').addEventListener('click', () => irA('#/repaso'));
  $('#tabMenu').addEventListener('click', abrirMenu);
  $('#menu').addEventListener('click', e => { if (e.target === $('#menu')) cerrarMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });
  window.addEventListener('hashchange', pintar);

  /* Quien llega por primera vez (sin nada empezado) cae directo en la
     primera pantalla de la lección 1, no en el mapa. Solo pasa al abrir:
     "Volver al curso" y la pestaña Curso siguen llevando al mapa. */
  const nadaEmpezado = !Object.keys(E.items).length &&
    !Object.values(E.lecciones).some(r => r && (r.completa || r.paso > 0));
  if (!location.hash.replace('#', '') && nadaEmpezado) {
    try { history.replaceState(null, '', '#/leccion/m1l1'); } catch (e) { location.hash = '#/leccion/m1l1'; }
  }
  pintar();
}

init();
