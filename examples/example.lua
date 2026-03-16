-- BLOCK: Lua Game Development Example
-- Demonstrates block parsing in Lua, commonly used in game development
-- Lua uses -- for comments

-- SUBBLOCK1: Game State Management
local GameState = {}
GameState.players = {}
GameState.running = true

-- SUBBLOCK2: Player Class
local Player = {}
Player.__index = Player

function Player.new(name, x, y)
    local self = setmetatable({}, Player)
    self.name = name
    self.x = x
    self.y = y
    self.health = 100
    return self
end

-- SUBBLOCK2: Player Methods
function Player:move(dx, dy)
    self.x = self.x + dx
    self.y = self.y + dy
end

function Player:take_damage(amount)
    self.health = self.health - amount
    if self.health <= 0 then
        self.health = 0
        return true  -- Player is dead
    end
    return false
end

-- SUBBLOCK1: Game Logic Functions
-- SUBBLOCK2: Update Function
function GameState:update(dt)
    for _, player in ipairs(self.players) do
        -- Update player state
        if player.health > 0 then
            -- Game logic here
        end
    end
end

-- SUBBLOCK2: Render Function
function GameState:render()
    -- Render all game objects
    for _, player in ipairs(self.players) do
        print(string.format("Player %s at (%.1f, %.1f)", 
            player.name, player.x, player.y))
    end
end

-- SUBBLOCK1: Main Game Loop
function main()
    -- SUBBLOCK2: Initialize Game
    table.insert(GameState.players, Player.new("Hero", 0, 0))
    table.insert(GameState.players, Player.new("Enemy", 10, 10))
    
    -- SUBBLOCK2: Game Loop
    while GameState.running do
        GameState:update(0.016)  -- 60 FPS
        GameState:render()
    end
end

main()
