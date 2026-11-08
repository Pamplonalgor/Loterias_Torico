# Skill: Totem Interactivo & Web Móvil "El Torico & Olentzero"

## Context & Objectives
Desarrollar una aplicación web interactiva y lúdica para la Administración de Loterías "El Torico" (Navarra).
* **Canal Principal (Kiosk Mode):** Pantalla táctil vertical/horizontal junto a la entrada del local, optimizada para interacciones rápidas de 15 a 25 segundos y reseteo automático por inactividad.
* **Canal Secundario (Web Móvil / QR):** Acceso responsive desde smartphones para clientes que escaneen un QR en el escaparate o jueguen desde fuera de la tienda, adaptando layout táctil y pausando el reseteo agresivo de inactividad.

---

## 1. Architecture & Responsive Strategy

### Tech Stack
* **Framework:** Next.js (App Router) o Vite + React.
* **Styling & UI:** Tailwind CSS, Framer Motion (para transiciones y animaciones de impacto), Lucide Icons / Canvas FX.
* **State & Persistence:** 
  * `localStorage` / `IndexedDB` para inventario de décimos y configuración en local.
  * Opcional: Supabase / API REST para sincronizar el stock de números entre el panel admin y los móviles de los clientes.

### Responsive & Device Rules
* **Modo Pantalla Táctil (Tótem):**
  * `h-screen` / `h-dvh`, `overflow-hidden` (sin scrollbars).
  * Elementos touch gigantes (mínimo 68px de alto) para pulsaciones rápidas de pie.
  * `IdleTimer`: Reseteo automático a los 20 segundos de inactividad en la pantalla final.
* **Modo Móvil (Smartphones):**
  * `min-h-dvh` con scroll vertical permitido si es necesario.
  * Detección de entorno (vía `userAgent` o parámetro de URL `?mode=mobile`):
    * Desactiva el auto-reset de 20 segundos o lo amplía a 2 minutos para no cortar la lectura al usuario en su teléfono.
    * Añade botón de acción directa: **"Compartir por WhatsApp"** o **"Guardar en mis notas"**.

---

## 2. User Journey & Screens Flow

```
[ PANTALLA REPOSO / ATTRACT ] (Tótem: video/animación loop | Móvil: Landing directa)
       │ (Tocar pantalla / Tap)
       ▼
[ SELECTOR DE MODO ] ─── Pin Admin (3 taps en logo) ──> [ PANEL ADMIN ]
       │
       ├─► 1. El Torico (Cornómetro de Valentía)
       ├─► 2. El Olentzero (La Chimenea y los Troncos de la Suerte)
       └─► 3. El Oráculo IA (Lectura de Mente / Cábala)
       │
       ▼
[ RESULTADO CÓMICO + DÉCIMO RECOMENDADO ]
       │
       ├─► En Tótem: Código de canje en ventanilla + Temporizador 20s
       └─► En Móvil: Botón "Guardar número" / "Compartir por WhatsApp"
```

---

## 3. Game Modes Specifications

### Modo 1: "El Cornómetro del Torico"
* **Concepto:** Medidor de valentía y potencia navarra.
* **Mecánica:**
  * En Tótem: Tocar dos dianas táctiles sobre los cuernos a la vez o aporrear el botón central.
  * En Móvil: Mantener pulsado el botón central para cargar la barra de embestida ("¡Aprieta con fuerza!").
* **Veredicto y Niveles:**
  * *Nivel Manso:* "Te ha temblado el pulso más que en la curva de Estafeta. Te toca jugar suave."
  * *Nivel Miura:* "¡Ay va la hostia! Has dejado los cuernos templando. Vienes a liquidar la hipoteca."
* **Asignación:** Asigna un número del stock cargado en el panel.

### Modo 2: "La Txabola del Olentzero"
* **Concepto:** Carbón vs. Castañas y Fortuna en el monte.
* **Mecánica:**
  * El Olentzero aparece con su boina, pipa humeante y su saco de carbón.
  * Muestra 3 sacos rústicos o 3 leños en la chimenea: el usuario elige uno con un toque.
* **Veredicto:**
  * Animación de chispazo y humo de pipa.
  * Frase navarra: *"Dice el Olentzero que este año te has portado regular, pero como eres majo/a te perdona el carbón y te deja este número bendecido con un trago de pacharán."*
* **Asignación:** Asigna un número del stock cargado en el panel.

### Modo 3: "El Oráculo IA" (Predicción Neuronal)
* **Concepto:** Cábala satírica y futurista.
* **Mecánica:**
  * Selección rápida de 1 motivo de juego ("Mandar al jefe a paseo", "Tapar agujeros", "Comprar un caserío", "Invitar a toda la cuadrilla").
  * Escaneo biométrico fingido: colocar el dedo 3 segundos sobre el círculo rúnico con sonido de cálculo cuántico.
* **Veredicto:**
  * *"La IA de El Torico ha analizado 400.000 sorteos y tus ganas de fiesta: tu combinación converge en este número."*
* **Asignación:** Asigna un número del stock cargado en el panel.

---

## 4. Admin Panel & Stock Management

* **Acceso Oculto:**
  * 3 toques consecutivos en el logotipo superior o pulsar `Ctrl + Shift + A`.
  * Teclado numérico táctil en pantalla para introducir PIN de 4 dígitos (por defecto `1407`).
* **Funciones del Panel:**
  * **Carga Individual / Masiva:** Añadir números de 5 cifras con cantidad de décimos disponibles o pegar lista separada por comas.
  * **Estado de Venta:** Marcar números como "Agotado" con un toggle táctil para que el algoritmo no los vuelva a sugerir.
  * **Configuración del Tótem:**
    * Ajustar tiempo de inactividad para auto-reset (default: 20s).
    * Modificar PIN de acceso.
    * Selector de Modo Forzado (Fijar modo Kiosk o modo Web).

---

## 5. UI/UX Rules for Dual Device Execution

1. **Sin Inputs de Teclado para Clientes:** Toda la interacción es mediante tarjetas grandes, botones de radio visuales o pulsadores táctiles.
2. **Audio Inteligente:**
   * En Tótem: Efectos de sonido activados por defecto con volumen calibrado para local.
   * En Móvil: Audio silenciado inicialmente (`muted`) respetando políticas de autoplay de navegadores móviles, activable con un icono de altavoz.
3. **Conversión a Venta:**
   * **En Tótem:** Muestra el número en tipografía gigante con código rápido (ej. `TORO-18`) e instrucción: *"Dile este número al lotero en ventanilla antes de que se agote"*.
   * **En Móvil:** Incluye botón `Pedir por WhatsApp` o `Copiar número` para que el cliente no tenga que memorizarlo.
4. **Auto-Reset Condicional:**
   ```typescript
   // Lógica de inactividad: solo activa reset agresivo en modo Kiosk
   if (isKioskMode) {
     useIdleTimer({ timeout: 20000, onIdle: resetToAttractMode });
   }
   ```