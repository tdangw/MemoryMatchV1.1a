// Build once before modules bind gameplay listeners. IDs remain public DOM hooks.
const template = document.createElement("template");
template.innerHTML = `<div id="game-container" class="game-shell-tokens" style="display: none;">
      <div id="game-logo" data-shell-region="title" class="game-name">Memory Match</div>

      <div id="game-progress-hud" data-shell-region="progress" hidden></div>

      <div id="game-title" data-shell-region="hud" class="game-hud">
        <button
          id="btn-actions-menu"
          class="game-menu-toggle"
          type="button"
          aria-label="Mở menu chức năng"
          aria-controls="game-exit-modal"
          aria-haspopup="dialog"
          aria-expanded="false"
          data-icon="menu"
        ></button>

        <button id="memory-tools-toggle" class="memory-tools-toggle" type="button" aria-label="Mở công cụ hỗ trợ" aria-controls="memory-tools-menu" aria-expanded="false" data-icon="wand"></button>
        <div id="memory-tools-menu" class="memory-tools-menu" hidden>
          <div class="memory-tool-list" aria-label="Vật phẩm hỗ trợ">
            <button id="btn-hint" class="memory-tool-item" type="button" aria-label="Dùng gợi ý" data-icon="search">Gợi ý</button>
            <button id="btn-buy-time" class="memory-tool-item" type="button" aria-label="Kho thời gian" data-icon="timer">Thời gian</button>
            <button id="btn-preview-cards" class="memory-tool-item" type="button" aria-label="Kho xem trước" data-icon="eye">Xem trước</button>
          </div>
        </div>

        <div class="game-stats game-hud__stats" aria-label="Thông tin màn chơi">
          <div class="game-hud__stats-group game-hud__stats-group--left"><span class="info stat-card game-hud__metric stat-moves"><span class="stat-label">MOVES</span><span id="moves">0</span></span><span class="info stat-card game-hud__metric stat-misses"><span class="stat-label">MISS</span><span id="misses">0</span></span></div>
          <div class="game-hud__stats-group game-hud__stats-group--center"><span class="info stat-card game-hud__metric stat-level"><span class="stat-label">LEVEL</span><span id="level">1</span></span><span class="info stat-card game-hud__metric stat-timer" id="timer"><span class="stat-label">THỜI GIAN</span><span id="timer-value">--:--</span></span><span class="info stat-card game-hud__metric stat-stars"><span class="stat-label"><span data-icon="star"></span></span><span id="total-stars">0</span></span></div>
          <div class="game-hud__stats-group game-hud__stats-group--right"><span class="info stat-card game-hud__metric stat-combo"><span class="stat-label">COMBO</span><span id="combo">0</span><span class="combo-window-progress" aria-hidden="true"></span></span><span class="info stat-card game-hud__metric stat-points"><span class="stat-label">ĐIỂM</span><span id="score" class="game-hud__score-value">0</span></span></div>
        </div>
      </div>
      <section id="memory-special-hud" data-shell-region="milestones" class="memory-special-hud" aria-label="Tiến trình năng lượng đặc biệt">
        <span id="memory-game-coins" class="memory-special-hud__coins game-coin-hud" aria-label="Xu"><span data-icon="coin"></span><strong id="memory-coin-balance">0</strong></span>
        <div id="memory-special-milestones" class="memory-special-hud__milestones" aria-label="Các mốc phần thưởng">
          <span data-memory-special-milestone="1" style="--memory-milestone-position:5%">1</span>
          <span data-memory-special-milestone="2" style="--memory-milestone-position:15%">2</span>
          <span data-memory-special-milestone="3" style="--memory-milestone-position:25%">3</span>
          <span data-memory-special-milestone="4" style="--memory-milestone-position:35%">4</span>
          <span data-memory-special-milestone="5" style="--memory-milestone-position:45%">5</span>
          <span data-memory-special-milestone="6" style="--memory-milestone-position:55%">6</span>
          <span data-memory-special-milestone="7" style="--memory-milestone-position:65%">7</span>
          <span data-memory-special-milestone="8" style="--memory-milestone-position:75%">8</span>
          <span data-memory-special-milestone="9" style="--memory-milestone-position:85%">9</span>
          <span data-memory-special-milestone="10" style="--memory-milestone-position:95%">10</span>
        </div>
        <span class="game-milestone-stars stat-star-progress" aria-label="Tiến trình sao màn hiện tại"><span id="level-stars" class="star-progress__stars" role="img" aria-label="0 trên 3 sao"><span class="star-progress__milestone" aria-hidden="true">★</span><span class="star-progress__milestone" aria-hidden="true">★</span><span class="star-progress__milestone" aria-hidden="true">★</span></span><span class="star-progress__track"><span id="level-stars-fill" class="star-progress__fill"></span></span></span>
      </section>
      <div id="grid-board-frame" data-shell-region="frame">
        <div class="grid-coordinate-corner" aria-hidden="true"></div>
        <div id="grid-coordinate-columns" class="grid-coordinate-labels grid-coordinate-labels--columns" aria-hidden="true"></div>
        <div id="grid-coordinate-rows" class="grid-coordinate-labels grid-coordinate-labels--rows" aria-hidden="true"></div>
        <div id="grid-container" data-shell-region="board"></div>
      </div>
    </div>`;
export const memoryRoot = template.content.firstElementChild;
document.querySelector(".main-wrapper").prepend(memoryRoot);
