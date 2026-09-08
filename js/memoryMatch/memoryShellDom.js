// Build once before modules bind gameplay listeners. IDs remain public DOM hooks.
const template = document.createElement("template");
template.innerHTML = `<div id="game-container" class="game-shell-tokens" style="display: none;">
      <div id="game-logo" data-shell-region="title" class="game-name">Memory Match</div>

      <div id="game-progress-hud" data-shell-region="progress" class="game-progress-hud" aria-label="Tiến trình màn chơi">
        <span class="info stat-card stat-moves"><span class="stat-label">MOVES</span><span id="moves">0</span></span>
        <span class="info stat-card stat-misses"><span class="stat-label">MISS</span><span id="misses">0</span></span>
        <span class="info stat-card stat-combo"><span class="stat-label">COMBO</span><span id="combo">0</span></span>
        <span class="info stat-card stat-star-progress" aria-label="Tiến trình sao màn hiện tại">
          <span id="level-stars" class="star-progress__stars" role="img" aria-label="0 trên 3 sao">
            <span class="star-progress__milestone" aria-hidden="true">★</span>
            <span class="star-progress__milestone" aria-hidden="true">★</span>
            <span class="star-progress__milestone" aria-hidden="true">★</span>
          </span>
          <span class="star-progress__track"><span id="level-stars-fill" class="star-progress__fill"></span></span>
        </span>
        <span class="info stat-card stat-points"><span class="stat-label">ĐIỂM</span><span id="score">0</span></span>
        <span class="info stat-card stat-progress" id="pair-progress"><span data-icon="trophy"></span><span id="matched-pairs">0</span>/<span id="total-pairs">0</span></span>
        <span class="info stat-card stat-hints" aria-label="Lượt gợi ý còn lại"><span data-icon="search"></span><span id="hint">0</span></span>
      </div>

      <div id="game-title" data-shell-region="hud" class="game-hud">
        <button
          id="btn-actions-menu"
          class="game-menu-toggle"
          type="button"
          aria-label="Mở menu chức năng"
          aria-controls="game-actions-menu"
          aria-expanded="false"
          data-icon="menu"
        ></button>

        <div id="game-actions-menu" class="game-actions-menu" hidden>
          <button id="btn-restart" class="game-action-item" type="button" data-icon="restart">Chơi lại</button>
          <button id="btn-menu" class="game-action-item" type="button" data-icon="home">Menu</button>
          <button id="btn-game-settings" class="game-action-item" type="button" data-icon="settings">Cài đặt</button>
          <button id="btn-shop" class="game-action-item" type="button" data-icon="shop">Cửa hàng</button>
          <button id="btn-game-collection" class="game-action-item" type="button" data-icon="collection">Bộ sưu tập</button>
          <button id="btn-game-help" class="game-action-item" type="button" data-icon="book">Hướng dẫn</button>
          <button id="btn-game-info" class="game-action-item" type="button" data-icon="info">Thông tin</button>
          <button id="btn-full-reset" class="game-action-item" type="button" data-icon="wand">Xóa dữ liệu</button>
        </div>

        <div class="game-quick-actions" aria-label="Hỗ trợ nhanh">
          <button id="btn-buy-time" class="game-quick-action" type="button" aria-label="Kho thời gian" data-icon="timer"></button>
          <button id="btn-preview-cards" class="game-quick-action" type="button" aria-label="Kho xem trước" data-icon="eye"></button>
        </div>

        <button id="btn-hint" class="game-hint-fab" type="button" aria-label="Dùng gợi ý">
          <span data-icon="search"></span>
        </button>

        <div class="game-stats" aria-label="Thông tin màn chơi">
          <span class="info stat-card stat-level"><span class="stat-label">LV</span><span id="level">1</span></span>
          <span class="info stat-card stat-timer" id="timer"><span data-icon="timer"></span><span id="timer-value">--:--</span></span>
          <span class="info stat-card stat-score"><span data-icon="star"></span><span id="total-stars">0</span></span>
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
