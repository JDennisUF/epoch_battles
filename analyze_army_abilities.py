#!/usr/bin/env python3
"""
Analyze army JSON roster files and produce a Markdown report listing each army
and (1) the number of units (piece types) that possess at least one ability,
plus (2) a per-army breakdown of how many unit types have each specific ability.

Usage:
  python3 analyze_army_abilities.py [--armies-dir PATH] [--output FILE]

Defaults:
  --armies-dir client/public/data/armies
  --output     army_ability_counts.md

The script supports two schema styles for the roster:
  1. pieces: { id: { ... }, ... }  (object map)
  2. pieces: [ { id: ..., ... }, ... ] (array)

Only counts a piece entry once regardless of its "count" field; we are measuring
how many distinct unit types have abilities.
"""
import os
import json
import argparse
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional


def load_army_files(base_dir: str) -> List[str]:
    paths: List[str] = []
    if not os.path.isdir(base_dir):
        raise FileNotFoundError(f"Armies directory not found: {base_dir}")
    for entry in os.listdir(base_dir):
        full = os.path.join(base_dir, entry)
        if entry.endswith('.json') and os.path.isfile(full):
            # top-level default.json style
            paths.append(full)
        elif os.path.isdir(full):
            candidate = os.path.join(full, f"{entry}.json")
            if os.path.isfile(candidate):
                paths.append(candidate)
    return sorted(paths)


def extract_pieces(army_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    pieces_raw = army_data.get('pieces') or army_data.get('units') or []
    if isinstance(pieces_raw, dict):
        return list(pieces_raw.values())
    if isinstance(pieces_raw, list):
        return [p for p in pieces_raw if isinstance(p, dict)]
    return []


def summarize_abilities(pieces: List[Dict[str, Any]]) -> Tuple[int, Dict[str, int]]:
    """Return (count_units_with_any_ability, ability_occurrence_map).

    ability_occurrence_map counts how many distinct unit types include each ability id.
    For object abilities (e.g. {"id": "mobile", "spaces": 9}) the 'id' field is used.
    Unknown structures fall back to '?' key.
    """
    units_with_any = 0
    ability_counts: Dict[str, int] = {}
    for piece in pieces:
        abilities = piece.get('abilities') or []
        if not isinstance(abilities, list) or len(abilities) == 0:
            continue
        units_with_any += 1
        # Use a set per piece so that if (improbably) duplicate ability entries exist we only count once per unit type.
        seen_this_piece = set()
        for ab in abilities:
            if isinstance(ab, str):
                ab_id = ab
            elif isinstance(ab, dict):
                ab_id = ab.get('id', '?')
            else:
                ab_id = '?'
            if ab_id not in seen_this_piece:
                seen_this_piece.add(ab_id)
                ability_counts[ab_id] = ability_counts.get(ab_id, 0) + 1
    return units_with_any, ability_counts


def analyze_armies(base_dir: str):
    results = []  # list of dicts
    for path in load_army_files(base_dir):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"WARN: Skipping {path}: {e}")
            continue
        army_name = data.get('name') or data.get('id') or os.path.splitext(os.path.basename(path))[0]
        pieces = extract_pieces(data)
        units_with_any, ability_counts = summarize_abilities(pieces)
        results.append({
            'army_name': army_name,
            'units_with_any': units_with_any,
            'ability_counts': ability_counts
        })
    return results


def write_markdown(results, output_path: str):
    # Determine width for main table
    name_width = max((len(r['army_name']) for r in results), default=4)
    header_name = "Army"
    header_count = "Units With Abilities"
    name_width = max(name_width, len(header_name))
    count_width = max(len(header_count), 5)

    lines = []
    lines.append(f"# Army Ability Counts\n")
    lines.append(f"Generated: {datetime.utcnow().isoformat()}Z\n")
    lines.append("Counts reflect distinct unit types that declare a non-empty abilities array.\n")
    lines.append("| {hn:<{nw}} | {hc:<{cw}} |".format(hn=header_name, nw=name_width, hc=header_count, cw=count_width))
    lines.append("| {dash1} | {dash2} |".format(dash1='-'*name_width, dash2='-'*count_width))
    for r in results:
        lines.append("| {n:<{nw}} | {c:<{cw}} |".format(n=r['army_name'], nw=name_width, c=r['units_with_any'], cw=count_width))

    total_units = sum(r['units_with_any'] for r in results)
    lines.append("\nTotal units-with-abilities across armies: {}".format(total_units))

    # Detailed per-army ability breakdowns
    lines.append("\n## Ability Breakdown by Army\n")
    for r in results:
        lines.append(f"### {r['army_name']}")
        ability_counts = r['ability_counts']
        if not ability_counts:
            lines.append("(No abilities)\n")
            continue
        # Determine width
        ability_col_width = max((len(a) for a in ability_counts.keys()), default=7)
        count_col_header = "Unit Types"
        ability_header = "Ability"
        ability_col_width = max(ability_col_width, len(ability_header))
        count_col_width = max(len(count_col_header), 5)
        lines.append(f"| {ability_header:<{ability_col_width}} | {count_col_header:<{count_col_width}} |")
        lines.append(f"| {'-'*ability_col_width} | {'-'*count_col_width} |")
        for ability_id, cnt in sorted(ability_counts.items(), key=lambda kv: (-kv[1], kv[0])):
            lines.append(f"| {ability_id:<{ability_col_width}} | {cnt:<{count_col_width}} |")
        lines.append("")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Wrote {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate a Markdown table of army ability counts.")
    parser.add_argument('--armies-dir', default='client/public/data/armies', help='Path to armies directory (default: client/public/data/armies)')
    parser.add_argument('--output', default='army_ability_counts.md', help='Markdown output file (default: army_ability_counts.md)')
    args = parser.parse_args()

    results = analyze_armies(args.armies_dir)
    write_markdown(results, args.output)


if __name__ == '__main__':
    main()
