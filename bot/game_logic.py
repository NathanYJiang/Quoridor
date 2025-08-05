"""
Game Logic Module

This module contains the core game logic for Quoridor,
mirroring the TypeScript implementation for use by the Python bot.
"""

from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass
from enum import Enum
import numpy as np


class WallOrientation(Enum):
    HORIZONTAL = "h"
    VERTICAL = "v"


@dataclass
class Position:
    x: int
    y: int


@dataclass
class Wall:
    x: int
    y: int
    orientation: WallOrientation


@dataclass
class Player:
    id: int
    x: int
    y: int
    walls: int


@dataclass
class GameState:
    board: List[List[int]]
    players: List[Player]
    walls: List[Wall]
    current_player: int
    winner: Optional[int]
    selected_player: Optional[int]
    is_wall_mode: bool
    wall_preview: Optional[Wall]


def create_initial_state() -> GameState:
    """Create the initial game state."""
    board = [[0 for _ in range(9)] for _ in range(9)]
    board[4][8] = 1  # Player 1 starts at (4,8)
    board[4][0] = 2  # Player 2 starts at (4,0)

    players = [Player(id=1, x=4, y=8, walls=10), Player(id=2, x=4, y=0, walls=10)]

    return GameState(
        board=board,
        players=players,
        walls=[],
        current_player=0,
        winner=None,
        selected_player=None,
        is_wall_mode=False,
        wall_preview=None,
    )


def is_within_bounds(x: int, y: int) -> bool:
    """Check if coordinates are within the 9x9 board."""
    return 0 <= x < 9 and 0 <= y < 9


def get_adjacent_squares(x: int, y: int) -> List[Position]:
    """Get all adjacent squares to a given position."""
    adjacent = []
    for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
        new_x, new_y = x + dx, y + dy
        if is_within_bounds(new_x, new_y):
            adjacent.append(Position(new_x, new_y))
    return adjacent


def is_wall_blocking(
    state: GameState, from_x: int, from_y: int, to_x: int, to_y: int
) -> bool:
    """Check if a wall blocks the move from (from_x, from_y) to (to_x, to_y)."""
    min_x, max_x = min(from_x, to_x), max(from_x, to_x)
    min_y, max_y = min(from_y, to_y), max(from_y, to_y)

    for wall in state.walls:
        if wall.orientation == WallOrientation.HORIZONTAL:
            if wall.y == max_y and wall.x <= max_x and wall.x + 1 >= min_x:
                return True
        else:  # vertical
            if wall.x == max_x and wall.y <= max_y and wall.y + 1 >= min_y:
                return True

    return False


def get_legal_moves(state: GameState, player_idx: int) -> List[Position]:
    """Get all legal moves for a player."""
    if state.winner is not None:
        return []

    player = state.players[player_idx]
    opponent = state.players[1 - player_idx]
    moves = []

    for adj in get_adjacent_squares(player.x, player.y):
        if is_wall_blocking(state, player.x, player.y, adj.x, adj.y):
            continue

        if adj.x == opponent.x and adj.y == opponent.y:
            # Jump over opponent
            jump_x = opponent.x + (opponent.x - player.x)
            jump_y = opponent.y + (opponent.y - player.y)

            if is_within_bounds(jump_x, jump_y) and not is_wall_blocking(
                state, opponent.x, opponent.y, jump_x, jump_y
            ):
                moves.append(Position(jump_x, jump_y))

            # Side moves when blocked
            if player.x == opponent.x:
                for side_x in [player.x - 1, player.x + 1]:
                    if (
                        is_within_bounds(side_x, player.y)
                        and not is_wall_blocking(
                            state, player.x, player.y, side_x, player.y
                        )
                        and not is_wall_blocking(
                            state, side_x, player.y, side_x, opponent.y
                        )
                    ):
                        moves.append(Position(side_x, player.y))
            elif player.y == opponent.y:
                for side_y in [player.y - 1, player.y + 1]:
                    if (
                        is_within_bounds(player.x, side_y)
                        and not is_wall_blocking(
                            state, player.x, player.y, player.x, side_y
                        )
                        and not is_wall_blocking(
                            state, player.x, side_y, opponent.x, side_y
                        )
                    ):
                        moves.append(Position(player.x, side_y))
        else:
            moves.append(adj)

    return moves


def has_path_to_goal(state: GameState, player_idx: int) -> bool:
    """Check if a player has a path to their goal using BFS."""
    player = state.players[player_idx]
    goal_y = 0 if player_idx == 0 else 8

    visited = set()
    queue = [(player.x, player.y)]

    while queue:
        x, y = queue.pop(0)
        if y == goal_y:
            return True

        if (x, y) in visited:
            continue
        visited.add((x, y))

        for adj in get_adjacent_squares(x, y):
            if (adj.x, adj.y) not in visited and not is_wall_blocking(
                state, x, y, adj.x, adj.y
            ):
                queue.append((adj.x, adj.y))

    return False


def is_legal_wall(state: GameState, wall: Wall) -> bool:
    """Check if a wall placement is legal."""
    if wall.x < 1 or wall.x > 8 or wall.y < 1 or wall.y > 8:
        return False

    for existing_wall in state.walls:
        if existing_wall.x == wall.x and existing_wall.y == wall.y:
            return False

        if wall.orientation == WallOrientation.HORIZONTAL:
            if (
                existing_wall.orientation == WallOrientation.HORIZONTAL
                and existing_wall.y == wall.y
                and abs(existing_wall.x - wall.x) <= 1
            ):
                return False
            if (
                existing_wall.orientation == WallOrientation.VERTICAL
                and existing_wall.x == wall.x
                and existing_wall.y == wall.y
            ):
                return False
        else:
            if (
                existing_wall.orientation == WallOrientation.VERTICAL
                and existing_wall.x == wall.x
                and abs(existing_wall.y - wall.y) <= 1
            ):
                return False
            if (
                existing_wall.orientation == WallOrientation.HORIZONTAL
                and existing_wall.y == wall.y
                and existing_wall.x == wall.x
            ):
                return False

    # Temporarily add wall and check if both players still have paths
    temp_state = GameState(
        board=state.board,
        players=state.players,
        walls=state.walls + [wall],
        current_player=state.current_player,
        winner=state.winner,
        selected_player=state.selected_player,
        is_wall_mode=state.is_wall_mode,
        wall_preview=state.wall_preview,
    )

    return has_path_to_goal(temp_state, 0) and has_path_to_goal(temp_state, 1)


def apply_move(state: GameState, player_idx: int, x: int, y: int) -> GameState:
    """Apply a move and return the new game state."""
    new_board = [row[:] for row in state.board]
    new_board[state.players[player_idx].x][state.players[player_idx].y] = 0
    new_board[x][y] = player_idx + 1

    new_players = []
    for i, player in enumerate(state.players):
        if i == player_idx:
            new_players.append(Player(id=player.id, x=x, y=y, walls=player.walls))
        else:
            new_players.append(player)

    winner = None
    if (player_idx == 0 and y == 0) or (player_idx == 1 and y == 8):
        winner = player_idx

    return GameState(
        board=new_board,
        players=new_players,
        walls=state.walls,
        current_player=1 - state.current_player,
        winner=winner,
        selected_player=None,
        is_wall_mode=False,
        wall_preview=None,
    )


def apply_wall(state: GameState, wall: Wall) -> GameState:
    """Apply a wall placement and return the new game state."""
    new_players = []
    for i, player in enumerate(state.players):
        if i == state.current_player:
            new_players.append(
                Player(id=player.id, x=player.x, y=player.y, walls=player.walls - 1)
            )
        else:
            new_players.append(player)

    return GameState(
        board=state.board,
        players=new_players,
        walls=state.walls + [wall],
        current_player=1 - state.current_player,
        winner=state.winner,
        selected_player=None,
        is_wall_mode=False,
        wall_preview=None,
    )
