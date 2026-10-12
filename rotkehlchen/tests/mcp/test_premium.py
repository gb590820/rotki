from http import HTTPStatus
from typing import TYPE_CHECKING, Any

import pytest
import requests

from rotkehlchen.mcp import premium
from rotkehlchen.mcp.backend import configure_backend

if TYPE_CHECKING:
    from collections.abc import Generator


class MockResponse:
    def __init__(
            self,
            payload: dict[str, Any],
            status_code: HTTPStatus = HTTPStatus.OK,
            text: str = '',
    ) -> None:
        self.payload = payload
        self.status_code = status_code
        self.text = text

    def json(self) -> dict[str, Any]:
        return self.payload


@pytest.fixture(autouse=True)
def reset_cache() -> Generator[None]:
    premium.reset_premium_cache()
    yield
    premium.reset_premium_cache()


def _mock_mcp_capability(monkeypatch, enabled: bool) -> list[str]:
    """Patch requests.get to return the given MCP capability, tracking each call."""
    calls: list[str] = []

    def mock_get(url: str, **kwargs: Any) -> MockResponse:
        calls.append(url)
        return MockResponse({
            'result': {'current_tier': 'Local', 'mcp': {'enabled': enabled, 'minimum_tier': None}},
            'message': '',
        })

    monkeypatch.setattr(requests, 'get', mock_get)
    configure_backend(base_url='http://backend/api/1', timeout=5)
    return calls


@pytest.mark.parametrize('enabled', [True, False])
def test_has_mcp_access_should_follow_the_mcp_capability(monkeypatch, enabled: bool) -> None:
    _mock_mcp_capability(monkeypatch, enabled)
    assert premium.has_mcp_access() is enabled


def test_has_mcp_access_should_cache_result(monkeypatch) -> None:
    calls = _mock_mcp_capability(monkeypatch, enabled=True)
    assert premium.has_mcp_access() is True
    assert premium.has_mcp_access() is True
    assert len(calls) == 1  # second call served from the cache, no extra backend hit


def test_premium_gate_should_allow_enabled_capability(monkeypatch) -> None:
    _mock_mcp_capability(monkeypatch, enabled=True)
    assert premium.premium_gate() is None


def test_premium_gate_should_block_disabled_capability(monkeypatch) -> None:
    _mock_mcp_capability(monkeypatch, enabled=False)
    error = premium.premium_gate()
    assert error is not None
    assert error['error'] == 'premium_required'
    assert error['upgrade_url'] == premium.UPGRADE_URL


def test_premium_gate_should_fail_closed_on_missing_capability(monkeypatch) -> None:
    def mock_get(url: str, **kwargs: Any) -> MockResponse:
        return MockResponse({'result': {'current_tier': 'Basic'}, 'message': ''})

    monkeypatch.setattr(requests, 'get', mock_get)
    configure_backend(base_url='http://backend/api/1', timeout=5)

    error = premium.premium_gate()
    assert error is not None
    assert error['error'] == 'premium_check_failed'


def test_premium_gate_should_fail_closed_when_backend_unreachable(monkeypatch) -> None:
    def mock_get(url: str, **kwargs: Any) -> MockResponse:
        raise requests.exceptions.ConnectionError('connection refused')

    monkeypatch.setattr(requests, 'get', mock_get)
    configure_backend(base_url='http://backend/api/1', timeout=5)

    error = premium.premium_gate()
    assert error is not None
    assert error['error'] == 'premium_check_failed'
    assert 'Could not verify rotki premium subscription' in error['message']
