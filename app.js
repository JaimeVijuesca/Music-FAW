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
let currentSoundType = 'metronome-beats';

// Variables del Speed Trainer
let speedTrainerActive = false;
let speedTrainerInterval = null;
let speedTrainerCountdown = null;
let trainerCurrentStep = 0;
let trainerTotalSteps = 0;
let trainerTimeRemaining = 0;
let trainerConfig = {
  startTempo: 60,
  targetTempo: 120,
  increment: 5,
  interval: 30,
  repetitions: 4,
  pauseBetween: 2
};

// Variables de Presets y Listas de Reproducción
let savedPresets = [];
let savedPlaylists = [];
let currentPlaylist = null;
let playlistIndex = 0;

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
        
        <div class="control-group">
          <label for="soundTypeSelect">Tipo de sonido:</label>
          <select id="soundTypeSelect" class="sound-type-select">
            <option value="metronome-beats">MetronomeBeats Style</option>
            <option value="dry-click">Click Seco</option>
            <option value="wood-tick">Tick de Madera</option>
            <option value="digital-beep">Bip Digital</option>
            <option value="claves">Claves</option>
            <option value="wood-block">Wood Block</option>
            <option value="classic-tick">Classic Tick</option>
            <option value="studio-click">Studio Click</option>
          </select>
        </div>
      </div>
      
      <!-- Presets y Listas de Reproducción -->
      <div class="presets-section">
        <h3 class="presets-title">
          <span class="presets-icon">🎼</span>
          Presets y Listas de Reproducción
        </h3>
        
        <div class="presets-controls">
          <div class="preset-actions">
            <button id="savePresetBtn" class="preset-btn save-preset-btn">
              <span class="btn-icon">💾</span>
              Guardar Preset
            </button>
            
            <button id="createPlaylistBtn" class="preset-btn create-playlist-btn">
              <span class="btn-icon">📋</span>
              Nueva Lista
            </button>
          </div>
          
          <div class="presets-list">
            <div class="section-header">
              <h4>Presets Guardados</h4>
              <button id="clearPresetsBtn" class="clear-btn">🗑️ Limpiar</button>
            </div>
            <div id="presetsList" class="presets-container">
              <div class="no-presets">
                <span class="no-presets-icon">🎵</span>
                <p>No hay presets guardados</p>
                <small>Configura tempo y compás, luego presiona "Guardar Preset"</small>
              </div>
            </div>
          </div>
          
          <div class="playlists-list">
            <div class="section-header">
              <h4>Listas de Reproducción</h4>
              <button id="clearPlaylistsBtn" class="clear-btn">🗑️ Limpiar</button>
            </div>
            <div id="playlistsContainer" class="playlists-container">
              <div class="no-playlists">
                <span class="no-playlists-icon">📝</span>
                <p>No hay listas creadas</p>
                <small>Crea listas combinando múltiples presets</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Speed Trainer -->
      <div class="speed-trainer">
        <h3 class="speed-trainer-title">
          <span class="trainer-icon">🚀</span>
          Speed Trainer
        </h3>
        
        <div class="trainer-controls">
          <div class="trainer-row">
            <div class="trainer-input-group">
              <label for="startTempo">Tempo inicial:</label>
              <input type="number" id="startTempo" class="trainer-input" min="40" max="200" value="60">
              <span class="input-unit">BPM</span>
            </div>
            
            <div class="trainer-input-group">
              <label for="targetTempo">Tempo objetivo:</label>
              <input type="number" id="targetTempo" class="trainer-input" min="40" max="200" value="120">
              <span class="input-unit">BPM</span>
            </div>
          </div>
          
          <div class="trainer-row">
            <div class="trainer-input-group">
              <label for="increment">Incremento:</label>
              <input type="number" id="increment" class="trainer-input" min="1" max="20" value="5">
              <span class="input-unit">BPM</span>
            </div>
            
            <div class="trainer-input-group">
              <label for="interval">Intervalo:</label>
              <input type="number" id="interval" class="trainer-input" min="5" max="300" value="30">
              <span class="input-unit">seg</span>
            </div>
          </div>
          
          <div class="trainer-row">
            <div class="trainer-input-group">
              <label for="repetitions">Repeticiones por tempo:</label>
              <input type="number" id="repetitions" class="trainer-input" min="1" max="20" value="4">
              <span class="input-unit">veces</span>
            </div>
            
            <div class="trainer-input-group">
              <label for="pauseBetween">Pausa entre cambios:</label>
              <input type="number" id="pauseBetween" class="trainer-input" min="0" max="10" value="2">
              <span class="input-unit">seg</span>
            </div>
          </div>
        </div>
        
        <div class="trainer-actions">
          <button id="speedTrainerBtn" class="speed-trainer-btn">
            <span class="trainer-btn-icon">🎯</span>
            <span class="trainer-btn-text">Iniciar Speed Trainer</span>
          </button>
          
          <button id="resetTrainerBtn" class="reset-trainer-btn">
            <span class="reset-icon">🔄</span>
            Reiniciar
          </button>
        </div>
        
        <div class="trainer-progress" id="trainerProgress" style="display: none;">
          <div class="progress-info">
            <div class="current-step">
              <span class="step-label">Paso:</span>
              <span id="currentStep">1</span> de <span id="totalSteps">12</span>
            </div>
            <div class="current-tempo-display">
              <span class="tempo-label">Tempo actual:</span>
              <span id="trainerCurrentTempo">60</span> BPM
            </div>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
          </div>
          
          <div class="trainer-status">
            <span id="trainerStatus">Preparando...</span>
          </div>
          
          <div class="next-change">
            <span>Próximo cambio en: </span>
            <span id="nextChangeTimer">30</span>s
          </div>
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
  
  // Selector de tipo de sonido
  const soundTypeSelect = document.getElementById('soundTypeSelect');
  if (soundTypeSelect) {
    soundTypeSelect.addEventListener('change', (e) => {
      currentSoundType = e.target.value;
    });
  }
  
  // Inicializar Speed Trainer
  inicializarSpeedTrainer();
  
  // Inicializar Presets y Listas
  inicializarPresets();
  
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
  // Si el Speed Trainer está activo, no permitir control manual del metrónomo
  if (speedTrainerActive) {
    alert('⚠️ El Speed Trainer está activo. Usa los controles del Speed Trainer para detener el metrónomo.');
    return;
  }
  
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
  
  const volumeSlider = document.getElementById('volumeSlider');
  const volume = volumeSlider ? parseInt(volumeSlider.value) / 100 : 0.7;
  const isFirstBeat = (beatCount % getBeatsPerMeasure()) === 0;
  
  switch (currentSoundType) {
    case 'metronome-beats':
      reproducirMetronomeBeatsStyle(volume, isFirstBeat);
      break;
    case 'dry-click':
      reproducirClickSeco(volume, isFirstBeat);
      break;
    case 'wood-tick':
      reproducirTickMadera(volume, isFirstBeat);
      break;
    case 'digital-beep':
      reproducirBipDigital(volume, isFirstBeat);
      break;
    case 'claves':
      reproducirClaves(volume, isFirstBeat);
      break;
    case 'wood-block':
      reproducirWoodBlock(volume, isFirstBeat);
      break;
    case 'classic-tick':
      reproducirClassicTick(volume, isFirstBeat);
      break;
    case 'studio-click':
      reproducirStudioClick(volume, isFirstBeat);
      break;
    default:
      reproducirMetronomeBeatsStyle(volume, isFirstBeat);
  }
}

// Click seco mejorado - más percusivo (sonido original)
function reproducirClickSeco(volume, isFirstBeat) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'square'; // Onda cuadrada para sonido más seco
  oscillator.frequency.setValueAtTime(
    isFirstBeat ? 1200 : 800,
    audioContext.currentTime
  );
  
  // Ataque muy rápido y caída instantánea
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.8, audioContext.currentTime + 0.001);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.02);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.02);
}

// Sonido de tick de madera (metrónomo clásico original)
function reproducirTickMadera(volume, isFirstBeat) {
  // Crear ruido para simular el tick de madera
  const bufferSize = audioContext.sampleRate * 0.05; // 50ms
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generar ruido filtrado que simula madera
  for (let i = 0; i < bufferSize; i++) {
    const decay = 1 - (i / bufferSize);
    const noise = (Math.random() * 2 - 1) * decay;
    // Filtrar frecuencias para simular madera
    data[i] = noise * Math.exp(-i * 0.0003) * (isFirstBeat ? 1.2 : 0.8);
  }
  
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Filtro pasa-altos para sonido más seco
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(isFirstBeat ? 400 : 600, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(volume * 0.6, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
  
  source.start(audioContext.currentTime);
}

// Bip digital muy seco (sonido original)
function reproducirBipDigital(volume, isFirstBeat) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(
    isFirstBeat ? 2000 : 1500,
    audioContext.currentTime
  );
  
  // Sonido extremadamente corto y seco
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, audioContext.currentTime + 0.0005);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.01);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.01);
}

// Sonido de claves de madera (sonido original)
function reproducirClaves(volume, isFirstBeat) {
  // Combinar frecuencias para simular claves
  const frequencies = isFirstBeat ? [800, 1600, 3200] : [600, 1200, 2400];
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    const gain = volume * (0.3 / (index + 1)); // Cada armónico más suave
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.03);
  });
}

// Sonido estilo MetronomeBeats - replica el sonido de la app popular
function reproducirMetronomeBeatsStyle(volume, isFirstBeat) {
  // MetronomeBeats usa un sonido tipo "wood block" con características específicas
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  // Conectar la cadena de audio
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(filter);
  filter.connect(audioContext.destination);
  
  // Configurar osciladores para simular wood block
  oscillator1.type = 'triangle';
  oscillator2.type = 'square';
  
  // Frecuencias específicas que caracterizan el sonido de MetronomeBeats
  const mainFreq = isFirstBeat ? 1000 : 800;
  const harmonic = isFirstBeat ? 2000 : 1600;
  
  oscillator1.frequency.setValueAtTime(mainFreq, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(harmonic, audioContext.currentTime);
  
  // Filtro pasa-banda para el timbre característico
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(mainFreq * 1.5, audioContext.currentTime);
  filter.Q.setValueAtTime(2, audioContext.currentTime);
  
  // Envelope típico de MetronomeBeats: ataque rápido, sustain corto, release rápido
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, audioContext.currentTime + 0.002);
  gainNode.gain.linearRampToValueAtTime(volume * 0.4, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
  
  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.08);
  oscillator2.stop(audioContext.currentTime + 0.08);
}

// Wood Block clásico
function reproducirWoodBlock(volume, isFirstBeat) {
  // Crear buffer con noise shaping para simular madera
  const bufferSize = audioContext.sampleRate * 0.1;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generar ruido con forma de wood block
  for (let i = 0; i < bufferSize; i++) {
    const t = i / audioContext.sampleRate;
    const envelope = Math.exp(-t * 20) * (1 - t * 8);
    const noise = (Math.random() * 2 - 1) * envelope;
    const tone = Math.sin(2 * Math.PI * (isFirstBeat ? 800 : 600) * t) * envelope * 0.7;
    data[i] = (noise * 0.3 + tone * 0.7) * (isFirstBeat ? 1.1 : 0.9);
  }
  
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(300, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(volume * 0.8, audioContext.currentTime);
  
  source.start(audioContext.currentTime);
}

// Tick clásico de metrónomo mecánico
function reproducirClassicTick(volume, isFirstBeat) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(
    isFirstBeat ? 1200 : 900,
    audioContext.currentTime
  );
  
  // Filtro para darle el timbre clásico
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, audioContext.currentTime);
  filter.Q.setValueAtTime(1, audioContext.currentTime);
  
  // Envelope clásico de tick
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.6, audioContext.currentTime + 0.001);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
}

// Click de estudio profesional
function reproducirStudioClick(volume, isFirstBeat) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(
    isFirstBeat ? 1500 : 1000,
    audioContext.currentTime
  );
  
  // Click muy preciso y limpio para estudio
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.9, audioContext.currentTime + 0.001);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.03);
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

// Función para inicializar el Speed Trainer
function inicializarSpeedTrainer() {
  const speedTrainerBtn = document.getElementById('speedTrainerBtn');
  const resetTrainerBtn = document.getElementById('resetTrainerBtn');
  
  // Event listeners para inputs
  ['startTempo', 'targetTempo', 'increment', 'interval', 'repetitions', 'pauseBetween'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', actualizarConfigTrainer);
    }
  });
  
  // Botón de iniciar/detener Speed Trainer
  if (speedTrainerBtn) {
    speedTrainerBtn.addEventListener('click', toggleSpeedTrainer);
  }
  
  // Botón de reset
  if (resetTrainerBtn) {
    resetTrainerBtn.addEventListener('click', resetSpeedTrainer);
  }
  
  // Sincronizar valores iniciales
  actualizarConfigTrainer();
}

// Función para actualizar la configuración del trainer
function actualizarConfigTrainer() {
  const startTempo = document.getElementById('startTempo');
  const targetTempo = document.getElementById('targetTempo');
  const increment = document.getElementById('increment');
  const interval = document.getElementById('interval');
  const repetitions = document.getElementById('repetitions');
  const pauseBetween = document.getElementById('pauseBetween');
  
  if (startTempo) trainerConfig.startTempo = parseInt(startTempo.value);
  if (targetTempo) trainerConfig.targetTempo = parseInt(targetTempo.value);
  if (increment) trainerConfig.increment = parseInt(increment.value);
  if (interval) trainerConfig.interval = parseInt(interval.value);
  if (repetitions) trainerConfig.repetitions = parseInt(repetitions.value);
  if (pauseBetween) trainerConfig.pauseBetween = parseInt(pauseBetween.value);
  
  // Calcular pasos totales
  const tempoRange = Math.abs(trainerConfig.targetTempo - trainerConfig.startTempo);
  const steps = Math.ceil(tempoRange / trainerConfig.increment) + 1;
  trainerTotalSteps = steps * trainerConfig.repetitions;
  
  const totalStepsEl = document.getElementById('totalSteps');
  if (totalStepsEl) {
    totalStepsEl.textContent = trainerTotalSteps;
  }
}

// Función para alternar el Speed Trainer
function toggleSpeedTrainer() {
  if (speedTrainerActive) {
    detenerSpeedTrainer();
  } else {
    iniciarSpeedTrainer();
  }
}

// Función para iniciar el Speed Trainer
function iniciarSpeedTrainer() {
  // Validaciones
  if (trainerConfig.startTempo >= trainerConfig.targetTempo && trainerConfig.increment > 0) {
    alert('El tempo inicial debe ser menor que el objetivo para incrementos positivos.');
    return;
  }
  
  if (trainerConfig.startTempo <= trainerConfig.targetTempo && trainerConfig.increment < 0) {
    alert('El tempo inicial debe ser mayor que el objetivo para decrementos.');
    return;
  }
  
  speedTrainerActive = true;
  trainerCurrentStep = 0;
  
  // Actualizar UI
  const speedTrainerBtn = document.getElementById('speedTrainerBtn');
  const trainerProgress = document.getElementById('trainerProgress');
  
  if (speedTrainerBtn) {
    speedTrainerBtn.innerHTML = `
      <span class="trainer-btn-icon">⏹️</span>
      <span class="trainer-btn-text">Detener Speed Trainer</span>
    `;
    speedTrainerBtn.classList.add('active');
  }
  
  if (trainerProgress) {
    trainerProgress.style.display = 'block';
  }
  
  // Establecer tempo inicial
  currentTempo = trainerConfig.startTempo;
  actualizarTempo();
  
  // Iniciar el metrónomo si no está activo
  if (!isPlaying) {
    iniciarMetronomo();
  }
  
  // Comenzar el ciclo del trainer
  ejecutarPasoSpeedTrainer();
}

// Función para ejecutar cada paso del Speed Trainer
function ejecutarPasoSpeedTrainer() {
  if (!speedTrainerActive) return;
  
  trainerCurrentStep++;
  
  // Calcular el tempo actual para este paso
  const stepInCycle = ((trainerCurrentStep - 1) % trainerConfig.repetitions) + 1;
  const cycleNumber = Math.ceil(trainerCurrentStep / trainerConfig.repetitions);
  const newTempo = trainerConfig.startTempo + ((cycleNumber - 1) * trainerConfig.increment);
  
  // Verificar si hemos alcanzado el objetivo
  if ((trainerConfig.increment > 0 && newTempo > trainerConfig.targetTempo) ||
      (trainerConfig.increment < 0 && newTempo < trainerConfig.targetTempo)) {
    completarSpeedTrainer();
    return;
  }
  
  // Actualizar tempo
  currentTempo = Math.min(Math.max(newTempo, 40), 200); // Limitar entre 40-200
  actualizarTempo();
  
  // Actualizar UI del progreso
  actualizarProgresoSpeedTrainer(stepInCycle, cycleNumber, newTempo);
  
  // Programar siguiente paso
  trainerTimeRemaining = trainerConfig.interval;
  iniciarContadorSpeedTrainer();
}

// Función para actualizar el progreso visual
function actualizarProgresoSpeedTrainer(stepInCycle, cycleNumber, tempo) {
  const currentStepEl = document.getElementById('currentStep');
  const trainerCurrentTempoEl = document.getElementById('trainerCurrentTempo');
  const progressFillEl = document.getElementById('progressFill');
  const trainerStatusEl = document.getElementById('trainerStatus');
  
  if (currentStepEl) {
    currentStepEl.textContent = trainerCurrentStep;
  }
  
  if (trainerCurrentTempoEl) {
    trainerCurrentTempoEl.textContent = tempo;
  }
  
  if (progressFillEl) {
    const progress = (trainerCurrentStep / trainerTotalSteps) * 100;
    progressFillEl.style.width = progress + '%';
  }
  
  if (trainerStatusEl) {
    trainerStatusEl.textContent = `Repetición ${stepInCycle} de ${trainerConfig.repetitions} a ${tempo} BPM`;
  }
}

// Función para el contador regresivo
function iniciarContadorSpeedTrainer() {
  const nextChangeTimerEl = document.getElementById('nextChangeTimer');
  
  speedTrainerCountdown = setInterval(() => {
    trainerTimeRemaining--;
    
    if (nextChangeTimerEl) {
      nextChangeTimerEl.textContent = trainerTimeRemaining;
    }
    
    if (trainerTimeRemaining <= 0) {
      clearInterval(speedTrainerCountdown);
      
      // Pausa entre cambios si está configurada
      if (trainerConfig.pauseBetween > 0 && trainerCurrentStep % trainerConfig.repetitions === 0) {
        pausarEntreTempos();
      } else {
        ejecutarPasoSpeedTrainer();
      }
    }
  }, 1000);
}

// Función para pausar entre cambios de tempo
function pausarEntreTempos() {
  const trainerStatusEl = document.getElementById('trainerStatus');
  
  if (trainerStatusEl) {
    trainerStatusEl.textContent = `Pausa - Preparando siguiente tempo...`;
  }
  
  // Parar el metrónomo durante la pausa
  const wasPlaying = isPlaying;
  if (isPlaying) {
    detenerMetronomo();
  }
  
  setTimeout(() => {
    if (speedTrainerActive) {
      if (wasPlaying) {
        iniciarMetronomo();
      }
      ejecutarPasoSpeedTrainer();
    }
  }, trainerConfig.pauseBetween * 1000);
}

// Función para completar el Speed Trainer
function completarSpeedTrainer() {
  // Detener contadores
  if (speedTrainerCountdown) {
    clearInterval(speedTrainerCountdown);
    speedTrainerCountdown = null;
  }
  
  const trainerStatusEl = document.getElementById('trainerStatus');
  const nextChangeTimerEl = document.getElementById('nextChangeTimer');
  
  if (trainerStatusEl) {
    trainerStatusEl.textContent = `¡Entrenamiento completado! Tempo final: ${currentTempo} BPM`;
  }
  
  if (nextChangeTimerEl) {
    nextChangeTimerEl.textContent = '✓';
  }
  
  // Actualizar progreso al 100%
  const progressFillEl = document.getElementById('progressFill');
  if (progressFillEl) {
    progressFillEl.style.width = '100%';
  }
  
  // Mostrar notificación de completado después de un momento
  setTimeout(() => {
    if (speedTrainerActive) { // Solo mostrar si aún está activo
      alert(`🎉 ¡Speed Trainer completado!\n\nTempo inicial: ${trainerConfig.startTempo} BPM\nTempo final: ${currentTempo} BPM\nTotal de pasos: ${trainerCurrentStep}`);
      
      // Mantener el metrónomo sonando al tempo final pero detener el trainer
      speedTrainerActive = false;
      
      const speedTrainerBtn = document.getElementById('speedTrainerBtn');
      if (speedTrainerBtn) {
        speedTrainerBtn.innerHTML = `
          <span class="trainer-btn-icon">🎯</span>
          <span class="trainer-btn-text">Iniciar Speed Trainer</span>
        `;
        speedTrainerBtn.classList.remove('active');
      }
    }
  }, 1500);
}

// Función para detener el Speed Trainer
function detenerSpeedTrainer() {
  speedTrainerActive = false;
  
  // Detener todos los intervalos del Speed Trainer
  if (speedTrainerCountdown) {
    clearInterval(speedTrainerCountdown);
    speedTrainerCountdown = null;
  }
  
  if (speedTrainerInterval) {
    clearInterval(speedTrainerInterval);
    speedTrainerInterval = null;
  }
  
  // Detener el metrónomo también
  if (isPlaying) {
    detenerMetronomo();
  }
  
  // Actualizar UI
  const speedTrainerBtn = document.getElementById('speedTrainerBtn');
  const trainerProgress = document.getElementById('trainerProgress');
  
  if (speedTrainerBtn) {
    speedTrainerBtn.innerHTML = `
      <span class="trainer-btn-icon">🎯</span>
      <span class="trainer-btn-text">Iniciar Speed Trainer</span>
    `;
    speedTrainerBtn.classList.remove('active');
  }
  
  if (trainerProgress) {
    trainerProgress.style.display = 'none';
  }
}

// Función para resetear el Speed Trainer
function resetSpeedTrainer() {
  // Primero detener todo
  detenerSpeedTrainer();
  
  // Resetear variables
  trainerCurrentStep = 0;
  trainerTotalSteps = 0;
  trainerTimeRemaining = 0;
  
  // Volver al tempo por defecto
  currentTempo = 120;
  actualizarTempo();
  
  // Resetear valores por defecto en la UI
  const inputs = {
    'startTempo': 60,
    'targetTempo': 120,
    'increment': 5,
    'interval': 30,
    'repetitions': 4,
    'pauseBetween': 2
  };
  
  Object.entries(inputs).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = value;
    }
  });
  
  // Actualizar configuración
  actualizarConfigTrainer();
  
  // Resetear progreso visual
  const progressFillEl = document.getElementById('progressFill');
  const currentStepEl = document.getElementById('currentStep');
  const trainerCurrentTempoEl = document.getElementById('trainerCurrentTempo');
  const nextChangeTimerEl = document.getElementById('nextChangeTimer');
  
  if (progressFillEl) {
    progressFillEl.style.width = '0%';
  }
  
  if (currentStepEl) {
    currentStepEl.textContent = '1';
  }
  
  if (trainerCurrentTempoEl) {
    trainerCurrentTempoEl.textContent = '60';
  }
  
  if (nextChangeTimerEl) {
    nextChangeTimerEl.textContent = '30';
  }
}

// Función para inicializar Presets y Listas de Reproducción
function inicializarPresets() {
  // Cargar presets y listas desde localStorage
  cargarPresetsDesdeStorage();
  cargarPlaylistsDesdeStorage();
  
  // Event listeners
  const savePresetBtn = document.getElementById('savePresetBtn');
  const createPlaylistBtn = document.getElementById('createPlaylistBtn');
  const clearPresetsBtn = document.getElementById('clearPresetsBtn');
  const clearPlaylistsBtn = document.getElementById('clearPlaylistsBtn');
  
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', mostrarDialogoGuardarPreset);
  }
  
  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', mostrarDialogoCrearLista);
  }
  
  if (clearPresetsBtn) {
    clearPresetsBtn.addEventListener('click', limpiarPresets);
  }
  
  if (clearPlaylistsBtn) {
    clearPlaylistsBtn.addEventListener('click', limpiarPlaylists);
  }
  
  // Renderizar presets y listas existentes
  renderizarPresets();
  renderizarPlaylists();
}

// Función para mostrar diálogo de guardar preset
function mostrarDialogoGuardarPreset() {
  const nombrePreset = prompt('Nombre del preset:', `Preset ${currentTempo} BPM - ${currentTimeSignature}`);
  
  if (nombrePreset && nombrePreset.trim()) {
    const preset = {
      id: Date.now(),
      nombre: nombrePreset.trim(),
      tempo: currentTempo,
      timeSignature: currentTimeSignature,
      soundType: currentSoundType,
      volumen: document.getElementById('volumeSlider')?.value || 70,
      fechaCreacion: new Date().toLocaleDateString()
    };
    
    savedPresets.push(preset);
    guardarPresetsEnStorage();
    renderizarPresets();
    
    // Feedback visual
    mostrarNotificacion(`💾 Preset "${preset.nombre}" guardado correctamente`);
  }
}

// Función para mostrar diálogo de crear lista de reproducción
function mostrarDialogoCrearLista() {
  if (savedPresets.length === 0) {
    alert('⚠️ Necesitas tener al menos un preset guardado para crear una lista de reproducción.');
    return;
  }
  
  const nombreLista = prompt('Nombre de la lista de reproducción:', 'Mi Sesión de Práctica');
  
  if (nombreLista && nombreLista.trim()) {
    mostrarSelectorPresets(nombreLista.trim());
  }
}

// Función para mostrar selector de presets para crear lista
function mostrarSelectorPresets(nombreLista) {
  const contenido = document.getElementById('contenido');
  const originalContent = contenido.innerHTML;
  
  let presetsHTML = '';
  savedPresets.forEach(preset => {
    presetsHTML += `
      <div class="preset-selector-item">
        <input type="checkbox" id="preset-${preset.id}" value="${preset.id}">
        <label for="preset-${preset.id}">
          <span class="preset-name">${preset.nombre}</span>
          <span class="preset-details">${preset.tempo} BPM - ${preset.timeSignature}</span>
        </label>
      </div>
    `;
  });
  
  contenido.innerHTML = `
    <div class="playlist-creator">
      <h3>Crear Lista: "${nombreLista}"</h3>
      <p>Selecciona los presets para incluir en esta lista:</p>
      
      <div class="presets-selector">
        ${presetsHTML}
      </div>
      
      <div class="playlist-creator-actions">
        <button id="confirmarLista" class="confirm-btn">✅ Crear Lista</button>
        <button id="cancelarLista" class="cancel-btn">❌ Cancelar</button>
      </div>
    </div>
  `;
  
  // Event listeners para el selector
  document.getElementById('confirmarLista').addEventListener('click', () => {
    const selectedPresets = [];
    const checkboxes = document.querySelectorAll('.preset-selector-item input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
      const presetId = parseInt(checkbox.value);
      const preset = savedPresets.find(p => p.id === presetId);
      if (preset) selectedPresets.push(preset);
    });
    
    if (selectedPresets.length > 0) {
      const playlist = {
        id: Date.now(),
        nombre: nombreLista,
        presets: selectedPresets,
        fechaCreacion: new Date().toLocaleDateString()
      };
      
      savedPlaylists.push(playlist);
      guardarPlaylistsEnStorage();
      contenido.innerHTML = originalContent;
      inicializarMetronomo(); // Reinicializar controles
      renderizarPlaylists();
      mostrarNotificacion(`📋 Lista "${playlist.nombre}" creada con ${selectedPresets.length} presets`);
    } else {
      alert('⚠️ Selecciona al menos un preset para la lista.');
    }
  });
  
  document.getElementById('cancelarLista').addEventListener('click', () => {
    contenido.innerHTML = originalContent;
    inicializarMetronomo(); // Reinicializar controles
  });
}

// Función para aplicar un preset
function aplicarPreset(presetId) {
  const preset = savedPresets.find(p => p.id === presetId);
  if (!preset) return;
  
  // Aplicar configuración
  currentTempo = preset.tempo;
  currentTimeSignature = preset.timeSignature;
  currentSoundType = preset.soundType;
  
  // Actualizar UI
  actualizarTempo();
  
  const timeSignatureSelect = document.getElementById('timeSignatureSelect');
  const soundTypeSelect = document.getElementById('soundTypeSelect');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  
  if (timeSignatureSelect) {
    timeSignatureSelect.value = preset.timeSignature;
    document.getElementById('timeSignature').textContent = preset.timeSignature;
  }
  
  if (soundTypeSelect) {
    soundTypeSelect.value = preset.soundType;
  }
  
  if (volumeSlider && preset.volumen) {
    volumeSlider.value = preset.volumen;
    if (volumeValue) {
      volumeValue.textContent = preset.volumen + '%';
    }
  }
  
  mostrarNotificacion(`🎼 Preset "${preset.nombre}" aplicado`);
}

// Función para reproducir lista de reproducción
function reproducirPlaylist(playlistId) {
  const playlist = savedPlaylists.find(p => p.id === playlistId);
  if (!playlist || playlist.presets.length === 0) return;
  
  currentPlaylist = playlist;
  playlistIndex = 0;
  
  mostrarControladorPlaylist();
}

// Función para mostrar controlador de lista de reproducción
function mostrarControladorPlaylist() {
  if (!currentPlaylist) return;
  
  const preset = currentPlaylist.presets[playlistIndex];
  aplicarPreset(preset.id);
  
  // Mostrar controlador
  const contenido = document.getElementById('contenido');
  const metronomeHTML = contenido.innerHTML;
  
  contenido.innerHTML = `
    <div class="playlist-controller">
      <h3>🎵 Reproduciendo: "${currentPlaylist.nombre}"</h3>
      
      <div class="current-preset-info">
        <h4>Preset actual: ${preset.nombre}</h4>
        <p>${preset.tempo} BPM - ${preset.timeSignature}</p>
        <p>Preset ${playlistIndex + 1} de ${currentPlaylist.presets.length}</p>
      </div>
      
      <div class="playlist-controls">
        <button id="prevPreset" class="playlist-nav-btn" ${playlistIndex === 0 ? 'disabled' : ''}>
          ⏮️ Anterior
        </button>
        
        <button id="nextPreset" class="playlist-nav-btn" ${playlistIndex === currentPlaylist.presets.length - 1 ? 'disabled' : ''}>
          ⏭️ Siguiente
        </button>
        
        <button id="exitPlaylist" class="exit-playlist-btn">
          🚪 Salir de Lista
        </button>
      </div>
      
      <div class="playlist-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${((playlistIndex + 1) / currentPlaylist.presets.length) * 100}%"></div>
        </div>
      </div>
    </div>
    
    ${metronomeHTML}
  `;
  
  // Event listeners
  document.getElementById('prevPreset')?.addEventListener('click', () => {
    if (playlistIndex > 0) {
      playlistIndex--;
      mostrarControladorPlaylist();
    }
  });
  
  document.getElementById('nextPreset')?.addEventListener('click', () => {
    if (playlistIndex < currentPlaylist.presets.length - 1) {
      playlistIndex++;
      mostrarControladorPlaylist();
    }
  });
  
  document.getElementById('exitPlaylist')?.addEventListener('click', () => {
    currentPlaylist = null;
    playlistIndex = 0;
    mostrarMetronomo();
  });
  
  // Reinicializar controles del metrónomo
  inicializarMetronomo();
}

// Función para renderizar presets
function renderizarPresets() {
  const presetsList = document.getElementById('presetsList');
  if (!presetsList) return;
  
  if (savedPresets.length === 0) {
    presetsList.innerHTML = `
      <div class="no-presets">
        <span class="no-presets-icon">🎵</span>
        <p>No hay presets guardados</p>
        <small>Configura tempo y compás, luego presiona "Guardar Preset"</small>
      </div>
    `;
    return;
  }
  
  let presetsHTML = '';
  savedPresets.forEach(preset => {
    presetsHTML += `
      <div class="preset-item">
        <div class="preset-info">
          <h4 class="preset-name">${preset.nombre}</h4>
          <div class="preset-details">
            <span class="preset-tempo">${preset.tempo} BPM</span>
            <span class="preset-signature">${preset.timeSignature}</span>
            <span class="preset-sound">${preset.soundType}</span>
          </div>
          <small class="preset-date">Creado: ${preset.fechaCreacion}</small>
        </div>
        <div class="preset-actions">
          <button onclick="aplicarPreset(${preset.id})" class="apply-preset-btn">
            ▶️ Aplicar
          </button>
          <button onclick="eliminarPreset(${preset.id})" class="delete-preset-btn">
            🗑️
          </button>
        </div>
      </div>
    `;
  });
  
  presetsList.innerHTML = presetsHTML;
}

// Función para renderizar listas de reproducción
function renderizarPlaylists() {
  const playlistsContainer = document.getElementById('playlistsContainer');
  if (!playlistsContainer) return;
  
  if (savedPlaylists.length === 0) {
    playlistsContainer.innerHTML = `
      <div class="no-playlists">
        <span class="no-playlists-icon">📝</span>
        <p>No hay listas creadas</p>
        <small>Crea listas combinando múltiples presets</small>
      </div>
    `;
    return;
  }
  
  let playlistsHTML = '';
  savedPlaylists.forEach(playlist => {
    playlistsHTML += `
      <div class="playlist-item">
        <div class="playlist-info">
          <h4 class="playlist-name">${playlist.nombre}</h4>
          <div class="playlist-details">
            <span class="playlist-count">${playlist.presets.length} presets</span>
            <small class="playlist-date">Creada: ${playlist.fechaCreacion}</small>
          </div>
        </div>
        <div class="playlist-actions">
          <button onclick="reproducirPlaylist(${playlist.id})" class="play-playlist-btn">
            ▶️ Reproducir
          </button>
          <button onclick="eliminarPlaylist(${playlist.id})" class="delete-playlist-btn">
            🗑️
          </button>
        </div>
      </div>
    `;
  });
  
  playlistsContainer.innerHTML = playlistsHTML;
}

// Funciones de eliminación
function eliminarPreset(presetId) {
  if (confirm('¿Estás seguro de que quieres eliminar este preset?')) {
    savedPresets = savedPresets.filter(p => p.id !== presetId);
    guardarPresetsEnStorage();
    renderizarPresets();
    mostrarNotificacion('🗑️ Preset eliminado');
  }
}

function eliminarPlaylist(playlistId) {
  if (confirm('¿Estás seguro de que quieres eliminar esta lista de reproducción?')) {
    savedPlaylists = savedPlaylists.filter(p => p.id !== playlistId);
    guardarPlaylistsEnStorage();
    renderizarPlaylists();
    mostrarNotificacion('🗑️ Lista eliminada');
  }
}

// Funciones de limpieza
function limpiarPresets() {
  if (confirm('¿Estás seguro de que quieres eliminar todos los presets?')) {
    savedPresets = [];
    guardarPresetsEnStorage();
    renderizarPresets();
    mostrarNotificacion('🧹 Todos los presets eliminados');
  }
}

function limpiarPlaylists() {
  if (confirm('¿Estás seguro de que quieres eliminar todas las listas de reproducción?')) {
    savedPlaylists = [];
    guardarPlaylistsEnStorage();
    renderizarPlaylists();
    mostrarNotificacion('🧹 Todas las listas eliminadas');
  }
}

// Funciones de almacenamiento
function guardarPresetsEnStorage() {
  localStorage.setItem('violinApp_presets', JSON.stringify(savedPresets));
}

function cargarPresetsDesdeStorage() {
  const presets = localStorage.getItem('violinApp_presets');
  if (presets) {
    savedPresets = JSON.parse(presets);
  }
}

function guardarPlaylistsEnStorage() {
  localStorage.setItem('violinApp_playlists', JSON.stringify(savedPlaylists));
}

function cargarPlaylistsDesdeStorage() {
  const playlists = localStorage.getItem('violinApp_playlists');
  if (playlists) {
    savedPlaylists = JSON.parse(playlists);
  }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje) {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = 'notification';
  notificacion.textContent = mensaje;
  
  // Añadir al DOM
  document.body.appendChild(notificacion);
  
  // Mostrar con animación
  setTimeout(() => notificacion.classList.add('show'), 100);
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove('show');
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initializeToolButtons();
});