// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Referencias a elementos del menú y contenedor
const menuToggle = document.getElementById('menuToggle');
const navigationMenu = document.getElementById('navigationMenu');
const currentToolName = document.getElementById('currentToolName');
const contenido = document.getElementById('contenido');
let isMenuOpen = false;

// Función para alternar el menú
function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  
  if (isMenuOpen) {
    openMenu();
  } else {
    closeMenu();
  }
}

// Función para abrir el menú
function openMenu() {
  menuToggle.setAttribute('aria-expanded', 'true');
  navigationMenu.setAttribute('aria-hidden', 'false');
  navigationMenu.classList.add('show');
  
  // Crear backdrop para móviles
  if (window.innerWidth <= 768) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop show';
    backdrop.id = 'navBackdrop';
    backdrop.addEventListener('click', closeMenu);
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
  }
}

// Función para cerrar el menú
function closeMenu() {
  isMenuOpen = false;
  menuToggle.setAttribute('aria-expanded', 'false');
  navigationMenu.setAttribute('aria-hidden', 'true');
  navigationMenu.classList.remove('show');
  
  // Remover backdrop
  const backdrop = document.getElementById('navBackdrop');
  if (backdrop) {
    backdrop.remove();
    document.body.style.overflow = '';
  }
}

// Event listener para el botón del menú
if (menuToggle) {
  menuToggle.addEventListener('click', toggleMenu);
}

// Cerrar menú con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen) {
    closeMenu();
  }
});

// Función para actualizar el nombre de la herramienta actual
function updateCurrentTool(toolName) {
  if (currentToolName) {
    currentToolName.textContent = toolName;
  }
  closeMenu();
}

// Referencias a botones de herramientas (se inicializarán cuando se cree el DOM)
function initializeToolButtons() {
  const afinadorBtn = document.getElementById('afinadorBtn');
  const metronomoBtn = document.getElementById('metronomoBtn');
  const repertorioBtn = document.getElementById('repertorioBtn');
  
  if (afinadorBtn) {
    afinadorBtn.addEventListener('click', () => {
      mostrarAfinador();
      updateCurrentTool('Afinador');
    });
  }
  
  if (metronomoBtn) {
    metronomoBtn.addEventListener('click', () => {
      mostrarMetronomo();
      updateCurrentTool('Metrónomo');
    });
  }
  
  if (repertorioBtn) {
    repertorioBtn.addEventListener('click', () => {
      mostrarRepertorio();
      updateCurrentTool('Repertorio');
    });
  }
}

// Función para mostrar el afinador
function mostrarAfinador() {
  contenido.innerHTML = `
    <div class="tool-container">
      <h2 class="tool-title">
        <span class="tool-icon">🎯</span>
        Afinador Digital
      </h2>
      <p class="tool-placeholder">
        🔧 Funcionalidad del afinador en desarrollo...
      </p>
      <div class="tool-info">
        <p>Esta herramienta permitirá afinar tu violín con precisión profesional usando el micrófono de tu dispositivo.</p>
      </div>
    </div>
  `;
}

// Función para mostrar el repertorio
function mostrarRepertorio() {
  contenido.innerHTML = `
    <div class="tool-container">
      <h2 class="tool-title">
        <span class="tool-icon">📚</span>
        Repertorio Musical
      </h2>
      <p class="tool-placeholder">
        🔧 Biblioteca de repertorio en desarrollo...
      </p>
      <div class="tool-info">
        <p>Aquí encontrarás una colección organizada de partituras, ejercicios y estudios para violín.</p>
      </div>
    </div>
  `;
}

// Variables del metrónomo
let metronomeInterval = null;
let isPlaying = false;
let currentTempo = 120;
let currentTimeSignature = '4/4';
let beatCount = 0;
let audioContext = null;

// Función para mostrar la interfaz del metrónomo
function mostrarMetronomo() {
  contenido.innerHTML = `
    <div class="metronome-container">
      
      <!-- Display principal del tempo -->
      <div class="tempo-display">
        <div class="tempo-value">
          <span id="tempoValue">${currentTempo}</span>
          <span class="tempo-unit">BPM</span>
        </div>
        <div class="time-signature">
          <span id="timeSignature">${currentTimeSignature}</span>
        </div>
      </div>
      
      <!-- Controles de tempo -->
      <div class="tempo-controls">
        <button id="tempoDecrease" class="tempo-btn tempo-btn--decrease" aria-label="Disminuir tempo">
          <span class="btn-icon">−</span>
        </button>
        
        <input 
          type="range" 
          id="tempoSlider" 
          class="tempo-slider"
          min="40" 
          max="200" 
          value="${currentTempo}"
          aria-label="Control de tempo"
        >
        
        <button id="tempoIncrease" class="tempo-btn tempo-btn--increase" aria-label="Aumentar tempo">
          <span class="btn-icon">+</span>
        </button>
      </div>
      
      <!-- Presets de tempo -->
      <div class="tempo-presets">
        <button class="preset-btn" data-tempo="60">Largo (60)</button>
        <button class="preset-btn" data-tempo="76">Adagio (76)</button>
        <button class="preset-btn" data-tempo="108">Andante (108)</button>
        <button class="preset-btn" data-tempo="120">Moderato (120)</button>
        <button class="preset-btn" data-tempo="144">Allegro (144)</button>
        <button class="preset-btn" data-tempo="180">Presto (180)</button>
      </div>
      
      <!-- Control principal Play/Stop -->
      <div class="playback-controls">
        <button id="playStopBtn" class="simple-play-btn" aria-label="Iniciar/Detener metrónomo">
          <span class="play-icon">▶</span>
        </button>
      </div>
      
      <!-- Indicador visual de beat -->
      <div class="beat-indicator">
        <div class="beat-lights">
          <div class="beat-light beat-light--primary" id="beat1"></div>
          <div class="beat-light" id="beat2"></div>
          <div class="beat-light" id="beat3"></div>
          <div class="beat-light" id="beat4"></div>
        </div>
        <div class="beat-counter">
          Compás: <span id="beatCounter">1</span> de <span id="beatsPerMeasure">4</span>
        </div>
      </div>
      
      <!-- Funciones adicionales -->
      <div class="additional-controls">
        <div class="control-group">
          <label for="timeSignatureSelect">Compás:</label>
          <select id="timeSignatureSelect" class="time-signature-select">
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4" selected>4/4</option>
            <option value="6/8">6/8</option>
            <option value="9/8">9/8</option>
            <option value="12/8">12/8</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="volumeSlider">Volumen:</label>
          <input 
            type="range" 
            id="volumeSlider" 
            class="volume-slider"
            min="0" 
            max="100" 
            value="70"
            aria-label="Control de volumen"
          >
          <span id="volumeValue">70%</span>
        </div>
        
        <div class="control-group">
          <button id="tapTempoBtn" class="tap-tempo-btn">
            <span class="tap-icon">👆</span>
            Tap Tempo
          </button>
        </div>
      </div>
      
    </div>
  `;
  
  inicializarMetronomo();
}

// Función para inicializar los controles del metrónomo
function inicializarMetronomo() {
  // Referencias a elementos
  const tempoSlider = document.getElementById('tempoSlider');
  const tempoValue = document.getElementById('tempoValue');
  const tempoDecrease = document.getElementById('tempoDecrease');
  const tempoIncrease = document.getElementById('tempoIncrease');
  const playStopBtn = document.getElementById('playStopBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const timeSignatureSelect = document.getElementById('timeSignatureSelect');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const tapTempoBtn = document.getElementById('tapTempoBtn');
  
  // Control de tempo con slider
  if (tempoSlider) {
    tempoSlider.addEventListener('input', (e) => {
      currentTempo = parseInt(e.target.value);
      actualizarTempo();
    });
  }
  
  // Botones de incremento/decremento
  if (tempoDecrease) {
    tempoDecrease.addEventListener('click', () => {
      if (currentTempo > 40) {
        currentTempo--;
        actualizarTempo();
      }
    });
  }
  
  if (tempoIncrease) {
    tempoIncrease.addEventListener('click', () => {
      if (currentTempo < 200) {
        currentTempo++;
        actualizarTempo();
      }
    });
  }
  
  // Presets de tempo
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentTempo = parseInt(e.target.dataset.tempo);
      actualizarTempo();
      // Highlight del preset activo
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Control Play/Stop
  if (playStopBtn) {
    playStopBtn.addEventListener('click', toggleMetronome);
  }
  
  // Cambio de compás
  if (timeSignatureSelect) {
    timeSignatureSelect.addEventListener('change', (e) => {
      currentTimeSignature = e.target.value;
      const timeSignatureDisplay = document.getElementById('timeSignature');
      if (timeSignatureDisplay) {
        timeSignatureDisplay.textContent = currentTimeSignature;
      }
      actualizarIndicadorBeat();
      if (isPlaying) {
        reiniciarMetronomo();
      }
    });
  }
  
  // Control de volumen
  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener('input', (e) => {
      volumeValue.textContent = e.target.value + '%';
    });
  }
  
  // Tap Tempo
  if (tapTempoBtn) {
    let tapTimes = [];
    tapTempoBtn.addEventListener('click', () => {
      const now = Date.now();
      tapTimes.push(now);
      
      // Mantener solo los últimos 4 taps
      if (tapTimes.length > 4) {
        tapTimes.shift();
      }
      
      if (tapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
          intervals.push(tapTimes[i] - tapTimes[i-1]);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const bpm = Math.round(60000 / avgInterval);
        
        if (bpm >= 40 && bpm <= 200) {
          currentTempo = bpm;
          actualizarTempo();
        }
      }
      
      // Efecto visual en el botón
      tapTempoBtn.classList.add('tapped');
      setTimeout(() => tapTempoBtn.classList.remove('tapped'), 100);
    });
    
    // Limpiar taps después de 3 segundos de inactividad
    let tapTimeout;
    tapTempoBtn.addEventListener('click', () => {
      clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        tapTimes = [];
      }, 3000);
    });
  }
}

// Función para actualizar el tempo en la interfaz
function actualizarTempo() {
  const tempoValueEl = document.getElementById('tempoValue');
  const tempoSliderEl = document.getElementById('tempoSlider');
  
  if (tempoValueEl) {
    tempoValueEl.textContent = currentTempo;
  }
  if (tempoSliderEl) {
    tempoSliderEl.value = currentTempo;
  }
  
  if (isPlaying) {
    reiniciarMetronomo();
  }
}

// Función para alternar play/stop
function toggleMetronome() {
  if (isPlaying) {
    detenerMetronomo();
  } else {
    iniciarMetronomo();
  }
}

// Función para iniciar el metrónomo
function iniciarMetronomo() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  isPlaying = true;
  beatCount = 0;
  
  const playStopBtn = document.getElementById('playStopBtn');
  if (playStopBtn) {
    playStopBtn.innerHTML = `
      <span class="play-icon">⏸️</span>
    `;
    playStopBtn.classList.add('playing');
  }
  
  // Calcular intervalo en ms
  const interval = (60 / currentTempo) * 1000;
  
  metronomeInterval = setInterval(() => {
    reproducirClick();
    actualizarIndicadorBeat();
  }, interval);
  
  // Reproducir el primer beat inmediatamente
  reproducirClick();
  actualizarIndicadorBeat();
}

// Función para detener el metrónomo
function detenerMetronomo() {
  isPlaying = false;
  
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  
  const playStopBtn = document.getElementById('playStopBtn');
  if (playStopBtn) {
    playStopBtn.innerHTML = `
      <span class="play-icon">▶️</span>
    `;
    playStopBtn.classList.remove('playing');
  }
  
  // Resetear indicadores visuales
  document.querySelectorAll('.beat-light').forEach(light => {
    light.classList.remove('active');
  });
  
  beatCount = 0;
  const beatCounterEl = document.getElementById('beatCounter');
  if (beatCounterEl) {
    beatCounterEl.textContent = '1';
  }
}

// Función para reiniciar el metrónomo (cambio de tempo mientras está sonando)
function reiniciarMetronomo() {
  if (isPlaying) {
    detenerMetronomo();
    setTimeout(() => iniciarMetronomo(), 50);
  }
}

// Función para reproducir el sonido del click
function reproducirClick() {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const volumeSlider = document.getElementById('volumeSlider');
  const volume = volumeSlider ? parseInt(volumeSlider.value) / 100 : 0.7;
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Diferentes tonos para el primer beat y los demás
  const isFirstBeat = (beatCount % getBeatsPerMeasure()) === 0;
  oscillator.frequency.setValueAtTime(
    isFirstBeat ? 800 : 600, 
    audioContext.currentTime
  );
  
  gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

// Función para obtener beats por compás
function getBeatsPerMeasure() {
  const numerator = parseInt(currentTimeSignature.split('/')[0]);
  return numerator;
}

// Función para actualizar el indicador visual de beat
function actualizarIndicadorBeat() {
  const beatsPerMeasure = getBeatsPerMeasure();
  const currentBeat = (beatCount % beatsPerMeasure) + 1;
  
  // Actualizar contador
  const beatCounterEl = document.getElementById('beatCounter');
  const beatsPerMeasureEl = document.getElementById('beatsPerMeasure');
  
  if (beatCounterEl) {
    beatCounterEl.textContent = currentBeat;
  }
  if (beatsPerMeasureEl) {
    beatsPerMeasureEl.textContent = beatsPerMeasure;
  }
  
  // Actualizar luces
  const lights = document.querySelectorAll('.beat-light');
  lights.forEach((light, index) => {
    light.classList.remove('active');
    if (index < beatsPerMeasure) {
      light.style.display = 'block';
      if (index === (beatCount % beatsPerMeasure)) {
        light.classList.add('active');
      }
    } else {
      light.style.display = 'none';
    }
  });
  
  beatCount++;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initializeToolButtons();
});