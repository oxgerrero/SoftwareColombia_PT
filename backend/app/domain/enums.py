from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    READER = "reader"

    def can_write(self) -> bool:
        return self in (Role.ADMIN, Role.EDITOR)

    def can_delete(self) -> bool:
        return self == Role.ADMIN
