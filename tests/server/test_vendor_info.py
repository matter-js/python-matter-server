"""Test vendor info handling."""

from __future__ import annotations

from typing import Any, Self
from unittest.mock import MagicMock, patch

from matter_server.server.vendor_info import (
    DATA_KEY_VENDOR_INFO,
    DCL_REQUEST_TIMEOUT,
    NABUCASA_VENDOR,
    TEST_VENDOR,
    VendorInfo,
)


class _TimeoutResponse:
    """Response context manager that times out when JSON is read."""

    async def __aenter__(self) -> Self:
        """Enter the response context."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Exit the response context."""

    async def json(self) -> dict[str, Any]:
        """Raise a timeout to simulate a stalled DCL response."""
        raise TimeoutError


class _FakeClientSession:
    """Client session context manager that records initialization kwargs."""

    def __init__(self, call_kwargs: dict[str, Any]) -> None:
        """Initialize the fake session."""
        self.call_kwargs = call_kwargs

    async def __aenter__(self) -> Self:
        """Enter the session context."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Exit the session context."""

    def get(self, *args: Any, **kwargs: Any) -> _TimeoutResponse:
        """Return a response that times out."""
        return _TimeoutResponse()


async def test_vendor_info_start_handles_dcl_timeout() -> None:
    """Test vendor info startup continues when the DCL request times out."""
    server = MagicMock()
    server.storage.get.return_value = {}
    vendor_info = VendorInfo(server)
    client_session_kwargs: dict[str, Any] = {}

    def _client_session(**kwargs: Any) -> _FakeClientSession:
        client_session_kwargs.update(kwargs)
        return _FakeClientSession(kwargs)

    with patch("matter_server.server.vendor_info.ClientSession", _client_session):
        await vendor_info.start()

    assert client_session_kwargs == {
        "raise_for_status": True,
        "timeout": DCL_REQUEST_TIMEOUT,
    }
    server.storage.set.assert_called_once()
    storage_key, vendor_data = server.storage.set.call_args.args
    assert storage_key == DATA_KEY_VENDOR_INFO
    assert TEST_VENDOR.vendor_id in vendor_data
    assert NABUCASA_VENDOR.vendor_id in vendor_data
