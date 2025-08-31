"""Test fabric label validation functionality."""
# pylint: disable=protected-access

import logging

import pytest


class MockDeviceController:
    """Mock device controller with fabric label validation logic."""

    def __init__(self):
        """Initialize mock device controller."""
        self._default_fabric_label = None
        self.logger = logging.getLogger(__name__)

    async def set_default_fabric_label(self, label: str | None) -> None:
        """Set the default fabric label with validation."""
        if label is not None and len(label) > 32:
            self.logger.info(
                "Fabric label '%s' exceeds 32 characters, truncating to '%s'",
                label,
                label[:32],
            )
            label = label[:32]
        self._default_fabric_label = label


class TestFabricLabelValidation:
    """Test fabric label length validation."""

    @pytest.fixture
    def mock_device_controller(self):
        """Create a mock device controller for testing."""
        return MockDeviceController()

    @pytest.mark.asyncio
    async def test_fabric_label_under_32_chars(self, mock_device_controller, caplog):
        """Test that fabric labels under 32 characters are not modified."""
        label = "Short Label"

        with caplog.at_level(logging.INFO):
            await mock_device_controller.set_default_fabric_label(label)

        assert mock_device_controller._default_fabric_label == label
        assert not caplog.records  # No log messages should be generated

    @pytest.mark.asyncio
    async def test_fabric_label_exactly_32_chars(self, mock_device_controller, caplog):
        """Test that fabric labels exactly 32 characters are not modified."""
        label = "A" * 32  # Exactly 32 characters

        with caplog.at_level(logging.INFO):
            await mock_device_controller.set_default_fabric_label(label)

        assert mock_device_controller._default_fabric_label == label
        assert len(mock_device_controller._default_fabric_label) == 32
        assert not caplog.records  # No log messages should be generated

    @pytest.mark.asyncio
    async def test_fabric_label_over_32_chars_truncated(
        self, mock_device_controller, caplog
    ):
        """Test that fabric labels over 32 characters are truncated."""
        long_label = (
            "This is a very long fabric label that exceeds the 32 character limit"
        )
        expected_truncated = long_label[:32]

        with caplog.at_level(logging.INFO):
            await mock_device_controller.set_default_fabric_label(long_label)

        assert mock_device_controller._default_fabric_label == expected_truncated
        assert len(mock_device_controller._default_fabric_label) == 32

        # Check that a log message was generated
        assert len(caplog.records) == 1
        assert caplog.records[0].levelname == "INFO"
        assert "exceeds 32 characters, truncating" in caplog.records[0].message
        assert long_label in caplog.records[0].message
        assert expected_truncated in caplog.records[0].message

    @pytest.mark.asyncio
    async def test_fabric_label_none_value(self, mock_device_controller, caplog):
        """Test that None values are handled properly."""
        with caplog.at_level(logging.INFO):
            await mock_device_controller.set_default_fabric_label(None)

        assert mock_device_controller._default_fabric_label is None
        assert not caplog.records  # No log messages should be generated

    @pytest.mark.asyncio
    async def test_fabric_label_empty_string(self, mock_device_controller, caplog):
        """Test that empty strings are handled properly."""
        label = ""

        with caplog.at_level(logging.INFO):
            await mock_device_controller.set_default_fabric_label(label)

        assert mock_device_controller._default_fabric_label == label
        assert not caplog.records  # No log messages should be generated

    @pytest.mark.asyncio
    async def test_fabric_label_unicode_characters(
        self, mock_device_controller, caplog
    ):
        """Test that unicode characters are handled properly in truncation."""
        # Unicode string that's longer than 32 characters
        unicode_label = "Café™ ★ 🏠 This is a unicode string that exceeds 32 chars"
        expected_truncated = unicode_label[:32]

        with caplog.at_level(logging.INFO):
            await mock_device_controller.set_default_fabric_label(unicode_label)

        assert mock_device_controller._default_fabric_label == expected_truncated
        assert len(mock_device_controller._default_fabric_label) == 32

        # Check that a log message was generated
        assert len(caplog.records) == 1
        assert "exceeds 32 characters, truncating" in caplog.records[0].message
