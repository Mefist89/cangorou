// Interpreter — converts AST to a flat command queue for Phaser execution
import type { ASTNode } from './parser';

export type CommandAction =
  | { type: 'pas' }
  | { type: 'rotire_dreapta' }
  | { type: 'rotire_stinga' }
  | { type: 'vopseste' }
  | { type: 'sari' };

export interface GridState {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  gridWidth: number;
  gridHeight: number;
  obstacles: Map<string, { type: string }>;
}

function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

function getNextPos(state: GridState): { x: number; y: number } {
  switch (state.direction) {
    case 'up': return { x: state.x, y: state.y - 1 };
    case 'down': return { x: state.x, y: state.y + 1 };
    case 'left': return { x: state.x - 1, y: state.y };
    case 'right': return { x: state.x + 1, y: state.y };
  }
}

function isFree(state: GridState): boolean {
  const next = getNextPos(state);
  if (next.x < 0 || next.x >= state.gridWidth || next.y < 0 || next.y >= state.gridHeight) {
    return false;
  }
  return !state.obstacles.has(posKey(next.x, next.y));
}

function turnRight(dir: GridState['direction']): GridState['direction'] {
  const turns: Record<string, GridState['direction']> = {
    up: 'right', right: 'down', down: 'left', left: 'up'
  };
  return turns[dir];
}

function turnLeft(dir: GridState['direction']): GridState['direction'] {
  const turns: Record<string, GridState['direction']> = {
    up: 'left', left: 'down', down: 'right', right: 'up'
  };
  return turns[dir];
}

const MAX_COMMANDS = 1000; // Safety limit to prevent infinite loops

export function interpret(ast: ASTNode[], initialState: GridState): CommandAction[] {
  const commands: CommandAction[] = [];
  const state = { ...initialState };

  function walk(nodes: ASTNode[]) {
    for (const node of nodes) {
      if (commands.length >= MAX_COMMANDS) return;

      switch (node.type) {
        case 'command':
          commands.push({ type: node.name as CommandAction['type'] });
          // Update state for conditional evaluation
          if (node.name === 'pas') {
            if (isFree(state)) {
              const next = getNextPos(state);
              state.x = next.x;
              state.y = next.y;
            }
          } else if (node.name === 'rotire_dreapta') {
            state.direction = turnRight(state.direction);
          } else if (node.name === 'rotire_stinga') {
            state.direction = turnLeft(state.direction);
          } else if (node.name === 'sari') {
            const next = getNextPos(state);
            const obsKey = posKey(next.x, next.y);
            
            // Safe way to get obstacle type if it's a Map
            let isTree = false;
            if (typeof state.obstacles.get === 'function') {
               const obs = state.obstacles.get(obsKey);
               if (obs && obs.type === 'tree') isTree = true;
            }
            
            if (isTree) {
              // Cannot jump over tree, stay in place
            } else {
              // Check landing spot
              const tempState = { ...state, x: next.x, y: next.y };
              const landing = getNextPos(tempState);
              const landingKey = posKey(landing.x, landing.y);
              
              if (
                landing.x >= 0 && landing.x < state.gridWidth &&
                landing.y >= 0 && landing.y < state.gridHeight &&
                !state.obstacles.has(landingKey)
              ) {
                state.x = landing.x;
                state.y = landing.y;
              }
            }
          }
          break;

        case 'loop':
          for (let i = 0; i < node.count && commands.length < MAX_COMMANDS; i++) {
            walk(node.body);
          }
          break;

        case 'conditional':
          if (node.condition === 'liber' && isFree(state)) {
            walk(node.body);
          }
          break;
      }
    }
  }

  walk(ast);
  return commands;
}
