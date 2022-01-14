<script lang='ts'>
import { clear_loops } from "svelte/internal"


  interface Cell {
    class: string
    character: string
  }
  interface SnakePart {
    c: Cell
    x: number
    y: number
  }
  interface SnakeStyle {
    head: string
    body: string
    tail: string
  }
  interface Score {
    foods: number
    foodValue: number
    duration: number
    character: string
  }

  let playing: boolean = false
  let accumulator: number = 0
  let gameDuration: number = 0
  let lastFrame = performance.now()
  let tickrate = 100
  let framesSinceLastFood = 40
  let foodRate = 40
  let difficulty = 1.0
  let foodCharacters = Array(20).fill('').map((_,i)=>String.fromCodePoint(0x1f350+i))
  let death: 'self'|'wall'|'' = ''

  let snakeStyles: SnakeStyle[] = [
    {
      'head': '🐭',
      'body': '🐁',
      'tail': '🐁',
    },
    {
      'head': '🐷',
      'body': '🐖',
      'tail': '🐖',
    },
    {
      'head': '🐵',
      'body': '🐒',
      'tail': '🐒',
    },
    {
      'head': '🐶',
      'body': '🐕',
      'tail': '🐕',
    },
    {
      'head': '🐲',
      'body': '🐉',
      'tail': '🐉',
    },
    {
      'head': '🐜',
      'body': '🐜',
      'tail': '🐜',
    },
    {
      'head': '🐗',
      'body': '🐖',
      'tail': '🐖',
    }
  ]
  let snakeStyle: SnakeStyle

  let heldKeys: Record<string, boolean> = {}

  let rows: Cell[][] = Array(30).fill([]).map(_=>Array(30).fill({}).map(_=>({class:'', character: ''})))

  let snakeDirection: 'l'|'r'|'u'|'d'
  let snakeParts: SnakePart[] = []
  let dirMap = {
    'l': { x: -1,  y: 0  },
    'r': { x:  1,  y: 0  },
    'u': { x:  0,  y: -1 },
    'd': { x:  0,  y: 1  },
  }
  let foods: SnakePart[] = []

  let score: Score = {foods: 0, foodValue: 0, duration: 0, character: ''}
  let lastScore: Score = {foods: 0, foodValue: 0, duration: 0, character: ''}
  let bestScore: Score = {foods: 0, foodValue: 0, duration: 0, character: ''}

  function handleFocus() {
    playing = true
    lastFrame = performance.now()
    step(lastFrame)
  }
  function handleBlur() {
    playing = false
  }
  function handleKeydown(e: KeyboardEvent) {
    heldKeys[e.code] = true
  }
  function handleKeyup(e: KeyboardEvent) {
    delete heldKeys[e.code]
    if (death) {
      death = ''
      init()
      render()
    }
  }
  function init() {
    let seed = Math.random()
    snakeDirection = ['l','r','u','d'][Math.floor(seed*4)]
    snakeParts = [{
      c: {
        class: 'snake',
        character: '',
      },
      x: Math.max(8, Math.min(rows.length-9, Math.round(seed*rows.length-1))),
      y: Math.max(8, Math.min(rows[0].length-9, Math.round(seed*rows[0].length-1))),
    }]
    foods = []
    framesSinceLastFood = 40
    snakeStyle = snakeStyles[Math.floor(seed*(snakeStyles.length))]
    lastScore = score
    if (calculateScore(lastScore) > calculateScore(bestScore)) {
      bestScore = lastScore
    }
    score = {
      foods: 0,
      foodValue: 0,
      duration: 0,
      character: snakeStyle.head,
    }
    accumulator = 0
    gameDuration = 0
    lastFrame = performance.now()
  }
  function step(timestamp: number) {
    if (!playing) return
    accumulator += timestamp - lastFrame
    gameDuration += timestamp - lastFrame

    // Process inputs.
    if (heldKeys['KeyH'] || heldKeys['ArrowLeft']) {
      snakeDirection = 'l'
    } else if (heldKeys['KeyL'] || heldKeys['ArrowRight']) {
      snakeDirection = 'r'
    } else if (heldKeys['KeyK'] || heldKeys['ArrowUp']) {
      snakeDirection = 'u'
    } else if (heldKeys['KeyJ'] || heldKeys['ArrowDown']) {
      snakeDirection = 'd'
    }

    difficulty = 1 - (Math.round(gameDuration / 5000) * .025)

    let adjustedTickrate = tickrate * difficulty

    // Process world.
    while (accumulator >= adjustedTickrate) {
      if (!death) {
        score.duration++
        // Move snake
        let dir = dirMap[snakeDirection]
        // Get current head and reassign it to body.
        let head = snakeParts[0]
        head.c.class = 'snake-body'
        head.c.character = snakeStyle.body

        // Add new head.
        snakeParts.unshift({
          c: {
            class: 'snake-head',
            character: snakeStyle.head,
          },
          x: head.x + dir.x,
          y: head.y + dir.y,
        })
        head = snakeParts[0]

        // Check if we hit a food.
        let ate = false
        for (let i = foods.length-1; i >= 0; i--) {
          let f = foods[i]
          if (f.x === head.x && f.y === head.y) {
            foods.splice(i, 1)
            score.foods++
            score.foodValue += f.c.character.codePointAt(0) - 0x1f250
            ate = true
          }
        }
        if (!ate) {
          // Pop old tail (or head)
          snakeParts.pop()
        }
        // Set last part to tail.
        if (snakeParts.length > 1) {
          snakeParts[snakeParts.length-1].c.class = 'snake-tail'
          snakeParts[snakeParts.length-1].c.character = snakeStyle.tail
        }

        // Check if we collided with ourselves or the wall.
        head = snakeParts[0]
        for (let p of snakeParts) {
          if (p === head) continue
          if (head.x === p.x && head.y === p.y) {
            death = 'self'
            break
          }
        }
        if (head.x < 0 || head.y < 0 || head.x >= rows.length || head.y >= rows[0].length) {
          death = 'wall'
        }

        // Add food.
        framesSinceLastFood++
        if (framesSinceLastFood >= foodRate) {
          let food = {
            c: {
              class: 'food',
              character: foodCharacters[Math.floor(Math.random()*foodCharacters.length)],
            },
            x: 0,
            y: 0,
          }
          let attempts = 0
          while (attempts < 20) {
            food.x = Math.max(1, Math.min(rows.length-1, Math.round(Math.random()*rows.length-1)))
            food.y = Math.max(1, Math.min(rows[0].length-1, Math.round(Math.random()*rows[0].length-1)))
            if (!snakeParts.find(v=>v.x===food.x&&v.y===food.y) && !foods.find(v=>v.x===food.x&&v.y===food.y)) {
              foods.push(food)
              break
            }
            attempts++
          }
          framesSinceLastFood = 0
        }
      }

      accumulator -= adjustedTickrate
    }

    render()

    lastFrame = timestamp

    requestAnimationFrame(step)
  }
  function render() {
    for (let row of rows) {
      for (let cell of row) {
        cell.class = ''
        cell.character = ''
      }
    }

    for (let f of foods) {
      let r = rows[f.y]
      if (!r) continue
      let c = r[f.x]
      if (!c) continue
      c.class = f.c.class
      c.character = f.c.character
    }

    for (let p of snakeParts) {
      let r = rows[p.y]
      if (!r) continue
      let c = r[p.x]
      if (!c) continue
      c.class = p.c.class
      c.character = p.c.character
    }

    rows = [...rows]
  }
  function calculateScore(score: Score) {
    return score.foodValue + Math.round(score.duration/10)
  }
  init()
  render()
</script>

<main on:focus={handleFocus} on:blur={handleBlur} on:keydown={handleKeydown} on:keyup={handleKeyup} tabindex="0">
  <section class='board'>
    <section class='scoreboard'>
      <article>
        Score: {score.character} {calculateScore(score)} ({score.foods})
      </article>
      <article>
        Last: {lastScore.character} {calculateScore(lastScore)} ({lastScore.foods})
      </article>
      <article>
        Best: {bestScore.character} {calculateScore(bestScore)} ({bestScore.foods})
      </article>
    </section>
    <section class='playfield' style='--rows: {rows.length}'>
      {#each rows as row}
        <div class='row' style='--columns: {rows.length}'>
          {#each row as cell}
            <div class='cell'>
              <div class={cell.class}>{cell.character}</div>
            </div>
          {/each}
        </div>
      {/each}
    </section>
  </section>
  {#if death}
    <section class='overlay'>
      <button tabindex="-1">Oops! Press any key to try again.</button>
    </section>
  {/if}
  {#if !playing}
    <section class='overlay'>
      <button tabindex="-1">Focus to play!</button>
    </section>
  {/if}
</main>

<style>
  main {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .board {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .scoreboard {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .playfield {
    border: 1px solid white;
    display: grid;
    grid-template-rows: repeat(var(--rows), 2ch);
    grid-template-columns: minmax(0, 1fr);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(var(--columns), 2ch);
    grid-template-rows: minmax(0, 2ch);
  }
  .overlay {
    position: absolute;
    left: 0; top: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(32, 32, 32, 0.5);
    pointer-events: none;
  }
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(32, 32, 32, 0.5);
    margin-top: -1px;
    margin-left: -1px;
  }
</style>