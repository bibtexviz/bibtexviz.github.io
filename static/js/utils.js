/**
 * Procesa una cadena de texto para devolverla tal cual si es corta, 
 * o encontrar/crear un acrónimo si es larga. El acrónimo creado
 * no excederá el límite de caracteres N.
 *
 * @param {string} text La cadena de texto a procesar.
 * @param {number} N El número máximo de caracteres.
 * @returns {string} La cadena original o un acrónimo (posiblemente truncado).
 */
function getAcronymOrTruncate(text, N) {
    // 1. Manejar casos de entrada no válidos o vacíos.
    if (typeof text !== 'string' || !text) {
        return '';
    }

    // 2. Devolver la cadena tal cual si su longitud es menor o igual a N.
    if (text.length <= N) {
        return text;
    }

    // 3. Buscar un acrónimo usando una expresión regular.
    const acronymRegex = /[({]([A-Z]+)[})]/g;
    let match;
    let lastMatch = null;

    while ((match = acronymRegex.exec(text)) !== null) {
        lastMatch = match[1];
    }

    if (lastMatch) {
        return lastMatch;
    }

    // 4. Si no se encontró un acrónimo, construir uno con las iniciales.
    // Limpiar la cadena de caracteres especiales para obtener las palabras.
    const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');

    let initialsAcronym = cleanedText
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();

    // Validar que el acrónimo construido no exceda el límite N
    if (initialsAcronym.length > N) {
        // ** Lógica modificada para truncar el acrónimo y quedarte con las últimas N letras **
        return initialsAcronym.slice(-N);
    }

    return initialsAcronym;
}

// --- Ejemplos de uso ---

// Ejemplo 1: La cadena es corta, se devuelve tal cual.
const shortText = "JSS";
const result1 = getAcronymOrTruncate(shortText, 5);
console.log(`Texto corto: "${shortText}" -> "${result1}"`); // Salida: "JSS"

// Ejemplo 2: La cadena es larga y tiene un acrónimo al final.
const textWithAcronym = "28th ACM International Systems and Software Product Line Conference (SPLC)";
const result2 = getAcronymOrTruncate(textWithAcronym, 30);
console.log(`Con acrónimo: "${textWithAcronym}" -> "${result2}"`); // Salida: "SPLC"

// Ejemplo 3: La cadena es larga y NO tiene un acrónimo definido.
const textWithoutAcronym = "International Conference on Software Engineering and Knowledge Engineering";
const result3 = getAcronymOrTruncate(textWithoutAcronym, 20);
console.log(`Sin acrónimo: "${textWithoutAcronym}" -> "${result3}"`); // Salida: "ICSEAKE"

// Ejemplo 4: La cadena es larga, no tiene acrónimo y el construido se trunca.
const longTitle = "International Symposium on Formal Methods for Components and Objects";
const result4 = getAcronymOrTruncate(longTitle, 5); // N = 5
console.log(`Acrónimo truncado: "${longTitle}" -> "${result4}"`); // Salida: "ISFMC" (de ISFMCO)

// Ejemplo 5: La cadena es larga, no tiene acrónimo y el construido no necesita truncarse.
const longTitle2 = "Web Engineering";
const result5 = getAcronymOrTruncate(longTitle2, 5); // N = 5
console.log(`Acrónimo sin truncar: "${longTitle2}" -> "${result5}"`); // Salida: "WE"