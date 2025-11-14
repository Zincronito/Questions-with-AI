const API_KEY = "AIzaSyARU-9pT_D9VvQYTwg_CYySpZicT2jJh4o"; // Clave ficticia para ejemplo
const MODEL = "gemini-2.0-flash"; // Modelo actualizado a 2.5
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const temas = [
    "concepto de arreglo y operaciones sobre arreglos",
    "concepto de diccionarios y funciones básicas",
    "operadores lógicos, aritméticos, de comparación, ternario",
    "uso de la consola para debuggear",
    "funciones con parámetros por default"
];

const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];

const prompt = `En el contexto de JavaScript, CSS y HTML. Genera una pregunta de opción múltiple sobre el siguiente tema ${temaAleatorio}. Proporciona cuatro opciones de respuesta y señala cuál es la correcta.

Genera la pregunta y sus posibles respuestas en formato JSON como el siguiente ejemplo, asegurándote de que el resultado SÓLO contenga el objeto JSON y no texto adicional enseguida te doy dos ejemplos:

1. Sobre arreglos en JavaScript:
{
  "question": "¿Cuál de los siguientes métodos agrega un elemento al final de un arreglo en JavaScript?",
  "options": [
    "a) shift()",
    "b) pop()",
    "c) push()",
    "d) unshift()"
  ],
  "correct_answer": "c) push()",
  "explanation": "El método push() agrega uno o más elementos al final de un arreglo y devuelve la nueva longitud del arreglo."
}
2. Sobre eventos en JavaScript:
{
  "question": "¿Cuál de los siguientes eventos se dispara cuando un usuario hace clic en un elemento HTML?",
  "options": [
    "a) onmouseover",
    "b) onclick",
    "c) onload",
    "d) onsubmit"
  ],
  "correct_answer": "b) onclick",
  "explanation": "El evento 'onclick' se dispara cuando un usuario hace clic en un elemento HTML, permitiendo ejecutar funciones en respuesta a ese clic."
}
`;

let preguntaActual = null;
// Para evitar que el usuario haga clic en más de una opción por pregunta.
let respuestaSeleccionada = false; 

// ** NUEVAS VARIABLES GLOBALES PARA CONTADORES **
let contadorCorrectas = 0;
let contadorIncorrectas = 0;

// ** NUEVAS FUNCIONES DE LOCAL STORAGE **

/**
 * Carga los contadores guardados en localStorage.
 */
function cargarContadores() {
    // Usamos '|| 0' para asegurar que el valor sea 0 si es la primera vez que se carga
    const correctasGuardadas = localStorage.getItem('triviaCorrectas');
    const incorrectasGuardadas = localStorage.getItem('triviaIncorrectas');
    
    contadorCorrectas = correctasGuardadas ? parseInt(correctasGuardadas, 10) : 0;
    contadorIncorrectas = incorrectasGuardadas ? parseInt(incorrectasGuardadas, 10) : 0;
    
    desplegarContadores();
}


function guardarContadores() {
    localStorage.setItem('triviaCorrectas', contadorCorrectas);
    localStorage.setItem('triviaIncorrectas', contadorIncorrectas);
}

function desplegarContadores() {
    const correctasElement = document.getElementById('correctas');
    const incorrectasElement = document.getElementById('incorrectas');

    if (correctasElement) {
        correctasElement.textContent = contadorCorrectas;
    }
    if (incorrectasElement) {
        incorrectasElement.textContent = contadorIncorrectas;
    }
}



async function respuestaAPI() {
    try {
        const response = await fetch(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    // Opcional: añadir la configuración de generación
                    generationConfig: {
                        temperature: 0.25,
                        responseMimeType: "application/json"
                    },
                }),
            }
        );

        // Manejo de errores de HTTP
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log("Respuesta transformada a json:", data);

        // Extracción simple del texto de la respuesta, asumiendo que la respuesta tiene al menos una 'candidate' y 'part'
        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        const textResultTrimmed = textResult.trim();
        const firstBraceIndex = textResultTrimmed.indexOf('{');
        const lastBraceIndex = textResultTrimmed.lastIndexOf('}');
        const jsonString = textResultTrimmed.substring(firstBraceIndex, lastBraceIndex + 1);


        if (jsonString) {
            const questionData = JSON.parse(jsonString);
            console.log("Pregunta parseada:", questionData);
            return questionData;
        } else {
            console.log("No se pudo extraer el texto de la respuesta o el formato JSON es incorrecto.");
        }
        return null; // Asegurar que siempre se devuelve algo
    } catch (error) {
        console.error("Hubo un error en la petición:", error);
        // Si hay un error, actualiza el mensaje de error en pantalla
        const questionElement = document.getElementById('question');
        if (questionElement) {
             questionElement.textContent = 'Error al cargar la pregunta. Por favor, revisa la clave API o la consola.';
        }
        return null;
    }
}

function verificarRespuesta(selectedButton, selectedOptionText) {
    if (respuestaSeleccionada) {
        return; 
    }
    
    // Marcar que ya se seleccionó una respuesta
    respuestaSeleccionada = true; 

    // Obtener la respuesta correcta y la explicación
    const respuestaCorrecta = preguntaActual.correct_answer;
    const explicacionTexto = preguntaActual.explanation; // <-- Obtenemos la explicación

    // ** Lógica clave: Compara la respuesta **
    if (selectedOptionText === respuestaCorrecta) {
        // Respuesta correcta: Poner el botón en verde
        selectedButton.classList.remove('btn-outline-primary');
        selectedButton.classList.add('btn-success');
        console.log("¡Respuesta Correcta!");
        
        // ** NUEVO: Incrementar el contador de correctas y guardar **
        contadorCorrectas++;
        guardarContadores();
        
    } else {
        // Respuesta incorrecta: Poner el botón en rojo
        selectedButton.classList.remove('btn-outline-primary');
        selectedButton.classList.add('btn-danger');
        console.log("Respuesta Incorrecta. La correcta era:", respuestaCorrecta);
        
        // ** NUEVO: Incrementar el contador de incorrectas y guardar **
        contadorIncorrectas++;
        guardarContadores();

        // Mostrar la respuesta correcta en verde (Buscar y marcar el botón correcto)
        const optionsContainer = document.getElementById('options');
        const allButtons = optionsContainer.querySelectorAll('button');
        allButtons.forEach(button => {
            if (button.textContent === respuestaCorrecta) {
                button.classList.remove('btn-outline-primary', 'btn-danger'); // Remover por si acaso
                button.classList.add('btn-success');
            }
            // Desactivar todos los botones después de responder
            button.disabled = true; 
        });
    }

    // Actualizar la interfaz de los contadores
    desplegarContadores(); 

    // Mostrar la explicación
    const explicacionElement = document.getElementById('explicacion');
    if (explicacionElement) {
        explicacionElement.textContent = explicacionTexto;
    }
    
    // Después de 3 segundos, cargar la siguiente pregunta
    setTimeout(() => {
        cargarPregunta();
    }, 3000);
}


function desplegarPregunta(data) {
    // ** CAMBIO CLAVE **: Guardamos la data en la variable global
    preguntaActual = data;
    respuestaSeleccionada = false; // Resetear el estado para la nueva pregunta

    // Limpiar la explicación anterior al cargar una nueva pregunta
    const explicacionElement = document.getElementById('explicacion');
    if (explicacionElement) {
        explicacionElement.textContent = ''; // Asegurar que esté vacío al inicio
    }

    // 1. Mostrar la pregunta
    const questionElement = document.getElementById('question');
    questionElement.textContent = data.question;
    questionElement.className = 'fs-5 text-dark'; // Quitar el color de carga

    // 2. Mostrar las opciones
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = ''; // Limpiar opciones anteriores

    data.options.forEach((optionText) => {
        // Crear el botón para cada opción
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary text-start';
        button.textContent = optionText;
        
        // Al hacer clic, llama a la función de verificación
        button.onclick = () => verificarRespuesta(button, optionText); 

        optionsContainer.appendChild(button);
    });
}

/**
 * Función principal para cargar la pregunta.
 */
async function cargarPregunta() {
    // Mostrar mensaje de carga
    const questionElement = document.getElementById('question');
    if (questionElement) {
        questionElement.className = 'text-warning fs-5';
        questionElement.textContent = 'Cargando pregunta de Gemini...';
    }
    document.getElementById('options').innerHTML = '';
    // Limpiar la explicación en el estado de carga
    const explicacionElement = document.getElementById('explicacion');
    if (explicacionElement) {
        explicacionElement.textContent = '';
    }

    const datosPregunta = await respuestaAPI();
    
    if (datosPregunta) {
        desplegarPregunta(datosPregunta);
    }
}

window.onload = () => {
    console.log("Página cargada y función inicial ejecutada.");
    // ** CAMBIO CLAVE **: Ahora cargamos los contadores antes de todo
    cargarContadores();
    cargarPregunta();
};