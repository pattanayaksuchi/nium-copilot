"""Validation helpers backed by corridor-specific JSON Schemas."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from jsonschema import Draft202012Validator

from . import settings


class SchemaNotFoundError(FileNotFoundError):
    """Raised when a validation schema for the given corridor does not exist."""


def schema_path(currency: str, country: str) -> Path:
    code = f"{currency.strip().upper()}_{country.strip().upper()}"
    return settings.SCHEMA_DIR / f"schema_{code}.json"


def load_schema(currency: str, country: str) -> Dict[str, Any]:
    path = schema_path(currency, country)
    if not path.exists():
        raise SchemaNotFoundError(f"No schema found for {currency}/{country}: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _select_method(
    schema: Dict[str, Any],
    method: Optional[str],
) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    methods = schema.get("payout_methods")
    if not methods:
        return None, None
    lookup = {key.lower(): key for key in methods}
    requested = (method or "").lower()
    if requested and requested in lookup:
        key = lookup[requested]
        return key, methods[key]
    if "bank" in lookup:
        key = lookup["bank"]
        return key, methods[key]
    first_key = next(iter(methods), None)
    if first_key is None:
        return None, None
    return first_key, methods[first_key]


def _select_channel(method_block: Dict[str, Any], channel: Optional[str]) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    channels = method_block.get("channels") or {}
    if not channels:
        return None, None
    lookup = {key.lower(): key for key in channels}
    requested = (channel or "").lower()
    if requested and requested in lookup:
        key = lookup[requested]
        return key, channels[key]
    default_channel = method_block.get("default_channel")
    if isinstance(default_channel, str) and default_channel.lower() in lookup:
        key = lookup[default_channel.lower()]
        return key, channels[key]
    if "local" in lookup:
        key = lookup["local"]
        return key, channels[key]
    first_key = next(iter(channels), None)
    if first_key is None:
        return None, None
    return first_key, channels[first_key]


def validate_payload(
    payload: Dict[str, Any],
    currency: str,
    country: str,
    *,
    method: Optional[str] = None,
    channel: Optional[str] = None,
) -> Dict[str, Any]:
    """Validate payload against corridor schema and return structured result."""

    try:
        schema = load_schema(currency, country)
    except SchemaNotFoundError as exc:
        return {
            "valid": False,
            "errors": [
                {
                    "path": "",
                    "message": str(exc),
                }
            ],
        }

    method_block: Optional[Dict[str, Any]] = None
    method_key: Optional[str] = None
    channel_schema: Optional[Dict[str, Any]] = None
    channel_key: Optional[str] = None

    if "payout_methods" in schema:
        method_key, method_block = _select_method(schema, method)
        if method_block is None:
            available = sorted(schema.get("payout_methods", {}).keys())
            return {
                "valid": False,
                "errors": [
                    {
                        "path": "",
                        "message": f"No payout methods available for {currency}/{country}. Found: {available}",
                    }
                ],
            }

        channel_key, channel_schema = _select_channel(method_block, channel)
        if channel_schema is None:
            available_channels = sorted((method_block.get("channels") or {}).keys())
            requested_channel = channel or method_block.get("default_channel") or ""
            return {
                "valid": False,
                "errors": [
                    {
                        "path": "",
                        "message": (
                            f"Channel '{requested_channel}' not available for method '{method_key}'. "
                            f"Choices: {available_channels}"
                        ),
                    }
                ],
            }
        target_schema = channel_schema
    else:
        target_schema = schema

    properties: Dict[str, Any] = {}
    if isinstance(target_schema, dict):
        properties = target_schema.get("properties") or {}

    validator = Draft202012Validator(target_schema)
    errors: List[Dict[str, Any]] = []
    for error in validator.iter_errors(payload):
        path = ".".join(str(segment) for segment in error.absolute_path)
        detail: Dict[str, Any] = {
            "path": path,
            "message": error.message,
            "validator": error.validator,
        }
        if error.validator == "required":
            if isinstance(error.message, str):
                parts = re.findall(r"'([^']+)'", error.message)
                if parts:
                    missing = parts[0]
                    detail["field"] = missing
                    prop_meta = properties.get(missing, {}) if isinstance(properties, dict) else {}
                    if isinstance(prop_meta, dict):
                        description = prop_meta.get("description")
                        if description:
                            detail["schema_description"] = description
                        pattern = prop_meta.get("pattern")
                        if pattern:
                            detail["schema_pattern"] = pattern
        elif error.validator == "pattern":
            schema_fragment = error.schema if isinstance(error.schema, dict) else {}
            pattern = schema_fragment.get("pattern") if isinstance(schema_fragment, dict) else None
            description = schema_fragment.get("description") if isinstance(schema_fragment, dict) else None
            if pattern:
                detail["schema_pattern"] = pattern
            if description:
                detail["schema_description"] = description
        errors.append(detail)

    response: Dict[str, Any] = {
        "valid": len(errors) == 0,
        "errors": errors,
    }
    if method_key:
        response["method"] = method_key
    if channel_key:
        response["channel"] = channel_key
    return response


__all__ = [
    "load_schema",
    "validate_payload",
    "SchemaNotFoundError",
]
