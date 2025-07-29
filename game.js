class Game {
    constructor() {
      this.canvas = document.getElementById("gameCanvas")
      this.ctx = this.canvas.getContext("2d")
      this.canvas.width = 800
      this.canvas.height = 600
  
      this.gridSize = 20
      this.tileCount = {
        x: this.canvas.width / this.gridSize,
        y: this.canvas.height / this.gridSize,
      }
  
      this.snake = new Snake(this.gridSize)
      this.food = []
      this.obstacles = []
      this.powerUps = []
      this.particles = []
  
      this.score = 0
      this.highScore = localStorage.getItem("neonSnakeHighScore") || 0
      this.gameRunning = true
      this.gameSpeed = 150
      this.lastTime = 0
  
      this.keys = {}
      this.foodSpawnTimer = 0
      this.powerUpSpawnTimer = 0
      this.obstacleSpawnTimer = 0
  
      this.backgroundParticles = []
      this.initBackgroundParticles()
      this.generateInitialFood()
      this.generateObstacles()
  
      this.setupEventListeners()
      this.gameLoop()
    }
  
    initBackgroundParticles() {
      for (let i = 0; i < 50; i++) {
        this.backgroundParticles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.1,
          hue: Math.random() * 360,
          alpha: Math.random() * 0.3 + 0.1,
        })
      }
    }
  
    generateInitialFood() {
      for (let i = 0; i < 3; i++) {
        this.spawnFood()
      }
    }
  
    generateObstacles() {
      // Generate some random obstacles
      for (let i = 0; i < 8; i++) {
        let x, y
        do {
          x = Math.floor(Math.random() * this.tileCount.x)
          y = Math.floor(Math.random() * this.tileCount.y)
        } while (
          (x >= 15 && x <= 25 && y >= 15 && y <= 20) || // Avoid center area
          this.obstacles.some((obs) => obs.x === x && obs.y === y)
        )
  
        this.obstacles.push(new Obstacle(x, y, this.gridSize))
      }
    }
  
    setupEventListeners() {
      document.addEventListener("keydown", (e) => {
        this.keys[e.code] = true
  
        // Prevent default for arrow keys to avoid scrolling
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
          e.preventDefault()
        }
      })
  
      document.addEventListener("keyup", (e) => {
        this.keys[e.code] = false
      })
    }
  
    spawnFood() {
      let x, y
      do {
        x = Math.floor(Math.random() * this.tileCount.x)
        y = Math.floor(Math.random() * this.tileCount.y)
      } while (
        this.snake.body.some((segment) => segment.x === x && segment.y === y) ||
        this.obstacles.some((obs) => obs.x === x && obs.y === y) ||
        this.food.some((food) => food.x === x && food.y === y)
      )
  
      const foodType = Math.random() < 0.7 ? "normal" : Math.random() < 0.8 ? "golden" : "speed"
      this.food.push(new Food(x, y, this.gridSize, foodType))
    }
  
    spawnPowerUp() {
      let x, y
      do {
        x = Math.floor(Math.random() * this.tileCount.x)
        y = Math.floor(Math.random() * this.tileCount.y)
      } while (
        this.snake.body.some((segment) => segment.x === x && segment.y === y) ||
        this.obstacles.some((obs) => obs.x === x && obs.y === y) ||
        this.food.some((food) => food.x === x && food.y === y)
      )
  
      const powerUpType = Math.random() < 0.5 ? "shield" : "magnet"
      this.powerUps.push(new PowerUp(x, y, this.gridSize, powerUpType))
    }
  
    update(currentTime) {
      if (!this.gameRunning) return
  
      if (currentTime - this.lastTime < this.gameSpeed) return
      this.lastTime = currentTime
  
      // Handle input
      if (this.keys["ArrowUp"] || this.keys["KeyW"]) {
        this.snake.changeDirection(0, -1)
      }
      if (this.keys["ArrowDown"] || this.keys["KeyS"]) {
        this.snake.changeDirection(0, 1)
      }
      if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
        this.snake.changeDirection(-1, 0)
      }
      if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
        this.snake.changeDirection(1, 0)
      }
  
      // Update snake
      this.snake.update()
  
      // Check wall collision
      if (
        this.snake.head.x < 0 ||
        this.snake.head.x >= this.tileCount.x ||
        this.snake.head.y < 0 ||
        this.snake.head.y >= this.tileCount.y
      ) {
        if (!this.snake.hasShield) {
          this.gameOver()
          return
        } else {
          this.snake.removeShield()
          this.createExplosion(this.snake.head.x * this.gridSize, this.snake.head.y * this.gridSize)
        }
      }
  
      // Check self collision
      for (let i = 1; i < this.snake.body.length; i++) {
        if (this.snake.head.x === this.snake.body[i].x && this.snake.head.y === this.snake.body[i].y) {
          if (!this.snake.hasShield) {
            this.gameOver()
            return
          } else {
            this.snake.removeShield()
            this.createExplosion(this.snake.head.x * this.gridSize, this.snake.head.y * this.gridSize)
          }
        }
      }
  
      // Check obstacle collision
      for (const obstacle of this.obstacles) {
        if (this.snake.head.x === obstacle.x && this.snake.head.y === obstacle.y) {
          if (!this.snake.hasShield) {
            this.gameOver()
            return
          } else {
            this.snake.removeShield()
            this.createExplosion(obstacle.x * this.gridSize, obstacle.y * this.gridSize)
          }
        }
      }
  
      // Check food collision
      for (let i = this.food.length - 1; i >= 0; i--) {
        const food = this.food[i]
        if (this.snake.head.x === food.x && this.snake.head.y === food.y) {
          this.snake.grow()
          this.createFoodParticles(food.x * this.gridSize, food.y * this.gridSize, food.type)
  
          switch (food.type) {
            case "normal":
              this.score += 10
              break
            case "golden":
              this.score += 25
              break
            case "speed":
              this.score += 15
              this.gameSpeed = Math.max(80, this.gameSpeed - 10)
              break
          }
  
          this.food.splice(i, 1)
          this.spawnFood()
          break
        }
      }
  
      // Check power-up collision
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const powerUp = this.powerUps[i]
        if (this.snake.head.x === powerUp.x && this.snake.head.y === powerUp.y) {
          this.createExplosion(powerUp.x * this.gridSize, powerUp.y * this.gridSize)
  
          switch (powerUp.type) {
            case "shield":
              this.snake.activateShield()
              break
            case "magnet":
              this.snake.activateMagnet()
              break
          }
  
          this.powerUps.splice(i, 1)
          this.score += 50
          break
        }
      }
  
      // Magnet effect
      if (this.snake.hasMagnet) {
        for (const food of this.food) {
          const dx = this.snake.head.x - food.x
          const dy = this.snake.head.y - food.y
          const distance = Math.sqrt(dx * dx + dy * dy)
  
          if (distance < 3) {
            if (Math.abs(dx) > Math.abs(dy)) {
              food.x += dx > 0 ? 1 : -1
            } else {
              food.y += dy > 0 ? 1 : -1
            }
          }
        }
      }
  
      // Spawn power-ups occasionally
      this.powerUpSpawnTimer++
      if (this.powerUpSpawnTimer >= 500 && this.powerUps.length < 2) {
        this.spawnPowerUp()
        this.powerUpSpawnTimer = 0
      }
  
      // Update background particles
      this.backgroundParticles.forEach((particle) => {
        particle.y += particle.speed
        if (particle.y > this.canvas.height) {
          particle.y = -particle.size
          particle.x = Math.random() * this.canvas.width
        }
        particle.hue = (particle.hue + 0.5) % 360
      })
  
      // Update particles
      this.particles = this.particles.filter((particle) => {
        particle.update()
        return particle.life > 0
      })
  
      // Update food and power-ups
      this.food.forEach((food) => food.update())
      this.powerUps.forEach((powerUp) => powerUp.update())
      this.obstacles.forEach((obstacle) => obstacle.update())
    }
  
    createFoodParticles(x, y, type) {
      const colors = {
        normal: "#00ff00",
        golden: "#ffd700",
        speed: "#ff6600",
      }
  
      for (let i = 0; i < 8; i++) {
        this.particles.push(new Particle(x + 10, y + 10, colors[type]))
      }
    }
  
    createExplosion(x, y) {
      for (let i = 0; i < 15; i++) {
        this.particles.push(new Particle(x + 10, y + 10, "#ff0000"))
      }
    }
  
    render() {
      // Clear canvas with gradient background
      const gradient = this.ctx.createRadialGradient(
        this.canvas.width / 2,
        this.canvas.height / 2,
        0,
        this.canvas.width / 2,
        this.canvas.height / 2,
        this.canvas.width / 2,
      )
      gradient.addColorStop(0, "#0a0a2e")
      gradient.addColorStop(1, "#000000")
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  
      // Draw background particles
      this.backgroundParticles.forEach((particle) => {
        this.ctx.globalAlpha = particle.alpha
        this.ctx.fillStyle = `hsl(${particle.hue}, 100%, 50%)`
        this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
      })
      this.ctx.globalAlpha = 1
  
      // Draw grid (subtle)
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
      this.ctx.lineWidth = 1
      for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, 0)
        this.ctx.lineTo(x, this.canvas.height)
        this.ctx.stroke()
      }
      for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
        this.ctx.beginPath()
        this.ctx.moveTo(0, y)
        this.ctx.lineTo(this.canvas.width, y)
        this.ctx.stroke()
      }
  
      // Draw game objects
      this.obstacles.forEach((obstacle) => obstacle.render(this.ctx))
      this.food.forEach((food) => food.render(this.ctx))
      this.powerUps.forEach((powerUp) => powerUp.render(this.ctx))
      this.snake.render(this.ctx)
      this.particles.forEach((particle) => particle.render(this.ctx))
  
      // Draw UI
      this.drawUI()
    }
  
    drawUI() {
      // Score
      this.ctx.fillStyle = "#00ffff"
      this.ctx.font = "24px Arial"
      this.ctx.fillText(`Score: ${this.score}`, 20, 30)
  
      // High Score
      this.ctx.fillStyle = "#ffff00"
      this.ctx.font = "18px Arial"
      this.ctx.fillText(`High Score: ${this.highScore}`, 20, 55)
  
      // Power-up indicators
      let yOffset = 80
      if (this.snake.hasShield) {
        this.ctx.fillStyle = "#00ff00"
        this.ctx.fillText("🛡️ SHIELD ACTIVE", 20, yOffset)
        yOffset += 25
      }
      if (this.snake.hasMagnet) {
        this.ctx.fillStyle = "#ff00ff"
        this.ctx.fillText("🧲 MAGNET ACTIVE", 20, yOffset)
      }
  
      // Game over screen
      if (!this.gameRunning) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  
        this.ctx.fillStyle = "#ff0000"
        this.ctx.font = "48px Arial"
        this.ctx.textAlign = "center"
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 50)
  
        this.ctx.fillStyle = "#ffffff"
        this.ctx.font = "24px Arial"
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2)
  
        if (this.score > this.highScore) {
          this.ctx.fillStyle = "#ffd700"
          this.ctx.fillText("NEW HIGH SCORE!", this.canvas.width / 2, this.canvas.height / 2 + 30)
        }
  
        this.ctx.fillStyle = "#00ffff"
        this.ctx.font = "18px Arial"
        this.ctx.fillText("Press R to Restart", this.canvas.width / 2, this.canvas.height / 2 + 80)
        this.ctx.textAlign = "left"
      }
    }
  
    gameOver() {
      this.gameRunning = false
      if (this.score > this.highScore) {
        this.highScore = this.score
        localStorage.setItem("neonSnakeHighScore", this.highScore)
      }
  
      document.addEventListener("keydown", (e) => {
        if (e.code === "KeyR" && !this.gameRunning) {
          this.restart()
        }
      })
    }
  
    restart() {
      this.snake = new Snake(this.gridSize)
      this.food = []
      this.powerUps = []
      this.particles = []
      this.obstacles = []
      this.score = 0
      this.gameRunning = true
      this.gameSpeed = 150
      this.powerUpSpawnTimer = 0
  
      this.generateInitialFood()
      this.generateObstacles()
    }
  
    gameLoop() {
      const currentTime = Date.now()
      this.update(currentTime)
      this.render()
      requestAnimationFrame(() => this.gameLoop())
    }
  }
  
  class Snake {
    constructor(gridSize) {
      this.gridSize = gridSize
      this.body = [
        { x: 20, y: 15 },
        { x: 19, y: 15 },
        { x: 18, y: 15 },
      ]
      this.dx = 1
      this.dy = 0
      this.hasShield = false
      this.hasMagnet = false
      this.shieldTimer = 0
      this.magnetTimer = 0
    }
  
    get head() {
      return this.body[0]
    }
  
    changeDirection(dx, dy) {
      // Prevent reversing into itself
      if (this.dx === -dx && this.dy === -dy) return
      this.dx = dx
      this.dy = dy
    }
  
    update() {
      const head = { x: this.head.x + this.dx, y: this.head.y + this.dy }
      this.body.unshift(head)
      this.body.pop()
  
      // Update power-up timers
      if (this.hasShield) {
        this.shieldTimer--
        if (this.shieldTimer <= 0) {
          this.hasShield = false
        }
      }
  
      if (this.hasMagnet) {
        this.magnetTimer--
        if (this.magnetTimer <= 0) {
          this.hasMagnet = false
        }
      }
    }
  
    grow() {
      this.body.push({ ...this.body[this.body.length - 1] })
    }
  
    activateShield() {
      this.hasShield = true
      this.shieldTimer = 300 // 5 seconds at 60fps
    }
  
    activateMagnet() {
      this.hasMagnet = true
      this.magnetTimer = 600 // 10 seconds at 60fps
    }
  
    removeShield() {
      this.hasShield = false
      this.shieldTimer = 0
    }
  
    render(ctx) {
      this.body.forEach((segment, index) => {
        const x = segment.x * this.gridSize
        const y = segment.y * this.gridSize
  
        if (index === 0) {
          // Head
          ctx.fillStyle = this.hasShield ? "#00ff00" : "#00ffff"
          ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4)
  
          // Eyes
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(x + 5, y + 5, 3, 3)
          ctx.fillRect(x + 12, y + 5, 3, 3)
  
          // Shield effect
          if (this.hasShield) {
            ctx.strokeStyle = "#00ff00"
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, this.gridSize, this.gridSize)
          }
        } else {
          // Body
          const alpha = 1 - (index / this.body.length) * 0.5
          ctx.globalAlpha = alpha
          ctx.fillStyle = this.hasMagnet ? "#ff00ff" : "#ffffff"
          ctx.fillRect(x + 3, y + 3, this.gridSize - 6, this.gridSize - 6)
          ctx.globalAlpha = 1
        }
      })
    }
  }
  
  class Food {
    constructor(x, y, gridSize, type = "normal") {
      this.x = x
      this.y = y
      this.gridSize = gridSize
      this.type = type
      this.pulse = 0
    }
  
    update() {
      this.pulse += 0.1
    }
  
    render(ctx) {
      const x = this.x * this.gridSize
      const y = this.y * this.gridSize
      const pulseSize = Math.sin(this.pulse) * 2
  
      switch (this.type) {
        case "normal":
          ctx.fillStyle = "#00ff00"
          break
        case "golden":
          ctx.fillStyle = "#ffd700"
          break
        case "speed":
          ctx.fillStyle = "#ff6600"
          break
      }
  
      ctx.fillRect(
        x + 4 - pulseSize,
        y + 4 - pulseSize,
        this.gridSize - 8 + pulseSize * 2,
        this.gridSize - 8 + pulseSize * 2,
      )
  
      // Glow effect
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 10
      ctx.fillRect(x + 6, y + 6, this.gridSize - 12, this.gridSize - 12)
      ctx.shadowBlur = 0
    }
  }
  
  class PowerUp {
    constructor(x, y, gridSize, type) {
      this.x = x
      this.y = y
      this.gridSize = gridSize
      this.type = type
      this.rotation = 0
    }
  
    update() {
      this.rotation += 0.1
    }
  
    render(ctx) {
      const x = this.x * this.gridSize + this.gridSize / 2
      const y = this.y * this.gridSize + this.gridSize / 2
  
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(this.rotation)
  
      switch (this.type) {
        case "shield":
          ctx.fillStyle = "#00ff00"
          ctx.fillRect(-8, -8, 16, 16)
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(-6, -6, 12, 12)
          break
        case "magnet":
          ctx.fillStyle = "#ff00ff"
          ctx.fillRect(-8, -8, 16, 16)
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(-2, -6, 4, 12)
          ctx.fillRect(-6, -2, 12, 4)
          break
      }
  
      ctx.restore()
    }
  }
  
  class Obstacle {
    constructor(x, y, gridSize) {
      this.x = x
      this.y = y
      this.gridSize = gridSize
      this.pulse = Math.random() * Math.PI * 2
    }
  
    update() {
      this.pulse += 0.05
    }
  
    render(ctx) {
      const x = this.x * this.gridSize
      const y = this.y * this.gridSize
      const pulseIntensity = Math.sin(this.pulse) * 0.3 + 0.7
  
      ctx.globalAlpha = pulseIntensity
      ctx.fillStyle = "#ff0000"
      ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2)
  
      ctx.fillStyle = "#aa0000"
      ctx.fillRect(x + 3, y + 3, this.gridSize - 6, this.gridSize - 6)
      ctx.globalAlpha = 1
    }
  }
  
  class Particle {
    constructor(x, y, color) {
      this.x = x
      this.y = y
      this.vx = (Math.random() - 0.5) * 8
      this.vy = (Math.random() - 0.5) * 8
      this.life = 30
      this.maxLife = 30
      this.color = color
      this.size = Math.random() * 4 + 2
    }
  
    update() {
      this.x += this.vx
      this.y += this.vy
      this.vx *= 0.95
      this.vy *= 0.95
      this.life--
    }
  
    render(ctx) {
      const alpha = this.life / this.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = this.color
      ctx.fillRect(this.x, this.y, this.size, this.size)
      ctx.globalAlpha = 1
    }
  }
  
  // Initialize game when page loads
  window.addEventListener("load", () => {
    new Game()
  })
  