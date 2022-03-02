# Estructura provisional de la parte de Matemáticas

* **Introducción** (común a ambas partes)
  * Qué son fractales y alguna pincelada de algo a nivel superficial
  * Qué voy a contar
  * Fotitos chulas, a ser posible que no sean demasiadas páginas de fotos.
  * Meter cosas relacionadas con lo que se espera hacer en la parte de informática (no mojarme).
  * (Un par de páginas de extensión? Sin contar fotos)
* **Capítulo 1: El concepto de fractal**
  * Autosimilaridad: Antes de poner ejemplos de fractales, incluir ejemplos de la vida real, como un [romanescu](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Romanesco_broccoli_%28Brassica_oleracea%29.jpg/800px-Romanesco_broccoli_%28Brassica_oleracea%29.jpg), un [helecho](https://biblioteca.acropolis.org/wp-content/uploads/2014/10/helecho.jpg) y ya veremos qué más. Poner ejemplos más técnicos como el triángulo de Sierpinski, la curva de Koch, la alfombra de Sierpinski y la esponja para añadir ejemplo en 3D. 
  * Aprovechando la autosimilaridad y los ejemplos, definir dimensión: dimensión fractal autosimilar, dimensión por cajas, dimensión de Hausdorff, dimensión topológica.
  * Pillar algún ejemplo y calcularle la dimensión y ver que no coincide con la topológica. 
  * A partir del ejemplo -> Definición según Mandelbrot de fractal.
* **Capítulo 2: Iteración**
  * Partimos de lo que se dio en Modelos Matemáticos I de atractores, iteración y tal en la recta real. Añadimos iteración en el plano complejo. ¿Quizá la chapa se debería llevar a un anexo en vez de darse por sabida?
  * Meter alguna gráfica medio chula de estas de atractores, repulsores y ciclos.
  * El juego del caos para ir abriendo boca. ¿Quizá esto rente más en la parte de orden y caos de la dinámica de poblaciones? ¿O en el apartado de SFI?
  * Números complejos y método de Newton se dan por sabidos (buscar referencia).
  * Cuencas de atracción en los complejos y aquí incluimos algunas imágenes. Las que requieren demasiado tiempo que se ejecuten en el despacho si a Manuel no le importa.
* **Capítulo 3: Conjuntos de Julia**
  * Definición genérica. Familia $\{z^2+c\}_{c\in\mathbb C}$. Particularidades de las cuencas de atracción.
  *  Una vez definido y expresado en términos matemáticos, mostrar imágenes y código.
  * Pincelada no demasiado intensa de conjuntos de Julia generalizados, incluir imágenes y algo de código pero no entrar demasiado en detalle. Incluir aquí los conjuntos con polinomios de orden superior.
  * Discernir entre conjuntos de Julia conexos o polvaredas, de enganche con el siguiente capítulo.
  * Madre mía qué chapa voy a pegar.
* **Capítulo 4: El conjunto de Mandelbrot**
  * Definición a partir del tema de los conjuntos de Julia conexos y polvaredas.
  * ¿Chapa sobre la anatomía de los bulbos? Un poco solo no?
  * Recordamos Julia generalizados para hablar de M generalizado, pero lo mismo, no insistir demasiado.
  * Fotos, aquí hacen falta fotos.
* **Capítulo 5: Dinámica de poblaciones**
  * Comentar el point de la ecuación logística y el modelo de Verhulst pero aprovechando que se dio en MMI, tema de que independientemente del $x_0$ la convergencia es igual (al menos en los casos que converge a un punto fijo). 
  * Análisis según el valor de $k$, breve pero riguroso.
  * A partir del análisis, presentar el diagrama de órbita. Explicar particularidades y autosimilaridad del diagrama de órbita. 
  * Orden en caos y constante de Feigenbaum, muy curiosa. A partir de esto presentar los otros diagramas y a ver si podemos comprobar el resultado con otros ejemplos.
* **Capítulo 6: Sistemas de funciones iteradas**
  * Transformaciones afines y formas de expresarlas con seis números. A partir de aquí definir SFI.
  * Definido SFI, incluir el intermezzo de la topología para SFI.
  * Una vez explicado el intermezzo, incluir ejemplos.
  * Aquí introducir el problema inverso y el teorema del collage.
* **Capítulo 7: Plantas y L-Sistemas**
  * Dejar caer el tema de las plantas e intentar entender los códigos esos del 7.1 e incluirlos (low priority).
  * El apartado de los árboles out.
  * Definir L-Sistemas y poner ejemplos como la curva de Koch. Si soy capaz codificar el triángulo de Sierpinski.
  * Filotaxis me parece de lo más interesante pero la veo poco relacionada con el tema.
* **Anexo**
  * Convergencia de las iteradas en la recta real
  * Método de Newton-Raphson
  * Ecuación logística y convergencia.

