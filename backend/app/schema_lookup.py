"""Helpers to answer schema-driven questions (e.g. proxy validations)."""

from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from . import settings, validator

TOKEN_RE = re.compile(r"[A-Za-z0-9]+")
CURRENCY_RE = re.compile(r"\b[A-Z]{3}\b")
CURRENCY_SEQ_RE = re.compile(r"\b[A-Z]{3}\b")
OPTION_STOPWORDS = {
    "REGEX",
    "SHOULD",
    "BE",
    "ONLY",
    "THESE",
    "SPECIAL",
    "CHARACTERS",
    "LENGTH",
    "MORE",
    "THAN",
    "LESS",
    "MINIMUM",
    "MAXIMUM",
    "DECIMAL",
    "DECIMALS",
    "ALPHANUMERIC",
    "REQUIRED",
    "MANDATORY",
    "OPTIONAL",
    "CONDITIONAL",
    "CONDITIONALLY",
    "HIGHLIGHTED",
    "STATUS",
    "PROXY",
    "VALUE",
    "VALUES",
    "CODE",
    "TABLE",
    "BELOW",
    "KINDLY",
    "REFER",
    "SHALL",
    "MUST",
    "TYPE",
    "TYPES",
    "INCLUDING",
    "NUMBER",
    "NUMBERS",
    "VALID",
}

REGEX_HINTS = {
    "regex",
    "regular",
    "expression",
    "pattern",
    "format",
}

VALIDATE_HINTS = {
    "validate",
    "validation",
    "validator",
    "validators",
    "check",
    "verify",
    "ensure",
}

DIFF_HINTS = {
    "differ",
    "difference",
    "differs",
    "different",
    "compare",
    "comparison",
    "versus",
    "vs",
}

LOW_SIGNAL_TOKENS = {
    "code",
    "codes",
    "number",
    "numbers",
    "value",
    "values",
    "field",
    "fields",
    "country",
    "currency",
    "account",
    "routing",
    "type",
    "types",
}

STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "should",
    "not",
    "more",
    "than",
    "only",
    "if",
    "in",
    "required",
    "can",
    "must",
    "length",
    "digits",
    "characters",
    "note",
    "into",
    "that",
    "this",
    "those",
    "these",
    "highlighted",
    "status",
    "conditionally",
    "mandatory",
    "require",
    "requires",
    "should",
    "shall",
    "is",
    "be",
    "one",
    "of",
    "start",
    "case",
    "methods",
    "channels",
    "properties",
    "payout",
    "default",
    "bank",
    "local",
    "wire",
    "wallet",
    "provider",
    "contact",
    "number",
    "insensitive",
    "special",
    "contain",
    "value",
    "values",
    "routing",
    "code",
}

PREFERRED_COUNTRIES: Dict[str, List[str]] = {
    "USD": ["UNITED STATES", "USA", "US"],
    "EUR": ["GERMANY", "EUROPE", "DE"],
    "GBP": ["UNITED KINGDOM", "UK", "GB"],
    "INR": ["INDIA"],
    "SGD": ["SINGAPORE"],
}

PAYOUT_HINTS = {
    "payout",
    "payouts",
    "transfer",
    "remit",
    "remittance",
    "payment",
    "payments",
    "disbursement",
    "sender",
    "beneficiary",
    "proxy",
}
PAYIN_HINTS = {
    "payin",
    "payins",
    "deposit",
    "fund",
    "topup",
    "top-up",
    "incoming",
    "credit",
    "wallet",
    "receive",
}

CREATE_PAYOUT_HINTS = {
    "create payout",
    "create a payout",
    "submit payout",
    "payout api",
    "curl payout",
    "call the payout api",
}


def _should_inline_beneficiary(normalized: str) -> bool:
    return (
        "inline" in normalized
        or "beneficiary object" in normalized
        or ("without" in normalized and "beneficiary id" in normalized)
        or ("beneficiary" in normalized and "full" in normalized and "details" in normalized)
    )

def _looks_like_beneficiary_query(query: str) -> bool:
    normalized = query.lower()
    return "beneficiary" in normalized or "payout" in normalized or "remittance" in normalized


@dataclass(frozen=True)
class Corridor:
    currency: str
    country: str
    path: Path

    @property
    def schema(self) -> Dict[str, Any]:  # type: ignore[override]
        with self.path.open("r", encoding="utf-8") as handle:
            return json.load(handle)


@lru_cache(maxsize=1)
def _corridor_index() -> Dict[str, List[Corridor]]:
    index: Dict[str, List[Corridor]] = {}
    for path in settings.SCHEMA_DIR.glob("schema_*.json"):
        name = path.stem  # schema_USD_UNITED STATES
        try:
            _, currency, country = name.split("_", 2)
        except ValueError:
            continue
        corridor = Corridor(currency=currency.upper(), country=country.upper(), path=path)
        index.setdefault(currency.upper(), []).append(corridor)
    return index


def _ordered_currency_codes(query: str) -> List[str]:
    return [match.group().upper() for match in CURRENCY_SEQ_RE.finditer(query.upper())]


def _match_countries(query: str) -> Iterable[Corridor]:
    normalized = query.lower()
    tokens = _tokenize(normalized)
    condensed = normalized.replace(" ", "")
    for corridors in _corridor_index().values():
        for corridor in corridors:
            aliases = _corridor_aliases(corridor)
            if any(alias in condensed for alias in aliases):
                yield corridor
                continue
            if aliases & tokens:
                yield corridor


def _resolve_corridors(query: str) -> List[Corridor]:
    index = _corridor_index()
    normalized = query.lower()
    tokens = _tokenize(normalized)
    condensed = normalized.replace(" ", "")
    currencies = {code.upper() for code in CURRENCY_RE.findall(query.upper())}

    candidates: List[Tuple[int, Corridor]] = []

    def score_corridor(corridor: Corridor) -> int:
        score = 0
        aliases = _corridor_aliases(corridor)
        country_lower = corridor.country.lower()
        if country_lower in normalized:
            score += 6
        if aliases & tokens:
            score += 5
        if any(alias in condensed for alias in aliases):
            score += 4
        # check for pattern "to <alias>"
        for alias in aliases:
            if f"to {alias}" in normalized:
                score += 6
        return score

    for currency, corridors in index.items():
        if currency in currencies:
            for corridor in corridors:
                candidates.append((score_corridor(corridor), corridor))

    if not candidates:
        for corridor in _match_countries(query):
            # Give higher score to exact country name matches
            country_score = 6
            country_lower = corridor.country.lower()
            if country_lower in normalized:
                country_score += 10  # Boost exact country matches
            candidates.append((country_score, corridor))

    candidates.sort(key=lambda item: item[0], reverse=True)
    return [corridor for score, corridor in candidates if score >= 0]


def _select_comparison_corridors(query: str, count: int = 2) -> List[Corridor]:
    resolved = _resolve_corridors(query)
    if not resolved:
        return []

    selected: List[Corridor] = []
    seen: set[Corridor] = set()
    for code in _ordered_currency_codes(query):
        prefs = PREFERRED_COUNTRIES.get(code, [])
        candidates = [cand for cand in resolved if cand.currency == code and cand not in seen]
        if not candidates:
            continue
        if prefs:
            def priority(corridor: Corridor) -> Tuple[int, str]:
                country_upper = corridor.country.upper()
                for idx, name in enumerate(prefs):
                    if name in country_upper or country_upper in name:
                        return idx, country_upper
                return len(prefs), country_upper
            candidates.sort(key=priority)
        selected.append(candidates[0])
        seen.add(candidates[0])
        if len(selected) >= count:
            return selected[:count]

    for corridor in resolved:
        if corridor in seen:
            continue
        selected.append(corridor)
        seen.add(corridor)
        if len(selected) >= count:
            break
    return selected[:count]


def _coerce_json_like(snippet: str) -> Optional[Dict[str, Any]]:
    snippet = snippet.strip()
    if not snippet:
        return None

    attempts = [snippet]

    def normalize(text: str) -> str:
        updated = text
        updated = updated.replace("'", '"')
        updated = re.sub(r'([,{]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', updated)

        def value_replacer(match: re.Match[str]) -> str:
            value = match.group(1)
            if value.startswith('"') or value.startswith('{') or value.startswith('['):
                return f': {value}'
            if re.fullmatch(r'-?\d+(?:\.\d+)?', value):
                return f': {value}'
            lower = value.lower()
            if lower in {"true", "false", "null"}:
                return f': {lower}'
            return ': "{}"'.format(value)

        updated = re.sub(r':\s*([^",{}\[\]\s]+)(?=\s*(?:[,}]))', value_replacer, updated)
        return updated

    attempts.append(normalize(snippet))

    for candidate in attempts:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            try:
                return ast.literal_eval(candidate)
            except (SyntaxError, ValueError):
                continue
    return None


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z]+", text))


def _corridor_aliases(corridor: Corridor) -> set[str]:
    words = [w for w in re.split(r"\W+", corridor.country.lower()) if w]
    aliases = set(words)
    if words:
        aliases.add("".join(words))
        aliases.add("-".join(words))
        aliases.add(" ".join(words))
        aliases.add(words[-1])
        acronym = "".join(word[0] for word in words if word)
        if acronym:
            aliases.add(acronym)
        if len(words) > 1:
            aliases.add(words[0])
    return aliases


def _proxy_types_from_schema(corridor: Corridor) -> List[Tuple[str, List[str]]]:
    schema = corridor.schema
    methods = schema.get("payout_methods") or {}
    proxy_block = methods.get("proxy")
    if not proxy_block:
        return []
    results: List[Tuple[str, List[str]]] = []
    channels = proxy_block.get("channels") or {}
    for channel_name, channel_schema in channels.items():
        properties = channel_schema.get("properties") or {}
        proxy_type = properties.get("proxy_type") or {}
        enum = proxy_type.get("enum")
        options: List[str] = []
        if enum:
            options = [str(item) for item in enum]
        else:
            pattern = proxy_type.get("pattern", "")
            description = proxy_type.get("description", "")
            candidates = _extract_options(pattern, description)
            if candidates:
                options = candidates
        if not options:
            continue
        results.append((channel_name, options))
    return results


def _extract_options(*texts: str) -> List[str]:
    seen = set()
    options: List[str] = []
    for text in texts:
        if not text:
            continue
        for token in TOKEN_RE.findall(text.upper()):
            if len(token) <= 1:
                continue
            if token.isdigit():
                continue
            if token in OPTION_STOPWORDS:
                continue
            if token not in seen:
                seen.add(token)
                options.append(token)
    return options


def _iter_pattern_fields(node: Any, path: Optional[List[str]] = None) -> Iterable[Tuple[List[str], Dict[str, Any]]]:
    if path is None:
        path = []
    if isinstance(node, dict):
        if "pattern" in node and isinstance(node["pattern"], str):
            yield path, node
        for key, child in node.items():
            if key == "pattern":
                continue
            next_path = path + [key]
            if isinstance(child, (dict, list)):
                yield from _iter_pattern_fields(child, next_path)
    elif isinstance(node, list):
        for index, item in enumerate(node):
            yield from _iter_pattern_fields(item, path + [str(index)])


def _normalize_tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def answer_proxy_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if "proxy" not in normalized:
        return None

    if any(hint in normalized for hint in PAYIN_HINTS) and not any(
        hint in normalized for hint in PAYOUT_HINTS
    ):
        return None

    corridors = _resolve_corridors(query)
    
    # Filter to specific country if mentioned explicitly
    country_mentioned = False
    specific_corridors = []
    tokens = _tokenize(normalized)
    
    for corridor in corridors:
        aliases = _corridor_aliases(corridor)
        country_lower = corridor.country.lower()
        
        # Check if this specific country is mentioned in the query
        if (country_lower in normalized or 
            aliases & tokens or 
            any(alias in normalized for alias in aliases)):
            
            # Give priority to exact country name matches
            if country_lower in normalized:
                specific_corridors.insert(0, corridor)  # Put exact matches first
                country_mentioned = True
            else:
                specific_corridors.append(corridor)
                country_mentioned = True
    
    # If a specific country was mentioned, only return results for that country
    # Otherwise, return all matching corridors (existing behavior)
    target_corridors = specific_corridors[:1] if country_mentioned and specific_corridors else corridors
    
    results: List[str] = []
    citations: List[Dict[str, str]] = []
    seen = set()

    for corridor in target_corridors:
        entries = _proxy_types_from_schema(corridor)
        if not entries:
            continue
        for channel_name, enum_values in entries:
            key = (corridor.currency, corridor.country, channel_name)
            if key in seen:
                continue
            seen.add(key)
            values = ", ".join(enum_values)
            results.append(
                f"{corridor.currency}/{corridor.country} ({channel_name}): {values or 'Not specified'}"
            )
            citations.append(
                {
                    "title": f"schema_{corridor.currency}_{corridor.country}.json",
                    "url": f"schema_{corridor.currency}_{corridor.country}.json",
                    "snippet": values,
                }
            )

    if not results:
        return None

    # Update the header message based on whether it's country-specific
    if country_mentioned and len(target_corridors) == 1:
        corridor = target_corridors[0]
        answer_lines = [f"Here are the proxy types supported for {corridor.country}:"]
    else:
        answer_lines = ["Here are the proxy types supported for the matching corridors:"]
    
    answer_lines.extend(results)
    answer = "\n".join(answer_lines)
    return {"answer": answer, "citations": citations[:3]}


def answer_payout_methods_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if "payout" not in normalized or "method" not in normalized:
        return None

    if any(hint in normalized for hint in PAYIN_HINTS) and not any(
        hint in normalized for hint in PAYOUT_HINTS
    ):
        return None

    corridors = _resolve_corridors(query)
    results: List[str] = []
    citations: List[Dict[str, str]] = []
    seen: set[Tuple[str, str]] = set()

    for corridor in corridors:
        methods = corridor.schema.get("payout_methods") or {}
        if not methods:
            continue
        entries: List[str] = []
        for method_name, payload in methods.items():
            channels = (payload or {}).get("channels") or {}
            if channels:
                channel_list = ", ".join(sorted(channels.keys()))
                entries.append(f"{method_name} ({channel_list})")
            else:
                entries.append(method_name)
        if not entries:
            continue
        key = (corridor.currency, corridor.country)
        if key in seen:
            continue
        seen.add(key)
        method_list = ", ".join(entries)
        results.append(f"{corridor.currency}/{corridor.country}: {method_list}")
        citations.append(
            {
                "title": f"schema_{corridor.currency}_{corridor.country}.json",
                "url": f"schema_{corridor.currency}_{corridor.country}.json",
                "snippet": method_list,
            }
        )

    if not results:
        return None

    answer_lines = ["Available payout methods:"]
    answer_lines.extend(results)
    answer = "\n".join(answer_lines)
    return {"answer": answer, "citations": citations[:3]}


def answer_remittance_template_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if "remittance" not in normalized and "payout" not in normalized:
        return None

    if any(hint in normalized for hint in PAYIN_HINTS) and not any(
        hint in normalized for hint in PAYOUT_HINTS
    ):
        return None

    corridors = _resolve_corridors(query)
    if not corridors:
        return None

    method_pref = _detect_method(normalized)
    channel_pref = _detect_channel(normalized)
    inline_beneficiary = True

    for corridor in corridors:
        methods = corridor.schema.get("payout_methods") or {}
        if not methods:
            continue
        method_name, method_block = _select_method(methods, method_pref)
        if method_block is None:
            continue
        channel_name, channel_schema = _select_channel(method_block, channel_pref)
        if channel_schema is None:
            continue

        template = _build_remittance_template(
            corridor,
            method_name,
            channel_name,
            channel_schema,
            inline_beneficiary,
        )
        citation = {
            "title": f"schema_{corridor.currency}_{corridor.country}.json",
            "url": f"schema_{corridor.currency}_{corridor.country}.json",
            "snippet": json.dumps(template["payout"]["details"], separators=(",", ":"))[:200],
        }
        inline_note = " (inline beneficiary)" if inline_beneficiary else ""
        answer = (
            f"Use the following remittance object for {corridor.currency}/{corridor.country}"
            f" {method_name} ({channel_name}) payouts{inline_note}. Update placeholder values before calling the remittance API.\n"
            f"```json\n{json.dumps(template, indent=2)}\n```"
        )
        return {"answer": answer, "citations": [citation]}
    return None


def answer_required_fields_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if not ("mandatory" in normalized or "required" in normalized):
        return None

    corridors = _resolve_corridors(query)
    if not corridors:
        return None

    method_pref = _detect_method(normalized)
    channel_pref = _detect_channel(normalized)

    for corridor in corridors:
        methods = corridor.schema.get("payout_methods") or {}
        if not methods:
            continue
        method_name, method_block = _select_method(methods, method_pref)
        if method_block is None:
            continue
        channel_name, channel_schema = _select_channel(method_block, channel_pref)
        if channel_schema is None:
            continue
        required_fields = channel_schema.get("required") or []
        if not required_fields:
            continue
        props = channel_schema.get("properties") or {}
        field_details: List[Tuple[str, str]] = []
        for field in required_fields:
            meta = props.get(field, {}) or {}
            desc = meta.get("description", "Required field").strip()
            # Clean up description to focus on key requirements
            if "should be" in desc.lower():
                desc = desc.split(".")[0] + "."
            field_details.append((field, desc))

        if not field_details:
            continue

        field_map = {field: desc for field, desc in field_details}

        # Create a focused response for mandatory fields only
        summary_parts: List[str] = []
        summary_parts.append(f"For {corridor.currency}/{corridor.country} payouts using `{method_name}` method (`{channel_name}` channel), the following fields are **mandatory**:")
        # List mandatory fields clearly
        field_list = []
        for field, desc in field_details:
            # Enhance descriptions for key banking fields
            enhanced_desc = desc
            if field == "routingCodeType1":
                if "SWIFT" in desc:
                    enhanced_desc = f"{desc} (Bank code identifier)"
                elif "IFSC" in desc:
                    enhanced_desc = f"{desc} (Bank IFSC code)"
                else:
                    enhanced_desc = f"{desc} (Routing/Bank code type)"
            elif field == "routingCodeValue1":
                if "SWIFT" in desc:
                    enhanced_desc = f"{desc} (Bank SWIFT/BIC code)"
                elif "IFSC" in desc:
                    enhanced_desc = f"{desc} (Bank IFSC code)"
                else:
                    enhanced_desc = f"{desc} (Bank routing code)"
            
            field_list.append(f"• `{field}` - {enhanced_desc}")
        
        summary_parts.extend(field_list)
        
        # Generate Transfer Money API format example
        import json
        
        # Build the official Transfer Money API request structure
        transfer_request = {
            "beneficiaryDetail": {},
            "payoutDetail": {
                "payout_method": method_name.upper(),
                "destination_currency": corridor.currency
            },
            "payout": {
                "source_currency": "USD",  # Example source
                "destination_amount": 1000.00,
                "source_amount": 1000.00,
                "audit_id": "[GET_FROM_FX_QUOTE]",
                "serviceTime": "2024-01-15"
            },
            "deviceDetails": {
                "countryIP": "45.48.241.198",
                "deviceInfo": "Browser",
                "ipAddress": "45.48.241.198",
                "sessionId": "[GENERATE_SESSION_ID]"
            },
            "purposeCode": "[REQUIRED]",
            "sourceOfFunds": "Business Operations",
            "customerComments": "Transfer payment"
        }
        
        # Map schema fields to proper API structure
        for field in required_fields:
            meta = props.get(field, {})
            
            # Beneficiary fields
            if "beneficiary" in field.lower():
                if "name" in field.lower():
                    transfer_request["beneficiaryDetail"]["name"] = "[REQUIRED]"
                elif "country" in field.lower():
                    country_code = corridor.country[:2] if len(corridor.country) >= 2 else "SG"
                    transfer_request["beneficiaryDetail"]["country_code"] = country_code
                elif "account" in field.lower() and "type" in field.lower():
                    transfer_request["beneficiaryDetail"]["account_type"] = "Individual"
                elif "account" in field.lower() and "number" in field.lower():
                    transfer_request["payoutDetail"]["account_number"] = "[REQUIRED]"
                elif "address" in field.lower():
                    transfer_request["beneficiaryDetail"]["address"] = "[REQUIRED]"
                elif "city" in field.lower():
                    transfer_request["beneficiaryDetail"]["city"] = "[REQUIRED]"
                elif "postcode" in field.lower():
                    transfer_request["beneficiaryDetail"]["postcode"] = "[REQUIRED]"
            
            # Remitter fields - add to top level
            elif "remitter" in field.lower():
                if "name" in field.lower():
                    transfer_request["remitterName"] = "[REQUIRED]"
                elif "country" in field.lower():
                    country_code = corridor.country[:2] if len(corridor.country) >= 2 else "SG" 
                    transfer_request["remitterCountryCode"] = country_code
                elif "account" in field.lower() and "type" in field.lower():
                    transfer_request["remitterAccountType"] = "Company"
                elif "address" in field.lower():
                    transfer_request["remitterAddress"] = "[REQUIRED]"
                elif "identification" in field.lower():
                    if "type" in field.lower():
                        transfer_request["remitterIdType"] = "[REQUIRED]"
                    elif "number" in field.lower():
                        transfer_request["remitterIdNumber"] = "[REQUIRED]"
            
            # Routing codes
            elif "routing" in field.lower():
                if "type" in field.lower():
                    transfer_request["payoutDetail"]["routing_code_type_1"] = "SWIFT"
                elif "value" in field.lower():
                    transfer_request["payoutDetail"]["routing_code_value_1"] = "[REQUIRED]"
            
            # Proxy fields
            elif "proxy" in field.lower():
                if "type" in field.lower():
                    proxy_types = _proxy_types_from_schema(corridor)
                    proxy_type = proxy_types[0][1][0] if proxy_types and proxy_types[0][1] else "MOBILE"
                    transfer_request["payoutDetail"]["proxy_type"] = proxy_type
                elif "value" in field.lower():
                    transfer_request["payoutDetail"]["proxy_value"] = "[REQUIRED]"
            
            # Transaction fields
            elif "transaction" in field.lower() and "number" in field.lower():
                transfer_request["externalId"] = "[REQUIRED]"
            elif "purpose" in field.lower() and "code" in field.lower():
                transfer_request["purposeCode"] = "[REQUIRED]"
            elif "destination" in field.lower():
                if "currency" in field.lower():
                    transfer_request["payoutDetail"]["destination_currency"] = corridor.currency
                elif "amount" in field.lower():
                    transfer_request["payout"]["destination_amount"] = 1000.00
        
        # Clean up empty sections
        if not transfer_request["beneficiaryDetail"]:
            del transfer_request["beneficiaryDetail"]
        
        example_json = json.dumps(transfer_request, indent=2)
        
        summary_parts.append("\n**Transfer Money API Request Format:**")
        summary_parts.append(f"```json\nPOST /api/v1/client/{{clientHashId}}/customer/{{customerHashId}}/wallet/{{walletHashId}}/remittance\n\n{example_json}\n```")
        summary_parts.append("\n**Prerequisites:**")
        summary_parts.append("1. Get FX quote first: `GET /lockExchangeRate` to obtain `audit_id`")
        summary_parts.append("2. Ensure customer and wallet are created and active")
        summary_parts.append("3. Validate purpose code for the corridor")
        
        answer = "\n".join(summary_parts)
        citations = [
            {
                "title": f"schema_{corridor.currency}_{corridor.country}.json",
                "url": f"schema_{corridor.currency}_{corridor.country}.json",
                "snippet": ", ".join(required_fields)[:200],
            },
            {
                "title": "Create Payout API",
                "url": "https://docs.nium.com/api#create-payout",
                "snippet": "Request body fields",
            },
        ]
        return {"answer": answer, "citations": citations}
    return None


def _collect_required_fields(
    corridor: Corridor,
    method_pref: Optional[str],
    channel_pref: Optional[str],
) -> Tuple[str, str, Dict[str, str]]:
    methods = corridor.schema.get("payout_methods") or {}
    if not methods:
        return "", "", {}
    method_name, method_block = _select_method(methods, method_pref)
    if method_block is None:
        return "", "", {}
    channel_name, channel_schema = _select_channel(method_block, channel_pref)
    if channel_schema is None:
        return method_name, channel_name, {}
    required_fields = channel_schema.get("required") or []
    properties = channel_schema.get("properties") or {}
    result: Dict[str, str] = {}
    for field in required_fields:
        meta = properties.get(field, {}) or {}
        description = meta.get("description") or ""
        result[field] = description.strip()
    return method_name, channel_name, result


def answer_mandatory_difference_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if not any(hint in normalized for hint in DIFF_HINTS):
        return None

    corridors = _select_comparison_corridors(query, count=2)
    if len(corridors) < 2:
        return None

    method_pref = _detect_method(normalized)
    channel_pref = _detect_channel(normalized)

    first, second = corridors[0], corridors[1]
    method_a, channel_a, fields_a = _collect_required_fields(first, method_pref, channel_pref)
    method_b, channel_b, fields_b = _collect_required_fields(second, method_pref, channel_pref)

    if not fields_a or not fields_b:
        return None

    only_a = [field for field in fields_a.keys() if field not in fields_b]
    only_b = [field for field in fields_b.keys() if field not in fields_a]
    common_diffs: List[Tuple[str, str, str]] = []
    def diff_priority(field: str) -> int:
        lower = field.lower()
        if "routing" in lower:
            return 0
        if "iban" in lower:
            return 1
        if "account" in lower:
            return 2
        if "remitter" in lower:
            return 3
        return 4

    for field in sorted(fields_a.keys() & fields_b.keys(), key=diff_priority):
        desc_a = fields_a.get(field, "")
        desc_b = fields_b.get(field, "")
        if desc_a != desc_b:
            common_diffs.append((field, desc_a, desc_b))

    def summarize_differences() -> str:
        summary_parts: List[str] = []
        def field_summary(field: str, desc: str, currency: str, country: str) -> Optional[str]:
            desc_lower = desc.lower()
            field_lower = field.lower()
            if "routing" in field_lower:
                if "ifsc" in desc_lower:
                    return f"{currency}/{country} requires IFSC routing (type/value)."
                if "swift" in desc_lower or "bic" in desc_lower:
                    return f"{currency}/{country} requires SWIFT/BIC routing (type/value)."
                if "sort" in desc_lower or "bsb" in desc_lower:
                    return f"{currency}/{country} expects local sort/BSB codes."
            if "iban" in desc_lower or field_lower == "iban":
                return f"{currency}/{country} relies on IBAN account format."
            if "accountnumber" in field_lower and "iban" not in desc_lower:
                return f"{currency}/{country} needs the local account number." 
            if "remittercity" in field_lower:
                return f"{currency}/{country} mandates remitter city." 
            if "remitpurposecode" in field_lower:
                return f"{currency}/{country} requires a remit purpose code." 
            return None

        for field in only_a:
            desc = fields_a.get(field, "")
            summary = field_summary(field, desc, first.currency, first.country)
            if summary and summary not in summary_parts:
                summary_parts.append(summary)

        for field in only_b:
            desc = fields_b.get(field, "")
            summary = field_summary(field, desc, second.currency, second.country)
            if summary and summary not in summary_parts:
                summary_parts.append(summary)

        for field, desc_a, desc_b in common_diffs:
            summary = field_summary(field, desc_a, first.currency, first.country)
            if summary and summary not in summary_parts:
                summary_parts.append(summary)
            summary = field_summary(field, desc_b, second.currency, second.country)
            if summary and summary not in summary_parts:
                summary_parts.append(summary)

        if not summary_parts and any(field.lower() == "iban" for field in fields_a.keys()):
            summary_parts.append(f"{first.currency}/{first.country} relies on IBAN account format.")

        if summary_parts:
            return " ".join(summary_parts[:2])

        if common_diffs:
            field, desc_a, desc_b = common_diffs[0]
            if "swift" in desc_a.lower() and "ifsc" in desc_b.lower():
                summary_parts.append(
                    f"{first.currency}/{first.country} expects SWIFT, while {second.currency}/{second.country} uses IFSC for `{field}`."
                )
            elif "swift" in desc_b.lower() and "ifsc" in desc_a.lower():
                summary_parts.append(
                    f"{first.currency}/{first.country} uses IFSC, whereas {second.currency}/{second.country} keeps SWIFT for `{field}`."
                )
            elif "ach" in desc_b.lower() and "ifsc" in desc_a.lower():
                summary_parts.append(
                    f"{first.currency}/{first.country} requires IFSC while {second.currency}/{second.country} uses ACH routing." 
                )
            elif "ach" in desc_a.lower() and "ifsc" in desc_b.lower():
                summary_parts.append(
                    f"{first.currency}/{first.country} uses ACH routing whereas {second.currency}/{second.country} requires IFSC." 
                )
            elif "swift" in desc_a.lower() and "ach" in desc_b.lower():
                summary_parts.append(
                    f"{first.currency}/{first.country} requires SWIFT/BIC while {second.currency}/{second.country} relies on ACH routing." 
                )
            elif "swift" in desc_b.lower() and "ach" in desc_a.lower():
                summary_parts.append(
                    f"{first.currency}/{first.country} uses ACH routing whereas {second.currency}/{second.country} requires SWIFT/BIC." 
                )

        if only_a:
            summary_parts.append(
                f"{first.currency}/{first.country} adds `{only_a[0]}` to the mandatory list."
            )
        if only_b:
            summary_parts.append(
                f"{second.currency}/{second.country} adds `{only_b[0]}` to the mandatory list."
            )

        if not summary_parts:
            summary_parts.append("No differences in mandatory fields were found between these corridors.")
        return " ".join(summary_parts)

    summary = summarize_differences()
    summary_lines = [summary]
    if channel_a and channel_b and channel_a.lower() == channel_b.lower() == "local":
        summary_lines.append(
            "Core remitter and beneficiary fields remain aligned; see below for corridor-specific bank details." 
        )

    lines: List[str] = summary_lines
    if only_a:
        lines.append("• Required only for {}/{}:".format(first.currency, first.country))
        for field in sorted(only_a):
            desc = fields_a.get(field, "")
            detail = f" — {desc}" if desc else ""
            lines.append(f"  - `{field}`{detail}")
    if only_b:
        lines.append("• Required only for {}/{}:".format(second.currency, second.country))
        for field in sorted(only_b):
            desc = fields_b.get(field, "")
            detail = f" — {desc}" if desc else ""
            lines.append(f"  - `{field}`{detail}")
    if common_diffs:
        lines.append("• Fields present in both but with different requirements:")
        for field, desc_a, desc_b in common_diffs:
            lines.append(
                f"  - `{field}` — {first.currency}/{first.country}: {desc_a or 'see schema'} | {second.currency}/{second.country}: {desc_b or 'see schema'}"
            )

    citations = [
        {
            "title": f"schema_{first.currency}_{first.country}.json",
            "url": f"schema_{first.currency}_{first.country}.json",
            "snippet": ", ".join(only_a)[:200],
        },
        {
            "title": f"schema_{second.currency}_{second.country}.json",
            "url": f"schema_{second.currency}_{second.country}.json",
            "snippet": ", ".join(only_b)[:200],
        },
    ]

    return {"answer": "\n".join(lines), "citations": citations}


def answer_validation_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if not any(hint in normalized for hint in VALIDATE_HINTS):
        return None

    start = query.find("{")
    end = query.rfind("}")
    snippet: Optional[str] = None
    if start != -1 and end != -1 and end > start:
        snippet = query[start : end + 1]
    else:
        paren_start = query.find("(")
        paren_end = query.rfind(")")
        if paren_start != -1 and paren_end != -1 and paren_end > paren_start:
            snippet = query[paren_start + 1 : paren_end]
        elif paren_start != -1:
            brace_end = query.rfind("}")
            if brace_end != -1 and brace_end > paren_start:
                snippet = query[paren_start + 1 : brace_end + 1]
    if not snippet:
        return None

    trimmed = snippet.strip()
    if not trimmed.startswith("{"):
        trimmed = trimmed.strip("{}[]() ")
        snippet = "{" + trimmed + "}"
    else:
        snippet = trimmed

    payload = _coerce_json_like(snippet)
    if not isinstance(payload, dict):
        return {
            "answer": "I couldn't parse the payload. Please provide a valid JSON object.",
            "citations": [],
        }

    corridors = _resolve_corridors(query)
    if not corridors:
        return None
    corridor = corridors[0]

    method_pref = _detect_method(normalized)
    channel_pref = _detect_channel(normalized)

    result = validator.validate_payload(
        payload,
        corridor.currency,
        corridor.country,
        method=method_pref,
        channel=channel_pref,
    )

    citations = [
        {
            "title": f"schema_{corridor.currency}_{corridor.country}.json",
            "url": f"schema_{corridor.currency}_{corridor.country}.json",
            "snippet": "",
        },
        {
            "title": "Create Payout API",
            "url": "https://docs.nium.com/api#create-payout",
            "snippet": "Request body fields",
        },
    ]

    method_used = result.get("method") or method_pref or "bank"
    channel_used = result.get("channel") or channel_pref or "default"

    if result.get("valid"):
        answer = (
            f"The payload is valid for {corridor.currency}/{corridor.country} "
            f"`{method_used}` (`{channel_used}`) payouts."
        )
        return {"answer": answer, "citations": citations}

    errors = result.get("errors", [])
    if not errors:
        answer = (
            f"Validation failed for {corridor.currency}/{corridor.country} "
            f"`{method_used}` (`{channel_used}`), but no details were provided."
        )
        return {"answer": answer, "citations": citations}

    lines = [
        (
            f"Not valid for {corridor.currency}/{corridor.country} "
            f"`{method_used}` (`{channel_used}`) payouts."
        ),
        "Issues:",
    ]
    for error in errors[:10]:
        field = error.get("field") or error.get("path") or "<root>"
        validator_name = error.get("validator")
        description = error.get("schema_description")
        pattern = error.get("schema_pattern")
        message = error.get("message") or "Invalid value."

        if validator_name == "required" and error.get("field"):
            detail = description if description else "Field is required."
            lines.append(f"• missing `{field}` — {detail}")
        elif validator_name == "pattern":
            detail_parts: List[str] = []
            if pattern:
                detail_parts.append(f"must match `{pattern}`")
            if description:
                detail_parts.append(description)
            detail_text = ". ".join(detail_parts) if detail_parts else message
            lines.append(f"• `{field}` — {detail_text}")
        else:
            lines.append(f"• `{field}` — {message}")
    if len(errors) > 10:
        lines.append(f"…and {len(errors) - 10} more issues.")

    return {"answer": "\n".join(lines), "citations": citations}


def answer_create_payout_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if "payout" not in normalized or "api" not in normalized:
        return None
    if not any(hint in normalized for hint in CREATE_PAYOUT_HINTS):
        return None

    curl_snippet = """```bash
curl -X POST https://api.nium.com/v1/payouts \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "US",
    "currency": "USD",
    "amount": 100.00,
    "beneficiary": {
      "name": "ACME Recipient",
      "accountNumber": "1234567890",
      "routingCode": { "type": "ACH", "value": "021000021" }
    },
    "remitter": {
      "name": "ACME Sender",
      "accountNumber": "0987654321"
    }
  }'
```"""

    lines = [
        "POST `https://api.nium.com/v1/payouts` with `Authorization: Bearer <token>` and `Content-Type: application/json`.",
        "Minimal example:",
        curl_snippet,
    ]

    citations = [
        {
            "title": "API Reference – Create Payout",
            "url": "https://docs.nium.com/api#create-payout",
            "snippet": "POST /payouts",
        },
        {
            "title": "Product Guide – Getting Started / Authentication",
            "url": "https://docs.nium.com/docs/getting-started",
            "snippet": "Bearer token authentication",
        },
    ]

    return {"answer": "\n".join(lines), "citations": citations}


def answer_regex_query(query: str) -> Optional[Dict[str, Any]]:
    normalized = query.lower()
    if not any(hint in normalized for hint in REGEX_HINTS):
        return None

    corridors = _resolve_corridors(query)
    if not corridors:
        return None

    query_tokens = _normalize_tokens(query) - STOPWORDS
    matches: List[Tuple[int, int, int, Corridor, List[str], Dict[str, Any]]] = []

    for corridor in corridors:
        schema = corridor.schema
        for path, node in _iter_pattern_fields(schema):
            description = node.get("description", "")
            field_tokens = _normalize_tokens(" ".join(path) + " " + description) - STOPWORDS
            high_query = query_tokens - LOW_SIGNAL_TOKENS
            high_field = field_tokens - LOW_SIGNAL_TOKENS
            keyword_overlap = high_query & high_field
            base_overlap = len(keyword_overlap)
            low_overlap = len((query_tokens & field_tokens) - (high_query & high_field))
            if base_overlap == 0:
                continue
            token_weights = {
                "bsb": 4,
                "sort": 4,
                "ifsc": 4,
                "iban": 4,
                "swift": 3,
            }
            keyword_score = 0
            corridor_tokens = set(_normalize_tokens(corridor.country)) | {corridor.currency.lower()}
            for token in keyword_overlap:
                if token in corridor_tokens:
                    keyword_score += 1
                else:
                    keyword_score += token_weights.get(token, 2)
            overlap = base_overlap * 2 + keyword_score + min(low_overlap, 1)
            if overlap == 0:
                continue
            pattern_text = node.get("pattern", "") or ""
            complexity = 1 if any(ch in pattern_text for ch in "[]()^$\\{}+*?|.") else 0
            corridor_bonus = 0
            country_tokens = _normalize_tokens(corridor.country)
            currency_token = corridor.currency.lower()
            if country_tokens & query_tokens:
                corridor_bonus += 5
            if currency_token in query_tokens:
                corridor_bonus += 3
            score = overlap * 3 + complexity * 10 + corridor_bonus
            matches.append((score, overlap, complexity, corridor, path, node))

    if not matches:
        return None

    matches.sort(key=lambda item: (item[0], item[1], item[2]), reverse=True)
    best_corridor = matches[0][3]
    top_matches = [match for match in matches if match[3] == best_corridor]

    key_tokens = {"bsb", "sort", "ifsc", "swift", "iban"}
    filtered = []
    for match in top_matches:
        _, _, _, corridor, path, node = match
        # Check if any routing-related tokens are present
        pattern_text = node.get("pattern", "").lower()
        desc_text = node.get("description", "").lower()
        combined_text = f"{pattern_text} {desc_text}"
        if any(token in combined_text for token in key_tokens):
            filtered.append(match)
    if filtered:
        top_matches = filtered
    top_matches = top_matches[:3]

    lines: List[str] = []
    citations: List[Dict[str, str]] = []
    def is_regex(text: str) -> bool:
        return any(ch in text for ch in "^[]{}()?*+|\\d$")

    for _, _, _, corridor, path, node in top_matches:
        pattern = node.get("pattern", "")
        if not is_regex(pattern):
            continue
        if "," in pattern:
            parts = [part.strip() for part in pattern.split(",") if part.strip()]
            pattern_display = " or ".join(parts)
        else:
            pattern_display = pattern
        description = node.get("description", "")
        field_name = ".".join(path)
        detail = f" — {description}" if description else ""
        lines.append(f"{corridor.currency}/{corridor.country} → {field_name}: `{pattern_display}`{detail}")
        citations.append(
            {
                "title": f"schema_{corridor.currency}_{corridor.country}.json",
                "url": f"schema_{corridor.currency}_{corridor.country}.json",
                "snippet": pattern,
            }
        )
    answer = "\n".join(lines)
    return {"answer": answer, "citations": citations}


def _detect_method(normalized: str) -> Optional[str]:
    if "bank" in normalized:
        return "bank"
    if "proxy" in normalized:
        return "proxy"
    if "card" in normalized:
        return "card"
    if "wallet" in normalized:
        return "wallet"
    if "cash" in normalized:
        return "cash"
    return None


def _detect_channel(normalized: str) -> Optional[str]:
    if "wire" in normalized or "international" in normalized:
        return "wire"
    if "local" in normalized or "domestic" in normalized or "ach" in normalized:
        return "local"
    return None


def _select_method(methods: Dict[str, Any], preferred: Optional[str]) -> Tuple[str, Optional[Dict[str, Any]]]:
    if preferred and preferred in methods:
        return preferred, methods.get(preferred)
    if methods:
        first_key = next(iter(methods))
        return first_key, methods.get(first_key)
    return "", None


def _select_channel(method_block: Dict[str, Any], preferred: Optional[str]) -> Tuple[str, Optional[Dict[str, Any]]]:
    channels = method_block.get("channels") or {}
    if not channels:
        return method_block.get("default_channel", ""), None
    if preferred and preferred in channels:
        return preferred, channels[preferred]
    default_channel = method_block.get("default_channel")
    if default_channel and default_channel in channels:
        return default_channel, channels[default_channel]
    if "local" in channels:
        return "local", channels["local"]
    first_key = next(iter(channels))
    return first_key, channels[first_key]


def _build_remittance_template(
    corridor: Corridor,
    method_name: str,
    channel_name: str,
    channel_schema: Dict[str, Any],
    inline_beneficiary: bool,
) -> Dict[str, Any]:
    required_fields = channel_schema.get("required") or []
    properties = channel_schema.get("properties") or {}
    details: Dict[str, Any] = {}
    for field in required_fields:
        sample = _sample_value(field, corridor, properties.get(field, {}))
        details[field] = sample

    working = dict(details)

    purpose_code = working.pop("remitPurposeCode", "IR001")
    source_of_funds = working.pop("remitterSourceOfIncome", "Salary")

    beneficiary_payload: Dict[str, Any]
    if inline_beneficiary:
        beneficiary_payload = _build_inline_beneficiary(working, corridor, method_name)
    else:
        beneficiary_payload = {"id": "beneficiary_hash_id"}

    remitter_section = _build_remitter_section(working, corridor)

    template = {
        "beneficiary": beneficiary_payload,
        "payout": {
            "swiftFeeType": "OUR",
            "scheduledPayoutDate": "2024-06-30",
            "tradeOrderID": "TR012345",
            "serviceTime": "2024-06-30",
            "preScreening": False,
            "auditId": 112,
            "sourceAmount": 1000,
            "sourceCurrency": corridor.currency,
            "destinationAmount": 0,
            "method": method_name,
            "channel": channel_name,
            "details": working,
        },
        "remitter": remitter_section,
        "purposeCode": purpose_code,
        "sourceOfFunds": source_of_funds,
        "exemptionCode": "01",
    }
    if not remitter_section:
        template.pop("remitter", None)
    return template


def _build_remitter_section(details: Dict[str, Any], corridor: Corridor) -> Dict[str, Any]:
    mapping = {
        "remitterName": "name",
        "remitterBankAccountNumber": "bankAccountNumber",
        "remitterAccountType": "accountType",
        "remitterContactNumber": "contactNumber",
        "remitterDob": "dob",
        "remitterAddress": "address",
        "remitterCity": "city",
        "remitterPostcode": "postcode",
        "remitterState": "state",
        "remitterCountryCode": "countryCode",
        "remitterNationality": "nationality",
        "remitterIdentificationType": "identificationType",
        "remitterIdentificationNumber": "identificationNumber",
    }
    remitter: Dict[str, Any] = {}
    for key, target in mapping.items():
        if key in details:
            value = details.pop(key)
            if target == "accountType" and isinstance(value, str):
                value = value.upper()
            remitter[target] = value
    return remitter


def _build_inline_beneficiary(details: Dict[str, Any], corridor: Corridor, method_name: str) -> Dict[str, Any]:
    beneficiary_mapping = {
        "beneficiaryName": "name",
        "remitterBeneficiaryRelationship": "remitterBeneficiaryRelationship",
        "beneficiaryAccountType": "accountType",
    }
    beneficiary: Dict[str, Any] = {}
    for key, target in beneficiary_mapping.items():
        if key in details:
            value = details.pop(key)
            if target == "accountType" and isinstance(value, str):
                value = value.upper()
            beneficiary[target] = value

    address_fields = {
        "beneficiaryAddress": "line1",
        "beneficiaryCity": "city",
        "beneficiaryState": "state",
        "beneficiaryPostcode": "postalCode",
        "beneficiaryCountryCode": "countryCode",
    }
    address_entry: Dict[str, Any] = {"type": "BILLING"}
    address_present = False
    for key, target in address_fields.items():
        if key in details:
            address_entry[target] = details.pop(key)
            address_present = True
    if address_present:
        beneficiary["addresses"] = [address_entry]

    if "beneficiaryCountryCode" in address_entry:
        country_code = address_entry.get("countryCode", corridor.currency[:2])
    else:
        country_code = corridor.currency[:2]

    contact_number_field = None
    for key in ("beneficiaryContactNumber", "beneficiarycontactnumber"):
        if key in details:
            contact_number_field = details.pop(key)
            break
    if contact_number_field:
        beneficiary["contactNumber"] = {
            "countryCode": country_code,
            "number": contact_number_field,
        }

    id_type = details.pop("beneficiaryIdentificationType", None)
    id_value = details.pop("beneficiaryIdentificationValue", None)
    if id_type or id_value:
        beneficiary["identification"] = {
            "type": id_type or "ID",
            "value": id_value or "ID123456",
        }

    payment_account_mapping = {
        "beneficiaryBankAccountType": "accountType",
        "beneficiaryBankName": "bankName",
        "beneficiaryBankCode": "bankCode",
        "beneficiaryAccountNumber": "accountNumber",
    }
    payment_account: Dict[str, Any] = {
        "payoutMethod": method_name_to_payout(method_name),
        "payoutCurrency": details.get("destinationCurrency", corridor.currency),
    }
    for key, target in payment_account_mapping.items():
        if key in details:
            value = details.pop(key)
            if target == "accountType" and isinstance(value, str):
                value = value.upper()
            payment_account[target] = value

    routing_type = details.pop("routingCodeType1", None)
    routing_value = details.pop("routingCodeValue1", None)
    routing_type = _normalize_routing_type(routing_type, corridor)
    if routing_type or routing_value:
        payment_account["routingCode"] = [
            {
                "type": routing_type or "TYPE",
                "value": routing_value or "CODE123",
            }
        ]

    proxy_type = details.pop("proxy_type", None) or details.pop("proxyType", None)
    proxy_value = details.pop("proxy_value", None) or details.pop("proxyValue", None)
    if proxy_type:
        payment_account["proxyType"] = proxy_type
    if proxy_value:
        payment_account["proxyValue"] = proxy_value

    return {
        "beneficiary": beneficiary,
        "paymentAccount": payment_account,
    }


def method_name_to_payout(method_name: str) -> str:
    mapping = {
        "bank": "BANK_TRANSFER",
        "proxy": "PROXY",
        "card": "CARD",
        "cash": "CASH",
        "wallet": "WALLET",
    }
    return mapping.get(method_name, method_name.upper())


def _normalize_routing_type(routing_type: Optional[str], corridor: Corridor) -> Optional[str]:
    if not routing_type:
        return None
    mapping = {
        "SWIFT": "SWIFT",
        "SWIFT CODE": "SWIFT",
        "LOCATION ID OR SWIFT": "SWIFT",
        "IFSC": "IFSC",
        "SORT CODE": "SORT_CODE",
        "TRANSIT NUMBER": "TRANSIT",
        "ACH CODE": "ACH",
        "ROUTING NUMBER": "ACH",
        "BSB CODE": "BSB",
        "BRANCH CODE": "BRANCH",
    }
    upper = routing_type.upper().strip()
    return mapping.get(upper, upper)


def _sample_value(field: str, corridor: Corridor, meta: Dict[str, Any]) -> Any:
    field_lower = field.lower()
    pattern = (meta or {}).get("pattern", "")

    if "currency" in field_lower:
        return corridor.currency
    if "destinationamount" in field_lower:
        return 0
    if "amount" in field_lower:
        return 1000
    if "transaction" in field_lower:
        return f"{corridor.currency}-{field[:3].upper()}-TXN-001"
    if "remitter" in field_lower and "name" in field_lower:
        return "ACME Exporters"
    if "beneficiary" in field_lower and "name" in field_lower:
        return "ACME Recipient"
    if "account" in field_lower and "type" in field_lower:
        if "company" in pattern.lower():
            return "Company"
        if "individual" in pattern.lower():
            return "Individual"
        return "Individual"
    if "account" in field_lower:
        return "123456789012"
    if "routingcodevalue" in field_lower:
        return "CODE123"
    if "routingcodetype" in field_lower:
        if pattern:
            token = pattern.split()[0].strip("'\"")
            return token.upper()
        return "SWIFT"
    if "countrycode" in field_lower:
        return corridor.currency[:2]
    if "postcode" in field_lower or "postal" in field_lower:
        return "560001"
    if "city" in field_lower:
        return "Bengaluru"
    if "address" in field_lower:
        return "221B Baker Street"
    if "dob" in field_lower or "date" in field_lower:
        return "1985-01-15"
    if "contact" in field_lower or "phone" in field_lower:
        return "+6512345678"
    if "remitterbeneficiaryrelationship" in field_lower:
        return "Business"
    if "purpose" in field_lower:
        return "IR001"
    if "sourceoffunds" in field_lower:
        return "Salary"
    if "proxy_type" in field_lower:
        return "MOBILE"
    if "proxy_value" in field_lower:
        return "+6591234567"
    if pattern and any(char.isalpha() for char in pattern):
        example = pattern.split()[0].strip("'\"")
        if example.isalpha():
            return example
    return "value"
