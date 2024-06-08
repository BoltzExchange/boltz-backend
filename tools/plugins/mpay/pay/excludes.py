from datetime import datetime, timedelta

from cachetools import TTLCache


class Excludes:
    _excludes: TTLCache

    def __init__(self) -> None:
        self._excludes = TTLCache(maxsize=25_000, ttl=timedelta(minutes=30), timer=datetime.now)

    def __contains__(self, channel: str) -> bool:
        """Check if the exclude list includes a channel."""
        return channel in self._excludes

    def __len__(self) -> int:
        """Return the number of entries in the cache."""
        return len(self._excludes)

    def add(self, channel: str) -> None:
        self._excludes[channel] = True

    def to_set(self) -> set[str]:
        return set(self._excludes.keys())

    def reset(self) -> None:
        self._excludes.clear()


class ExcludesPayment:
    _global_excludes: Excludes
    _excludes: set[str]

    def __init__(self, excludes: Excludes) -> None:
        self._global_excludes = excludes
        self._excludes = set()

    def __contains__(self, channel: str) -> bool:
        """Check if the local or global include list includes a channel."""
        return channel in self._excludes or channel in self._global_excludes

    def init_locals(self, excludes: list[str]) -> None:
        self._excludes = set(excludes)

    def add_local(self, exclude: str) -> None:
        self._excludes.add(exclude)

    def add(self, channel: str) -> None:
        self.add_local(channel)
        self._global_excludes.add(channel)

    def to_list(self) -> list[str]:
        return list(self._excludes.union(self._global_excludes.to_set()))
