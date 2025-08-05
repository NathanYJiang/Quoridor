"""
Quoridor AI Bot Package

This package contains the AI bot implementation for playing Quoridor.
"""

from .main import QuoridorBot, Player, WallOrientation, Position, Wall, GameState
from .game_logic import (
    create_initial_state,
    get_legal_moves,
    get_adjacent_squares,
    is_wall_blocking,
    has_path_to_goal,
    is_legal_wall,
    apply_move,
    apply_wall,
)

__version__ = "1.0.0"
__author__ = "Quoridor Bot Team"

__all__ = [
    "QuoridorBot",
    "Player",
    "WallOrientation",
    "Position",
    "Wall",
    "GameState",
    "create_initial_state",
    "get_legal_moves",
    "get_adjacent_squares",
    "is_wall_blocking",
    "has_path_to_goal",
    "is_legal_wall",
    "apply_move",
    "apply_wall",
]
