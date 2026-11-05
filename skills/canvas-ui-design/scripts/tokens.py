#!/usr/bin/env python3
"""Resolve project design tokens, report declared contrast pairs, or export a Flutter theme."""
import argparse
import copy
import json
import math
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PRESETS = ('neutral', 'minimal', 'soft', 'compact')


def read_json(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('duplicate key: ' + key)
            result[key] = value
        return result
    return json.loads(Path(path).read_text(encoding='utf-8'), object_pairs_hook=unique)


def merge(base, patch, schema, path=''):
    if not isinstance(patch, dict):
        raise ValueError(f'{path or "root"}: expected object')
    result = copy.deepcopy(base)
    for key, value in patch.items():
        label = f'{path}.{key}' if path else key
        if key not in schema:
            raise ValueError(f'unknown token: {label}')
        if isinstance(schema[key], dict):
            result[key] = merge(result[key], value, schema[key], label)
        else:
            result[key] = copy.deepcopy(value)
    return result


def lookup(data, path):
    value = data
    for key in path.split('.'):
        if not isinstance(value, dict) or key not in value:
            raise ValueError(f'missing token: {path}')
        value = value[key]
    return value


def resolve_aliases(data):
    def visit(value, trail):
        if isinstance(value, dict):
            return {k: visit(v, trail + (k,)) for k, v in value.items()}
        if isinstance(value, list):
            return [visit(v, trail) for v in value]
        if isinstance(value, str) and re.fullmatch(r'\{[^{}]+\}', value):
            target = value[1:-1]
            marker = '@' + target
            if marker in trail:
                raise ValueError(f'circular reference: {target}')
            return visit(lookup(data, target), trail + (marker,))
        return value
    return visit(data, ())


def validate(data):
    schema = read_json(ROOT / 'foundation/base.json')

    def check(value, example, path):
        if isinstance(example, dict):
            if not isinstance(value, dict) or value.keys() != example.keys():
                raise ValueError(f'{path or "root"}: missing or unknown keys')
            for k in example:
                check(value[k], example[k], f'{path}.{k}' if path else k)
        elif isinstance(example, list):
            if not isinstance(value, list) or not value:
                raise ValueError(f'{path}: expected nonempty numeric list')
            for v in value:
                check(v, 0, path)
            if value != sorted(set(value)) or value[0] <= 0:
                raise ValueError(f'{path}: expected increasing positive scale')
        elif isinstance(example, (int, float)):
            if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
                raise ValueError(f'{path}: expected finite nonnegative number')
        elif not isinstance(value, str) or not value.strip():
            raise ValueError(f'{path}: expected nonempty string')

    check(data, schema, '')
    if data['version'] != 1 or data['appearance'] not in ('light', 'dark'):
        raise ValueError('expected version 1 and light/dark appearance')
    for key, color in data['colors'].items():
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', color):
            raise ValueError(f'colors.{key}: expected opaque #RRGGBB')
    for role, style in data['typography'].items():
        if role == 'fontFamily':
            if any(ord(c) < 32 for c in style):
                raise ValueError('fontFamily: control characters are not supported')
            continue
        minimum = 14 if role in ('body', 'bodySm') else 12
        if style['size'] < minimum or style['lineHeight'] < style['size']:
            raise ValueError(f'typography.{role}: size/lineHeight below usable range')
        if style['weight'] not in range(100, 1000, 100):
            raise ValueError(f'typography.{role}.weight: expected 100..900 in steps of 100')
    if data['accessibility']['minTouchTarget'] < 48:
        raise ValueError('minTouchTarget must be at least 48')
    if not 0 < data['layout']['medium'] < data['layout']['expanded']:
        raise ValueError('layout breakpoints must be positive and increasing')
    return data


def resolve(base=None, preset=None, reference=None, overrides=None, locks=()):
    schema = read_json(ROOT / 'foundation/base.json')
    initial = copy.deepcopy(schema if base is None else base)
    baseline = validate(resolve_aliases(initial))
    if preset is not None and preset not in PRESETS:
        raise ValueError('unknown preset: ' + preset)
    result = initial
    for patch in (read_json(ROOT / 'presets' / f'{preset}.json') if preset else {},
                  reference if reference is not None else {},
                  overrides if overrides is not None else {}):
        result = merge(result, patch, schema)
    result = validate(resolve_aliases(result))
    for path in locks:
        if lookup(baseline, path) != lookup(result, path):
            raise ValueError(f'locked token changed: {path}')
    return result


def contrast(foreground, background):
    def luminance(color):
        channels = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
        linear = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in channels]
        return sum(v * weight for v, weight in zip(linear, (0.2126, 0.7152, 0.0722)))
    light, dark = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


def audit(data):
    validate(data)
    pairs = [('onPrimary', 'primary', 4.5), ('onSecondary', 'secondary', 4.5),
             ('onSurface', 'surface', 4.5), ('onSurface', 'background', 4.5),
             ('muted', 'surface', 4.5), ('muted', 'background', 4.5),
             ('onError', 'error', 4.5), ('outline', 'surface', 3)]
    results = []
    for fg, bg, target in pairs:
        ratio = contrast(data['colors'][fg], data['colors'][bg])
        results.append(dict(foreground=fg, background=bg, ratio=round(ratio, 3),
                            minimum=target, passes=ratio >= target))
    return {'contrast': results, 'notChecked': ['rendering', 'componentUsage', 'pageStates',
                                               'interaction', 'responsiveLayout', 'imageOrAlphaBackgrounds']}


def dart_string(value):
    return "'" + value.replace('\\', '\\\\').replace("'", "\\'").replace('$', '\\$') + "'"


def flutter_theme(data):
    validate(data)
    def color(key):
        return 'Color(0xFF' + data['colors'][key][1:].upper() + ')'
    maps = {name: {key: float(value) for key, value in data[name].items() if type(value) in (int, float)}
            for name in ('spacing', 'radius', 'elevation', 'motion', 'layout', 'accessibility')}
    # Keep the whole spacing scale available without inventing a second schema.
    maps['spacing'].update({f'step{i}': float(v) for i, v in enumerate(data['spacing']['scale'])})
    role_map = {'display': 'displayLarge', 'headingLg': 'headlineLarge', 'headingMd': 'headlineMedium',
                'title': 'titleLarge', 'subtitle': 'titleMedium', 'body': 'bodyLarge',
                'bodySm': 'bodyMedium', 'caption': 'bodySmall'}
    styles = []
    for role, target in role_map.items():
        v = data['typography'][role]
        styles.append(f"      {target}: TextStyle(fontSize: {float(v['size'])}, height: {v['lineHeight']/v['size']:.8f}, fontWeight: FontWeight.w{int(v['weight'])}),")
    fields = '\n'.join(f'  final Map<String, double> {name};' for name in maps)
    params = ', '.join(f'required this.{name}' for name in maps)
    copy_params = ', '.join(f'Map<String, double>? {name}' for name in maps)
    copy_values = ', '.join(f'{name}: {name} ?? this.{name}' for name in maps)
    lerps = ',\n'.join(f'      {name}: _mix({name}, other.{name}, t)' for name in maps)
    values = ',\n'.join(f"      {name}: {{{', '.join(dart_string(k) + ': ' + str(v) for k, v in items.items())}}}" for name, items in maps.items())
    scheme = ',\n'.join(f'    {key}: {color(key)}' for key in ('primary','onPrimary','secondary','onSecondary','surface','onSurface','error','onError','outline'))
    return f'''// Generated from resolved tokens. Declare the font assets in pubspec.yaml.
// Unspecified Material color roles are seed-derived; review them if used.
import 'dart:ui' show lerpDouble;
import 'package:flutter/material.dart';

@immutable
class BdDesignTokens extends ThemeExtension<BdDesignTokens> {{
  const BdDesignTokens({{{params}}});
{fields}

  @override
  BdDesignTokens copyWith({{{copy_params}}}) => BdDesignTokens({copy_values});

  static Map<String, double> _mix(Map<String, double> a, Map<String, double> b, double t) => {{
    for (final key in {{...a.keys, ...b.keys}})
      key: lerpDouble(a[key] ?? b[key], b[key] ?? a[key], t)!,
  }};

  @override
  BdDesignTokens lerp(covariant BdDesignTokens? other, double t) {{
    if (other == null) return this;
    return BdDesignTokens(
{lerps},
    );
  }}
}}

ThemeData buildBdTheme() {{
  final scheme = ColorScheme.fromSeed(
    seedColor: {color('primary')}, brightness: Brightness.{data['appearance']},
{scheme},
    onSurfaceVariant: {color('muted')},
  );
  const tokens = BdDesignTokens(
{values},
  );
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: {dart_string(data['typography']['fontFamily'])},
    scaffoldBackgroundColor: {color('background')},
    materialTapTargetSize: MaterialTapTargetSize.padded,
    visualDensity: VisualDensity.standard,
  );
  final buttonStyle = ButtonStyle(
    minimumSize: WidgetStatePropertyAll(Size(tokens.accessibility['minTouchTarget']!, tokens.accessibility['minTouchTarget']!)),
    shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(tokens.radius['button']!))),
  );
  return base.copyWith(
    textTheme: base.textTheme.merge(const TextTheme(
{chr(10).join(styles)}
    )),
    extensions: <ThemeExtension<dynamic>>[tokens],
    filledButtonTheme: FilledButtonThemeData(style: buttonStyle),
    outlinedButtonTheme: OutlinedButtonThemeData(style: buttonStyle),
    textButtonTheme: TextButtonThemeData(style: buttonStyle),
    cardTheme: CardThemeData(
      color: scheme.surface, surfaceTintColor: Colors.transparent,
      elevation: tokens.elevation['card'],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(tokens.radius['card']!)),
    ),
  );
}}
'''


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    resolve_parser = commands.add_parser('resolve', help='Merge only supplied layers; keep an existing base.')
    resolve_parser.add_argument('--base', help='Complete existing token document; otherwise built-in Neutral.')
    resolve_parser.add_argument('--preset', choices=PRESETS)
    resolve_parser.add_argument('--reference')
    resolve_parser.add_argument('--overrides')
    resolve_parser.add_argument('--lock', action='append', default=[], help='Protected dot path; repeatable.')
    resolve_parser.add_argument('--out', required=True)
    for name in ('audit', 'theme'):
        command = commands.add_parser(name)
        command.add_argument('input')
        command.add_argument('--out', required=name == 'theme')
    args = parser.parse_args(argv)
    try:
        if args.command == 'resolve':
            data = resolve(base=read_json(args.base) if args.base else None, preset=args.preset,
                           reference=read_json(args.reference) if args.reference else None,
                           overrides=read_json(args.overrides) if args.overrides else None, locks=args.lock)
            output = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
            status = 0
        else:
            data = validate(resolve_aliases(read_json(args.input)))
            if args.command == 'audit':
                report = audit(data)
                output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
                status = int(any(not pair['passes'] for pair in report['contrast']))
            else:
                output, status = flutter_theme(data), 0
        if args.out:
            Path(args.out).parent.mkdir(parents=True, exist_ok=True)
            Path(args.out).write_text(output, encoding='utf-8')
        else:
            print(output, end='')
        return status
    except (OSError, ValueError, TypeError, RecursionError) as exc:
        print(f'tokens: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
