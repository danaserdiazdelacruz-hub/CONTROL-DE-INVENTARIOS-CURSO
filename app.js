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
        texto: '¿Qué le contestas a Don Ramón?',
        opciones: [
          { x: 'El sistema. 9,600 es mucho más que 400.', tono: 'mal',
            porque: 'Estás comparando 400 con 9,600 como si fueran lo mismo. No lo son: 400 son cajas y 9,600 son botellas. Un número de cajas y un número de botellas no se pueden restar ni decir que uno es “más”.' },
          { x: 'El chofer. Tiene que traer 9,600.', tono: 'mal',
            porque: '9,600 es lo que dice la pantalla, y la pantalla habla de botellas, no de cajas. Decirle al chofer que traiga 9,600 cajas es cambiarle la medida. Todavía no sabes cuántas botellas entran en una caja, así que con estos dos números no se puede saber quién se equivocó.' },
          { x: 'Puede que ninguno esté equivocado. Hablan en medidas distintas.', tono: 'ok',
            porque: 'Eso. Falta un dato que nadie te ha dado: cuántas botellas trae cada caja. Sin ese dato, 400 y 9,600 no se pueden comparar. Ahora vas a abrir una caja y verlo.' },
          { x: 'Hay que llamar al proveedor.', tono: 'parcial',
            porque: 'Llamar no es mala idea, pero es lo último, no lo primero. Antes abres una caja y cuentas las botellas. Si con esa cuenta no cuadra, ahí sí llamas, y llamas con el número en la mano.' }
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
        texto: 'Don Ramón acaba de decir que cada caja trae 24 botellas. La hoja dice 400 cajas. ¿Cuántas <b>botellas</b> son?',
        campos: [{ etiqueta: 'Unidades', respuesta: 9600 }],
        porque: '400 × 24 = <b>9,600 unidades</b>. Es justo lo que decía el sistema. El chofer contaba cajas, el sistema contaba unidades, y los dos tenían razón. Lo que faltaba era la medida.',
        pistas: [
          { si: v => v[0] === 1600, x: 'Multiplicaste por 4 y te quedaste en paquetes. Cada paquete trae 6 unidades.' },
          { si: v => v[0] === 2400, x: 'Multiplicaste por 6 y te quedaste a medio camino. Falta contar los 4 paquetes de cada caja.' },
          { si: v => v[0] === 400,  x: 'Esas son las cajas. Te piden las unidades.' },
          { si: v => v[0] === 424,  x: 'Sumaste. Cada caja trae 24, así que se multiplica.' }
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
        texto: 'Llega jugo de naranja, pero en botella de 1.5 litros. El proveedor dice “es el mismo jugo”. ¿Es el mismo SKU que JUG-NAR-1L?',
        opciones: [
          { x: 'Sí. Es jugo de naranja, es lo mismo.', tono: 'mal',
            porque: 'Es el mismo sabor, pero cambió el tamaño, y eso el cliente lo nota. Si lo mezclas con el de 1 litro, el sistema va a contar botellas distintas como si fueran iguales.' },
          { x: 'No. Cambió el tamaño, es otro SKU.', tono: 'ok',
            porque: 'Eso. Si cambia algo que el cliente nota, cambia el SKU. Se recibe y se guarda aparte.<br><b>Consejo de piso:</b> compara el código, no el nombre. Dos productos pueden llamarse casi igual. El código no se repite.' },
          { x: 'Depende de quién sea el proveedor.', tono: 'mal',
            porque: 'El código lo define el producto, no quién lo vende. Un mismo proveedor puede traer diez códigos distintos. El chofer no tiene esa lista: maneja el camión.' },
          { x: 'Le pregunto al chofer.', tono: 'mal',
            porque: 'El chofer maneja un camión, no la lista de códigos. Lo que él diga no cambia el código de la botella. Mira el código y la etiqueta.' }
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
        texto: 'Dice “quedan 50 de jugo” y no dice si son cajas, paquetes o botellas. ¿Qué haces antes de anotar?',
        opciones: [
          { x: 'Anoto 50 unidades.', tono: 'mal',
            porque: 'Esa es la trampa. Si eran 50 cajas, la cuenta es 50 × 24 = 1,200 botellas. Anotar 50 deja el sistema 1,150 por debajo (1,200 − 50). Nadie robó nada: solo nadie dijo la medida. Por eso no se anota hasta preguntar.' },
          { x: 'Pregunto: “¿50 qué? ¿Cajas, paquetes o unidades?”', tono: 'ok',
            porque: 'Eso. Son dos segundos de pregunta contra una tarde buscando botellas que nunca se perdieron.<br><b>Consejo de piso:</b> un número sin medida no es un dato. Pregunta “¿50 qué?” aunque parezca obvio, y aunque sea el jefe. Sobre todo si es el jefe.' },
          { x: 'Anoto 50 cajas.', tono: 'mal',
            porque: 'Puede que acierte, pero estás adivinando. Y lo que se adivina es lo que después aparece como diferencia.' },
          { x: 'Voy y cuento yo mismo.', tono: 'parcial',
            porque: 'A veces toca, y no está mal. Pero la pregunta de dos segundos te resuelve sin caminar hasta el estante. Pregunta primero; cuenta si la respuesta no te convence.' }
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
        texto: 'Llegan 400 cajas. El sistema sigue contando 24 botellas por caja. Don Ramón acaba de contar 12 en la caja de verdad. ¿Cuántas botellas anota el sistema, y cuántas entran de verdad?',
        campos: [
          { etiqueta: 'El sistema anota', respuesta: 9600 },
          { etiqueta: 'Entran de verdad', respuesta: 4800 }
        ],
        porque: 'El sistema hace 400 × 24 = <b>9,600</b>. En el piso es 400 × 12 = <b>4,800</b>. La diferencia es 9,600 − 4,800 = 4,800 botellas que el papel tiene y la caja no. Nadie robó nada.<br><b>Consejo de piso:</b> manda la caja, no la pantalla. Antes de recibir, ábrela y cuenta.',
        pistas: [
          { si: v => v[0] === 4800 && v[1] === 9600, x: 'Están al revés. El sistema multiplica por 24, así que anota más. En el piso se multiplica por 12, así que entra menos.' },
          { si: v => v[0] === 400 || v[1] === 400, x: '400 son las cajas. Te piden botellas: multiplica 400 por 24, y 400 por 12.' },
          { si: v => v[0] === 9600 && v[1] === 9600, x: '9,600 es solo la cuenta del sistema (400 × 24). La caja de verdad trae 12, así que la otra cuenta es 400 × 12.' },
          { si: v => v[1] === 9600, x: '9,600 es lo que espera el sistema. Lo que entra se calcula con las 12 botellas que contó Don Ramón.' }
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
        texto: 'La tabla de arriba dice que 1 caja son 24 botellas y 1 paquete son 6. El pedido es 3 cajas y 2 paquetes sueltos. No los sumes entre sí. ¿Cuántas <b>botellas</b> despachas?',
        campos: [{ etiqueta: 'Unidades', respuesta: 84 }],
        porque: '3 cajas × 24 = 72. 2 paquetes × 6 = 12. 72 + 12 = <b>84 unidades</b>.<br><b>Consejo de piso:</b> nunca sumes cajas con paquetes. Pasa todo a unidades, que es la medida más chiquita, y ahí sumas.',
        pistas: [
          { si: v => v[0] === 5,  x: 'Sumaste 3 + 2 como si fueran la misma medida. Es justo el error de esta lección.' },
          { si: v => v[0] === 72, x: 'Contaste las cajas y se te quedaron los 2 paquetes sueltos. Cada paquete son 6 unidades.' }
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
        texto: '¿Qué haces?',
        opciones: [
          { x: 'Firmo. La hoja dice 400 y el chofer es de confianza.', tono: 'mal',
            porque: 'La hoja dice lo que el proveedor dice que mandó, no lo que llegó. Tu firma dice que ya llegó, y desde ahí queda como que llegó completo.' },
          { x: 'Cuento lo que bajó del camión antes de firmar, aunque el chofer proteste.', tono: 'ok',
            porque: 'Eso. Tu firma dice “esto llegó y ahora es mío”. Antes de firmar tienes que saber qué es “esto”. Un chofer con prisa es buena razón para contar con calma, no con menos cuidado.' },
          { x: 'Firmo y cuento después.', tono: 'mal',
            porque: 'Después de firmar, el chofer ya se fue y la hoja dice que llegó todo. Si falta algo, vas a estar contando con el problema ya en tus manos.' },
          { x: 'Le digo que espere a Don Ramón.', tono: 'parcial',
            porque: 'Avisar no es mala idea, pero contar es tu trabajo y no hace falta esperar a nadie para empezar. Cuenta, y si algo no cuadra, ahí sí llamas a Don Ramón con el dato en la mano.' }
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
        texto: 'Faltan 2 cajas. Cada caja trae 24 botellas. ¿Cuántas <b>botellas</b> faltan?',
        campos: [{ etiqueta: 'Unidades', respuesta: 48 }],
        porque: '2 cajas × 24 = <b>48 unidades</b>. Son 48 botellas que la hoja dice que llegaron y no llegaron.',
        pistas: [
          { si: v => v[0] === 2,    x: 'Esas son las cajas que faltan. Te piden unidades.' },
          { si: v => v[0] === 8,    x: 'Multiplicaste por 4 y te quedaste en paquetes. Cada paquete trae 6 unidades.' },
          { si: v => v[0] === 12,   x: 'Multiplicaste por 6 y te quedaste a medio camino. Falta contar los 4 paquetes de cada caja.' },
          { si: v => v[0] === 9552, x: '398 × 24 = 9,552. Eso es lo que llegó, no lo que falta. Lo que falta son las 2 cajas: 2 × 24.' },
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
        texto: '¿Cómo firmas?',
        opciones: [
          { x: 'Firmo 400, como dice la hoja. Son solo 2 cajas.', tono: 'mal',
            porque: 'Son 2 cajas, y cada caja trae 24 botellas: 2 × 24 = 48. Tu firma diría que esas 48 llegaron, y no llegaron. Ese faltante se queda escondido y vuelve a aparecer a las 5:30, cuando toque contar lo que hay y no cuadre.' },
          { x: 'Anoto en la hoja “llegaron 398, faltan 2” y firmo debajo de eso.', tono: 'ok',
            porque: 'Eso. Tu firma queda sobre lo que de verdad recibiste. El faltante queda escrito, con el chofer todavía ahí. Si el proveedor se equivocó, lo reclaman con la hoja en la mano.<br><b>Consejo de piso:</b> lo que no está escrito en la hoja no pasó. Anótalo antes de firmar, con el chofer presente. Cuando se va, ya no hay quien lo confirme.' },
          { x: 'Firmo 400 y después le escribo un mensaje al proveedor.', tono: 'mal',
            porque: 'Un mensaje después no pesa nada. La hoja firmada dice 400, y es la que cuenta.' },
          { x: 'No firmo y mando el camión de vuelta con todo.', tono: 'parcial',
            porque: 'Mandar de vuelta 398 cajas buenas por 2 que faltan es exagerar. Lo normal es recibir lo que llegó y dejar escrito lo que faltó. Si tu empresa tiene otra regla para esto, Don Ramón te la dice.' }
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
        texto: '¿Qué haces?',
        opciones: [
          { x: 'Lo dejo así. Es el mismo jugo.', tono: 'mal',
            porque: 'Es el mismo SKU, pero otro lote, y se vence dos meses antes. Si se mezcla con los demás, nadie sabe cuál sacar primero y esas cajas se pueden vencer en el estante.' },
          { x: 'Anoto lo que dice la etiqueta de esa paleta y la dejo separada de las demás.', tono: 'ok',
            porque: 'Eso. Manda la etiqueta del producto, no la hoja. Son dos lotes distintos y se anotan como dos.<br><b>Consejo de piso:</b> compara la etiqueta de cada paleta con la hoja, no solo la primera. Lo que se vence primero tiene que poder verse primero; más adelante vas a ver por qué.' },
          { x: 'Cambio el lote en la hoja para que cuadre.', tono: 'mal',
            porque: 'Esa hoja es del proveedor. Tú no la corriges: tú anotas lo que ves, aparte. Cambiarla para que cuadre es esconder el problema, no resolverlo.' },
          { x: 'Rechazo esa paleta.', tono: 'parcial',
            porque: 'Puede que toque rechazarla, si tu empresa tiene esa regla. Pero no lo decides tú solo: primero lo anotas y le preguntas a Don Ramón.' }
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
        texto: '¿Qué haces?',
        opciones: [
          { x: 'La recibo, la anoto en la hoja como “1 caja con cartón mojado” y le tomo una foto antes de que el camión se vaya.', tono: 'ok',
            porque: 'Eso. Queda constancia de cómo llegó, con el chofer presente. Si después esa caja da problemas, no es tu palabra contra la del proveedor.<br><b>Consejo de piso:</b> la foto con el celular toma cinco segundos y vale más que cualquier explicación después. Tómala antes de que el camión arranque.' },
          { x: 'La recibo y no digo nada. Es una sola caja.', tono: 'mal',
            porque: 'Si después esa caja aparece dañada, nadie puede probar que llegó así. Va a parecer que se dañó en tu almacén.' },
          { x: 'La saco a un lado y no la cuento.', tono: 'mal',
            porque: 'Si no la cuentas, el conteo te da 397 y te inventas una diferencia de 24 unidades. Lo dañado también se cuenta; se anota aparte.' },
          { x: 'Le pido al chofer que se la lleve de vuelta.', tono: 'parcial',
            porque: 'Si la caja está mojada pero entera, rechazarla depende de la regla de tu empresa. Antes de dejar que se la lleve, anótala y consúltalo con Don Ramón.' }
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
        texto: '¿Qué le contestas?',
        opciones: [
          { x: 'En el primer hueco libre que vea, una tras otra, en el orden en que bajaron del camión.', tono: 'mal',
            porque: 'Es rápido, pero así no sabes qué va a salir primero. El pasillo se saca desde la puerta hacia el fondo, y lo que se vence antes puede terminar en el fondo, esperando hasta vencerse.' },
          { x: 'Miro qué se vence primero y lo pongo donde se saque primero.', tono: 'ok',
            porque: 'Eso. En el pasillo no solo se guarda: se decide en qué orden va a salir todo. Ahora vas a hacerlo con las 10 paletas.' },
          { x: 'Donde me quede más cerca del muelle, para caminar menos.', tono: 'mal',
            porque: 'Caminar menos es un buen deseo, pero no es el criterio. Si lo único que cuenta es tu comodidad, el jugo que se vence primero se queda atrás y se pierde.' },
          { x: 'Le pregunto a Don Ramón dónde va cada una.', tono: 'parcial',
            porque: 'Preguntar no está mal, pero Don Ramón te va a contestar con la regla: lo que se vence primero tiene que salir primero. Mejor la aprendes ahora, para no preguntar diez veces.' }
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
        texto: 'Había 4 paletas de 40 cajas, o sea 160 cajas. Hoy entraron las 398 que contaste, no las 400 de la hoja. ¿Cuántas <b>cajas</b> hay ahora en el pasillo B?',
        campos: [{ etiqueta: 'Cajas', respuesta: 558 }],
        porque: '160 + 398 = <b>558 cajas</b>. Si alguien pasa eso a botellas: 558 × 24 = 13,392. Ese 13,392 es el que va a decir el sistema más tarde. No hace falta adivinarlo: sale de esta cuenta.',
        pistas: [
          { si: v => v[0] === 560, x: 'Usaste las 400 de la hoja. Lo que entró de verdad fueron las que contaste: 398.' },
          { si: v => v[0] === 398, x: 'Esas son solo las de hoy. Faltan las 4 paletas que ya estaban.' },
          { si: v => v[0] === 160, x: 'Esas son solo las que ya estaban. Falta lo que entró hoy.' }
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
        texto: '¿De cuál sacas?',
        opciones: [
          { x: 'De B-02, como dice el sistema. El sistema sabe.', tono: 'mal',
            porque: 'Ese sistema sigue una regla que mira cuándo llegó, no cuándo se vence. Si sacas de B-02, la paleta de B-01 se queda esperando y se puede vencer en el estante.' },
          { x: 'De B-01, que se vence primero, y aviso para que corrijan el sistema.', tono: 'ok',
            porque: 'Eso. Manda la fecha. Si sacas por orden de llegada y el producto se vence antes, pierdes producto. Y avisas, para que el sistema deje de sugerir mal.<br><b>Consejo de piso:</b> un sistema configurado en FIFO no mira la fecha del producto; tú sí. Si lo que dice la pantalla y lo que dice la etiqueta no coinciden, manda la etiqueta.' },
          { x: 'De B-15, que es la que menos estorba.', tono: 'mal',
            porque: 'Lo que menos estorba no es criterio. B-15 es la del fondo y es de las que vence más tarde.' },
          { x: 'Le pregunto a Don Ramón qué hago.', tono: 'parcial',
            porque: 'Si dudas, preguntar no está mal. Pero esta ya la sabes: manda la fecha. Avísale con el dato en la mano: “el sistema dice B-02, pero B-01 vence antes”.' }
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
        texto: '¿Cómo la anotas?',
        opciones: [
          { x: 'De memoria, cuando termine con todas las paletas.', tono: 'mal',
            porque: 'De memoria, B-01 se convierte en B-10 sin que te des cuenta. Y una paleta anotada en el lugar equivocado es una paleta perdida: el sistema la busca donde no está, y la que está en B-01 no la anotó nadie. Eso vuelve a aparecer a las 5:30, como un faltante en un lado y un sobrante en el otro.' },
          { x: 'En el momento, leyendo el código del espacio donde la dejé.', tono: 'ok',
            porque: 'Eso. La ubicación se anota en el momento y con el código a la vista, no de memoria.<br><b>Consejo de piso:</b> un sobrante no es ganancia, es un faltante escondido en otro lado. Si algo aparece donde no debía, busca primero el faltante gemelo antes de ajustar nada.' },
          { x: 'Después, cuando tenga un momento tranquilo.', tono: 'mal',
            porque: 'Mientras tanto la paleta existe, pero para el sistema no está en ningún lado. Si alguien necesita ese jugo, no lo encuentra.' },
          { x: 'Le pego un papel con el número y la anoto luego.', tono: 'parcial',
            porque: 'El papel ayuda, pero sigue siendo anotar después. El papel es un respaldo, no el registro. Lo que cuenta es lo que queda en el sistema en el momento.' }
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
        texto: 'Hay 13,392 botellas. Salen 40 cajas y cada caja trae 24 botellas. ¿Cuántas <b>botellas</b> quedan?',
        campos: [{ etiqueta: 'Botellas que quedan', respuesta: 12432 }],
        porque: 'Primero las cajas se pasan a botellas: 40 × 24 = 960. Después se restan: 13,392 − 960 = <b>12,432</b>.',
        pistas: [
          { si: v => v[0] === 13352, x: 'Restaste 40. Esas 40 son cajas, y 13,392 son botellas. Primero haz 40 × 24.' },
          { si: v => v[0] === 14352, x: 'Sumaste 960. 960 es lo que sale (40 × 24). Lo que sale se resta.' },
          { si: v => v[0] === 960, x: '960 es lo que sale, no lo que queda. Falta restarlo de 13,392.' },
          { si: v => v[0] === 13392, x: 'Eso es lo que había. Falta restar las 40 cajas pasadas a botellas.' },
          { si: v => v[0] === 40, x: '40 son las cajas. Te piden las botellas que quedan.' }
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
        texto: 'El kárdex cerró en 10,392 botellas. Cada caja trae 24. ¿Cuántas <b>cajas</b> son? Divide 10,392 entre 24.',
        campos: [{ etiqueta: 'Cajas', respuesta: 433 }],
        porque: '10,392 ÷ 24 = <b>433 cajas</b>. Se comprueba: 433 × 24 = 10,392. Son las 558 cajas de la mañana, menos las 125 que salieron hoy.',
        pistas: [
          { si: v => v[0] === 10392, x: 'Esas son las unidades. Te piden cuántas cajas son.' },
          { si: v => v[0] === 1732,  x: 'Dividiste entre 6 y te quedaste en paquetes. Cada caja trae 24 unidades.' },
          { si: v => v[0] === 2598,  x: 'Dividiste entre 4. Cada caja trae 24 unidades, no 4.' },
          { si: v => v[0] === 432,   x: 'Casi. 432 × 24 = 10,368, y todavía faltan 24 unidades para llegar a 10,392.' }
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
        texto: '¿Qué haces?',
        opciones: [
          { x: 'Se las doy y las anoto cuando tenga tiempo.', tono: 'mal',
            porque: 'Mientras no se anoten, esas 5 cajas ya no están en el estante pero siguen en el papel. 5 × 24 = 120 botellas. Esa diferencia vuelve a aparecer a las 5:30, y nadie va a saber de dónde salió.' },
          { x: 'Le digo que sin vale no sale nada, y si es urgente le hago el vale ahí mismo y lo anoto en el momento.', tono: 'ok',
            porque: 'Eso. Todo lo que sale tiene un papel y una línea en el kárdex, aunque sea una muestra y aunque sea el vendedor. Un vale toma 30 segundos.<br><b>Consejo de piso:</b> lo que sale “de favor” es lo que más hace que las cuentas no cuadren. Lo grande se vigila; lo chiquito se pierde.' },
          { x: 'Se las doy y no las anoto. Son solo 5 cajas.', tono: 'mal',
            porque: 'Son 5 cajas, y cada caja son 24 botellas: 5 × 24 = 120. Lo chiquito, repetido todos los días, es lo que se va sin que nadie lo note.' },
          { x: 'Le digo que hable con Don Ramón.', tono: 'parcial',
            porque: 'Don Ramón puede autorizar la salida, pero autorizar no es anotar. Aunque él diga que sí, la salida igual lleva su vale y su línea en el kárdex.' }
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
        texto: '¿Cómo lo arreglas?',
        opciones: [
          { x: 'Borro la línea y la escribo bien.', tono: 'mal',
            porque: 'Si en el kárdex se puede borrar, también se puede borrar para esconder algo. Sin rastro no hay manera de saber qué pasó ni quién lo hizo.' },
          { x: 'Dejo la línea como está y anoto otra que la corrige, con una nota que dice qué pasó.', tono: 'ok',
            porque: 'Eso. En el kárdex no se borra: se corrige con otra línea. Quedan las dos, el error y la corrección, y se ve qué pasó.<br><b>Consejo de piso:</b> escribe la nota como si se la fueras a leer a alguien que no estuvo: qué se anotó mal, cuál era lo correcto y a qué hora lo arreglaste.' },
          { x: 'No hago nada. En el conteo de hoy se arregla solo.', tono: 'mal',
            porque: 'El conteo no arregla nada. Te va a mostrar la diferencia que ya calculamos, 6,480 botellas, y vas a perder la tarde buscándola.' },
          { x: 'Le pido a Don Ramón que la borre.', tono: 'parcial',
            porque: 'Avisarle está bien, y puede que él tenga que autorizar la corrección. Pero el arreglo sigue siendo otra línea, no borrar la que está.' }
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
    it.due = it.box >= 3 ? null : hoy();
  } else {
    it.fallos++; it.box = 0; it.due = hoy();
  }
  revisarInsignias(); guardar(); pintarBarra();
}

const paraHoy = () => Object.keys(E.items).filter(id => { const it = E.items[id]; return INDICE[id] && it.box >= 0 && it.box < 3 && it.due && it.due <= hoy(); });
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

/* Al hablar, el término de almacén va con su nombre de piso, para que se quede. */
function explicar(texto) {
  return sinTags(texto)
    .replace(/\bcajas\b/gi, 'cajas, o sea los empaques')
    .replace(/\bcaja\b/gi, 'caja, o sea el empaque')
    .replace(/\bunidades\b/gi, 'unidades, las botellas sueltas')
    .replace(/\bunidad\b/gi, 'unidad, la botella suelta')
    .replace(/\bpaletas\b/gi, 'paletas, las tarimas')
    .replace(/\bpaleta\b/gi, 'paleta, la tarima')
    .replace(/\bkárdex\b/gi, 'kárdex, la libreta de entradas y salidas')
    .replace(/\bkardex\b/gi, 'kárdex, la libreta de entradas y salidas')
    .replace(/\bSKU\b/g, 'código del producto')
    .replace(/\bvale\b/gi, 'vale, el papel de lo que sale')
    .replace(/\blote\b/gi, 'lote, el grupo de la misma fabricación')
    .replace(/\brecepción\b/gi, 'recepción, el momento en que entra la mercancía');
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
        fb.replaceChildren(feedback('verde', 'Correcto', op.porque, origenDOM(q, ctx)));
        Sonido.decir(op.porque);
        ctx.alResolver(q.id, true);
      } else if (op.tono === 'parcial') {
        Sonido.parcial();
        fb.replaceChildren(feedback('amarillo', 'Sirve, pero hay una que cuadra mejor', op.porque + ' Mira las otras con calma.'));
        Sonido.decir(op.porque);
      } else {
        Sonido.mal();
        fb.replaceChildren(feedback('rojo', 'Esa no cuadra', op.porque + ' Hay otra que sí. Léela con calma.'));
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
      fb.replaceChildren(feedback('amarillo', 'Falta el número', 'Escribe un número en cada casilla. Puede ser el de las cajas o el de las botellas, según lo que pide arriba.'));
      return;
    }
    const ok = vals.every((v, i) => v === q.campos[i].respuesta);
    if (primera) { primera = false; okPrimera = ok; ctx.alPrimera(q.id, ok); }
    if (ok) {
      const vuelve = avisoVuelve(q.id, !okPrimera);
      fb.replaceChildren(feedback('verde', 'Correcto', q.porque, origenDOM(q, ctx)));
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
    fb.replaceChildren(feedback('rojo', 'Esa cuenta no cuadra', (pista ? pista.x : 'Revisa la cuenta con calma. El número de arriba ya dice con qué multiplicar o restar.') , extra));
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
    <div class="atajos">
      <button type="button" class="btn btn-sec btn-chico" data-set="1">1 caja</button>
      <button type="button" class="btn btn-sec btn-chico" data-set="10">10 cajas</button>
      <button type="button" class="btn btn-sec btn-chico" data-set="100">100 cajas</button>
    </div>
    <svg class="caja-svg" viewBox="0 0 320 190" role="img"></svg>
    <div class="pie-svg" data-pie></div>
    <div class="escalera" data-esc></div>
    <div class="veredicto-w" data-ver style="margin-top:1rem"></div>
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

    q('[data-valor]').textContent = plural(n, 'caja', 'cajas');
    svg.innerHTML = dibujar(ppc);
    svg.setAttribute('aria-label', 'Una caja con 4 paquetes de 6 botellas, 24 en total');
    q('[data-pie]').textContent = 'Esta caja trae 4 paquetes de 6 botellas. Total: 24 botellas.';

    q('[data-esc]').innerHTML = `
      <div class="peldano habla"><span class="nombre">Caja</span><span class="cant">${fmt(n)}</span><span class="quien-habla">Esto dice el chofer</span><span class="nota-p">1 caja = 4 paquetes</span></div>
      <div class="peldano"><span class="nombre">Paquete</span><span class="cant">${fmt(n * ppc)}</span><span class="nota-p">1 paquete = 6 botellas</span></div>
      <div class="peldano habla"><span class="nombre">Botella</span><span class="cant">${fmt(botellas)}</span><span class="quien-habla">Esto dice la pantalla</span></div>`;

    const ver = q('[data-ver]');
    ver.className = 'veredicto-w t-verde';
    ver.innerHTML = `<b>Así se pasa</b>${fmt(n)} cajas × 24 botellas = ${fmt(botellas)}. El chofer dice cajas. La pantalla dice botellas.`;
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
    const b = el('button', { type: 'button', class: 'paleta-btn', 'data-n': p.n }, el('b', null, 'Paleta ' + p.n), el('span', null, 'sin contar'));
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
      b.lastChild.textContent = hecha ? total(p) + ' cajas' : 'sin contar';
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
      const b = el('button', { type: 'button', class: 'paleta-btn' + (sel === p.n ? ' sel' : '') },
        el('b', null, 'Paleta ' + p.n), el('span', null, 'vence ' + p.txt));
      b.addEventListener('click', () => { sel = p.n; ultima = { paleta: p }; pintar(); });
      muelle.append(b);
    });
    if (!pendientes.length) muelle.append(el('p', { class: 'vacio' }, 'El muelle quedó vacío.'));

    const pas = q('[data-pasillo]');
    pas.replaceChildren();
    for (let i = 1; i <= N; i++) {
      const o = ocupante(i);
      let clase = 'espacio', linea2 = 'libre';
      if (ocupados[i]) { clase += ' viejo'; linea2 = 'ya había ' + o.txt; }
      else if (o) { clase += malEspacios.has(i) ? ' mal' : ' puesto'; linea2 = 'P' + o.n + ' · ' + o.txt; }
      if (ocupados[i] && malEspacios.has(i)) clase += ' mal';
      const b = el('button', { type: 'button', class: clase }, el('b', null, cod(i)), el('span', null, linea2));
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
    art.insertBefore(el('aside', { class: 'nota' }, el('p', null, 'Ya terminaste esta lección. Puedes verla otra vez; lo que contestes aquí no cambia tus puntos.')), art.firstChild);
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
    el('div', { class: 'cifra' }, el('span', null, 'Aciertos'), el('span', { class: 'v' }, fmt(E.puntos)))));

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
  const firmes = vistos.filter(id => E.items[id].box >= 2 && !E.items[id].due).length;

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

const Voz = {
  soportada: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  activa: false, token: 0, alFin: null,

  elegir() {
    const vs = speechSynthesis.getVoices() || [];
    for (const pref of ['es-do', 'es-us', 'es-mx', 'es-419', 'es-es', 'es']) {
      const v = vs.find(x => x.lang && x.lang.replace('_', '-').toLowerCase().startsWith(pref));
      if (v) return v;
    }
    return null;
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
    const partes = this.trocear(texto);
    partes.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = voz ? voz.lang : 'es-US';
      if (voz) u.voice = voz;
      u.rate = 0.95;
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
  $('#datoPuntos').innerHTML = `Aciertos <b>${fmt(E.puntos)}</b>`;
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
