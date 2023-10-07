from unittest.mock import MagicMock

import pytest
from reconnector_config import Config, OptionKeys


class TestConfig:
    @pytest.mark.parametrize(
        ("params", "expected_interval", "expected_uris"),
        [
            ({OptionKeys.CheckInterval: 120, OptionKeys.CustomUris: "[]"}, 120, {}),
            ({OptionKeys.CheckInterval: 60, OptionKeys.CustomUris: "[]"}, 60, {}),
            ({OptionKeys.CheckInterval: 1, OptionKeys.CustomUris: "[]"}, 1, {}),
            (
                {
                    OptionKeys.CheckInterval: 120,
                    OptionKeys.CustomUris: '["02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@'
                    '45.86.229.190:9736"]',
                },
                120,
                {
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018": "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736"
                },
            ),
            (
                {
                    OptionKeys.CheckInterval: 120,
                    OptionKeys.CustomUris: '["02D96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@'
                    '45.86.229.190:9736"]',
                },
                120,
                {
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018": "02D96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736"
                },
            ),
            (
                {
                    OptionKeys.CheckInterval: 120,
                    OptionKeys.CustomUris: "["
                    '"02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",'
                    '"026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@45.86.229.190:9735"'
                    "]",
                },
                120,
                {
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018": "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",
                    "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2": "026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@45.86.229.190:9735",
                },
            ),
            (
                {
                    OptionKeys.CheckInterval: 120,
                    OptionKeys.CustomUris: "["
                    '"02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",'
                    '"026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2"'
                    "]",
                },
                120,
                {
                    "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018": "02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018@45.86.229.190:9736",
                },
            ),
            (
                {
                    OptionKeys.CheckInterval: 1,
                    OptionKeys.CustomUris: '{"some": "otherData"}',
                },
                1,
                {},
            ),
            ({OptionKeys.CheckInterval: 1, OptionKeys.CustomUris: "notJson"}, 1, {}),
        ],
    )
    def test_parse(
        self,
        params: dict[str, str],
        expected_interval: int,
        expected_uris: dict[str, str],
    ) -> None:
        cfg = Config(MagicMock(), params)

        assert cfg.check_interval == expected_interval
        assert cfg.custom_uris == expected_uris
