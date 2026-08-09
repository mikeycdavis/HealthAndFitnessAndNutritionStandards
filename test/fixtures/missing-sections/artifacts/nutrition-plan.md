# Nutrition plan — incomplete on purpose

A fixture plan whose Targets section names only energy, omits Adequacy and Restrictions entirely, and
carries an unmarked numeric value. The tests assert that the targets-incomplete, section-missing, and
value-provenance detectors each fire.

The two macronutrient names are deliberately absent below. Writing them even to say they are missing
would satisfy the detector's substring scan and destroy the fixture — the same use/mention trap the
naming-only fixture exists to cover.

## Targets

Energy: 2,000 kcal per day.
