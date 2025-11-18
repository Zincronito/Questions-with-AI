const API_KEY = "AIzaSyARU-9pT_D9VvQYTwg_CYySpZicT2jJh4o"; // Clave ficticia para ejemplo
const MODEL = "gemini-2.0-flash"; // Modelo actualizado a 2.5
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const temas = [
    "capitulos de los simpsons",
    "personajes de los simpsons",
    "momentos icónicos de los simpsons",
    "personajes secundarios de los simpsons",
    "lugares en springfield",
];

// *******************************************************************
// *** ELIMINAMOS PROMPT Y TEMA ALEATORIO DE AQUÍ (ZONA GLOBAL) ***
// *******************************************************************

let preguntaActual = null;
let respuestaSeleccionada = false; 

let contadorCorrectas = 0;
let contadorIncorrectas = 0;


function cargarContadores() {
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
    

        const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];

        const prompt = `En el contexto de la serie los Simpsons. Genera una pregunta de opción múltiple sobre el siguiente tema ${temaAleatorio}. Proporciona cuatro opciones de respuesta y señala cuál es la correcta.

Genera la pregunta y sus posibles respuestas en formato JSON como el siguiente ejemplo, asegurándote de que el resultado SÓLO contenga el objeto JSON y no texto adicional enseguida te doy dos ejemplos:

1. Sobre personajes en los Simpsons:
{
  "question": "¿Cual es el personahe que representa la soledad y la obsesion por los felinos, con una hisotira tragica detras de su comportamiento excentrico en lso simpsons?",
  "options": [
    "a) Homer Simpson",
    "b) Ned Flanders",
    "c) la loca de los gatos",
    "d) lisa Simpson"
  ],
  "correct_answer": "c) la loca de los gatos",
  "explanation": "El personaje es conocdido por su comportamiento erratico y su amor desmesurado por los gatos, a menudo arrojandolos a las personas que se le acercan."
}
2. Sobre capitulos en Los Simpsons:
{
  "question": "En que capitulo de los simpsons se parodia la pelicula 'El Exorcista' con la historia de una niña poseida por un demonio?",
  "options": [
    "a) Un estofado de miedo III",
    "b) Treehouse of Horror XXVIII",
    "c) Planeta de los simios",
    "d) Pasado furioso"
  ],
  "correct_answer": "b) Un estofado de miedo XXVIII",
  "explanation": "En este episodio se ve el exorcismo de la niña."
}
`;
        // ***************************************************************
        
        const response = await fetch(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }] // Usamos el nuevo prompt
                    }],
                    generationConfig: {
                        temperature: 0.25,
                        responseMimeType: "application/json"
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log("Respuesta transformada a json:", data);

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
        return null; 
    } catch (error) {
        console.error("Hubo un error en la petición:", error);
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
    
    respuestaSeleccionada = true; 

    const respuestaCorrecta = preguntaActual.correct_answer;
    const explicacionTexto = preguntaActual.explanation; 

    if (selectedOptionText === respuestaCorrecta) {
        selectedButton.classList.remove('btn-outline-primary');
        selectedButton.classList.add('btn-success');
        console.log("¡Respuesta Correcta!");
        
        contadorCorrectas++;
        guardarContadores();
        
    } else {
        selectedButton.classList.remove('btn-outline-primary');
        selectedButton.classList.add('btn-danger');
        console.log("Respuesta Incorrecta. La correcta era:", respuestaCorrecta);
        
        contadorIncorrectas++;
        guardarContadores();

        const optionsContainer = document.getElementById('options');
        const allButtons = optionsContainer.querySelectorAll('button');
        allButtons.forEach(button => {
            if (button.textContent === respuestaCorrecta) {
                button.classList.remove('btn-outline-primary', 'btn-danger'); 
                button.classList.add('btn-success');
            }
            button.disabled = true; 
        });
    }

    
    desplegarContadores(); 

 
    const explicacionElement = document.getElementById('explicacion');
    if (explicacionElement) {
        explicacionElement.textContent = explicacionTexto;
    }
    
   
    setTimeout(() => {
        // Llama a cargarPregunta, que a su vez llama a respuestaAPI, 
        // ¡y ahora genera un nuevo prompt!
        cargarPregunta();
    }, 3000);
}


function desplegarPregunta(data) {
   
    preguntaActual = data;
    respuestaSeleccionada = false; 

    
    const explicacionElement = document.getElementById('explicacion');
    if (explicacionElement) {
        explicacionElement.textContent = ''; 
    }

    const questionElement = document.getElementById('question');
    questionElement.textContent = data.question;
    questionElement.className = 'fs-5 text-dark';   

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';    

    data.options.forEach((optionText) => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary text-start';
        button.textContent = optionText;
        
        button.onclick = () => verificarRespuesta(button, optionText); 

        optionsContainer.appendChild(button);
    });
}




async function cargarPregunta() {
    
    const questionElement = document.getElementById('question');
    if (questionElement) {
        questionElement.className = 'text-warning fs-5';
        questionElement.textContent = 'Cargando pregunta de Gemini...';
    }
    document.getElementById('options').innerHTML = '';
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

    cargarContadores();
    cargarPregunta();
};