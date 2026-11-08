# 🎄 Loterías Torico — La Elección del Olentzero
### Sorteo Extraordinario de Navidad • Navarra

Aplicación web interactiva para el tótem de **Loterías Torico**. Experiencia de 25 segundos donde el **Olentzero** recomienda un par de décimos del stock real cargado en el local.

---

## 🔢 Cómo Cargar los Números de Lotería (con Código)

1. En la esquina superior derecha de la pantalla, pulsa el botón **"🔒 El Torico Admin"** (o toca 3 veces el logotipo de Loterías Torico).
2. Introduce el **código PIN de 4 dígitos** en el teclado táctil:
   * **PIN por defecto:** `1407` (puedes cambiarlo dentro del panel si lo deseas).
3. Dentro del panel tienes dos formas de meter los números:
   * **Carga Masiva (Rápida):** Pega en la caja de texto una lista de números separados por comas, espacios o saltos de línea (ej: `77724, 14707, 03412, 89520, 58291`) y pulsa **"+ Cargar Números"**. El sistema detecta automáticamente todos los números de 5 cifras y los añade a la lista.
   * **Carga Individual:** Introduce el número de 5 cifras y opcionalmente su código de ventanilla (`TORO-XX`).
4. **Control de Stock en Vivo:**
   * Cada número se puede marcar como **Disponible** o **Agotado** con un solo toque (los números agotados no los sugerirá el Olentzero).
   * Puedes ver el total de números en stock y vaciar la lista cuando quieras.
5. Pulsa **"Guardar Cambios"** y los números quedarán guardados en el tótem.

---

## 🎯 Experiencia del Cliente (~25 Segundos)
1. **Inicio:** Logotipo oficial de Loterías Torico, ambientación navideña sobria y botón táctil **"Consultar al Olentzero"**.
2. **Las 3 Preguntas:**
   * *Pregunta 1:* ¿Cómo te has portado este año, majo/a? (Santo varón vs Parrandero).
   * *Pregunta 2:* ¿Qué echas a la chimenea para avivar la llama? (Leño de roble, trago de pacharán o castañas).
   * *Pregunta 3:* ¿En qué emplearás El Gordo si sale tu número? (Tapar hipoteca, mandar al jefe a paseo o invitar a la cuadrilla).
3. **Pausa Teatral (2 segundos):** El Olentzero examina el bombo en su txabola del monte.
4. **Resultado con 2 Décimos:**
   * Recomienda **2 números reales del stock** cargado (1º Décimo Favorito + 2º Décimo de la Cuadrilla).
   * Los décimos incorporan el logotipo oficial de Loterías Torico, serie, fracción y código de ventanilla (`TORO-XX`).
   * Instrucción clara: *"Pide estos números en ventanilla antes de que se agoten en administración"*.
   * Botón limpio: **"Probar de nuevo"**.
   * Reseteo automático tras 25 segundos de inactividad para el siguiente cliente.

---

## 🚀 Cómo Abrir la Aplicación
Haz doble clic sobre [`index.html`](index.html) en cualquier navegador, o lánzalo en pantalla completa fija en el tótem:
```cmd
msedge.exe --kiosk "c:\Users\moren\OneDrive\Desktop\WEB Interactiva el Torico\index.html" --edge-kiosk-type=fullscreen
```
