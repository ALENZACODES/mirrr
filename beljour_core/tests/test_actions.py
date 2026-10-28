import unittest

from plumb_api import actions
from plumb_api.actions import ACTIONS, ActionError, build
from plumb_api.providers.youcam import STYLING, scope_of
from plumb_api.youcam import units


class ActionsTest(unittest.TestCase):
    def test_hair_colour(self):
        self.assertEqual(build("hair-color", {"color": "#8a3324"}),
                         ("hair-color", {"mode": "solid", "color": "#8A3324", "intensity": 80}))
        feature, payload = build("hair-color", {"mode": "ombre", "color": "#000000", "color_end": "#FFFFFF",
                                                "ombre_start": 30, "intensity": "55"})
        self.assertEqual(payload["color_end"], "#FFFFFF")
        self.assertEqual((payload["ombre_start"], payload["intensity"]), (30, 55))
        for bad in ({"color": "red"}, {"color": "#000000", "intensity": 101}, {"mode": "stripes", "color": "#000000"},
                    {"mode": "ombre", "color": "#000000"}, {"color": "#000000", "intensity": "lots"}):
            with self.assertRaises(ActionError, msg=str(bad)):
                build("hair-color", bad)

    def test_hair_style(self):
        self.assertEqual(build("hair-style", {"template_id": "tpl-low-fade"}), ("hair-style", {"template_id": "tpl-low-fade"}))
        for bad in ({}, {"template_id": "../etc"}, {"template_id": 5}, {"template_id": "x" * 81}):
            with self.assertRaises(ActionError):
                build("hair-style", bad)

    def test_strength_actions(self):
        self.assertEqual(build("hair-curl", {"strength": 40}), ("hair-curl", {"strength": 40}))
        self.assertEqual(build("hair-volume", {}), ("hair-volume", {"strength": 50}))
        with self.assertRaises(ActionError):
            build("hair-bang", {"strength": 0})

    def test_makeup_effects_are_validated(self):
        with self.assertRaises(ActionError):
            build("makeup", {"effects": []})
        with self.assertRaises(ActionError):
            build("unknown", {})

    def test_every_action_is_in_youcam_scope_and_priced(self):
        for name, action in ACTIONS.items():
            self.assertEqual(scope_of(action.feature), "styling", name)
            self.assertIn(action.feature, STYLING)
            self.assertIn(action.feature, units.FLAT_COSTS, name)

    def test_assumed_shapes_are_marked(self):
        self.assertFalse(ACTIONS["makeup"].assumed)
        self.assertTrue(all(a.assumed for n, a in ACTIONS.items() if n != "makeup"))
        self.assertTrue(ACTIONS["hair-style"].simulation)
        self.assertFalse(ACTIONS["hair-color"].simulation)
        self.assertTrue(actions.TEMPLATE_ID.match("tpl:1.a-b_c"))


if __name__ == "__main__":
    unittest.main()
