"""Observable token resolution, diagnostics and export behavior; no live Figma calls."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import tokens


class TokenTests(unittest.TestCase):
    def test_all_presets_resolve_and_pass_declared_text_pairs(self):
        for name in ('neutral', 'minimal', 'soft', 'compact'):
            with self.subTest(name=name):
                result = tokens.resolve(preset=name)
                self.assertTrue(all(p['passes'] for p in tokens.audit(result)['contrast']))
                self.assertEqual(result['accessibility']['minTouchTarget'], 48)
        self.assertEqual(tokens.resolve()['spacing']['pageHorizontal'], 16)
        self.assertEqual(tokens.resolve(preset='soft')['radius']['card'], 20)

    def test_override_precedence_and_unrelated_values(self):
        result = tokens.resolve(preset='soft', reference={'colors': {'primary': '#123456'}},
                                overrides={'colors': {'primary': '#654321'}})
        self.assertEqual(result['colors']['primary'], '#654321')
        self.assertEqual(result['radius']['card'], 20)
        self.assertEqual(result['colors']['error'], tokens.resolve()['colors']['error'])

    def test_existing_project_is_not_reset_to_default(self):
        base = tokens.resolve(preset='compact')
        base['colors']['primary'] = '#123456'
        result = tokens.resolve(base=base, overrides={'radius': {'button': 14}})
        self.assertEqual(result['spacing']['pageHorizontal'], 12)
        self.assertEqual(result['colors']['primary'], '#123456')
        self.assertEqual(result['radius']['button'], 14)

    def test_aliases_resolve_after_all_layers(self):
        result = tokens.resolve(reference={'colors': {'secondary': '{colors.primary}'}},
                                overrides={'colors': {'primary': '#123456'}})
        self.assertEqual(result['colors']['secondary'], '#123456')

    def test_missing_and_circular_aliases(self):
        for patch in ({'primary': '{colors.missing}'},
                      {'primary': '{colors.secondary}', 'secondary': '{colors.primary}'}):
            with self.assertRaises(ValueError):
                tokens.resolve(overrides={'colors': patch})

    def test_unknown_keys_types_and_ranges_are_rejected(self):
        for patch in ({'unknown': 1}, {'colors': {'typo': '#123456'}}, {'radius': []},
                      {'radius': {'button': True}}, {'radius': {'card': -1}},
                      {'motion': {'fastMs': float('nan')}}, {'colors': {'primary': 'red'}},
                      {'typography': {'body': {'weight': 550}}},
                      {'typography': {'body': {'size': 32, 'lineHeight': 20}}},
                      {'layout': {'medium': 900, 'expanded': 800}},
                      {'spacing': {'scale': [4, 8, 8]}}, {'appearance': 'sepia'}):
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                tokens.resolve(overrides=patch)

    def test_reference_cannot_lower_usability_floor(self):
        for patch in ({'accessibility': {'minTouchTarget': 32}},
                      {'typography': {'body': {'size': 10}}}):
            with self.assertRaises(ValueError):
                tokens.resolve(reference=patch)

    def test_locks_include_changes_via_aliases(self):
        with self.assertRaisesRegex(ValueError, 'locked'):
            tokens.resolve(preset='soft', locks=['radius.card'])
        base = tokens.resolve()
        base['colors']['secondary'] = '{colors.primary}'
        with self.assertRaisesRegex(ValueError, 'locked'):
            tokens.resolve(base=base, overrides={'colors': {'primary': '#123456'}},
                           locks=['colors.secondary'])

    def test_no_mutation_of_input(self):
        base = tokens.resolve()
        original = copy.deepcopy(base)
        tokens.resolve(base=base, overrides={'colors': {'primary': '#123456'}})
        self.assertEqual(base, original)

    def test_known_contrast_and_low_contrast_findings(self):
        self.assertAlmostEqual(tokens.contrast('#000000', '#FFFFFF'), 21)
        self.assertAlmostEqual(tokens.contrast('#FFFFFF', '#FFFFFF'), 1)
        result = tokens.resolve(overrides={'colors': {'primary': '#FFFFFF'}})
        report = tokens.audit(result)
        self.assertFalse(next(p for p in report['contrast'] if p['foreground'] == 'onPrimary')['passes'])
        self.assertIn('rendering', report['notChecked'])

    def test_duplicate_json_keys_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory) / 'bad.json'
            p.write_text('{"colors": {}, "colors": {}}')
            with self.assertRaisesRegex(ValueError, 'duplicate'):
                tokens.read_json(p)

    def test_cli_and_theme_export(self):
        with tempfile.TemporaryDirectory() as directory:
            p = Path(directory)
            command = [sys.executable, str(Path(tokens.__file__))]
            result = subprocess.run(command + ['resolve', '--preset', 'minimal', '--out', str(p/'tokens.json')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            resolved = json.loads((p/'tokens.json').read_text())
            self.assertEqual(resolved['radius']['button'], 8)
            result = subprocess.run(command + ['theme', str(p/'tokens.json'), '--out', str(p/'theme.dart')], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            theme = (p/'theme.dart').read_text()
            self.assertIn('ThemeExtension<BdDesignTokens>', theme)
            self.assertIn('Color(0xFF18181B)', theme)
            self.assertIn('fontSize: 16.0', theme)
            self.assertIn("'pageHorizontal': 20.0", theme)
            result = subprocess.run(command + ['resolve', '--overrides', str(p/'missing.json'), '--out', str(p/'absent.json')], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((p/'absent.json').exists())

    def test_dart_string_escape(self):
        result = tokens.resolve(overrides={'typography': {'fontFamily': "Bob's $font\\name"}})
        self.assertIn(r"Bob\'s \$font\\name", tokens.flutter_theme(result))


if __name__ == '__main__':
    unittest.main()
