@BVA @Regression
# Technique: Boundary Value Analysis (BVA)
# Reference: ISTQB FL 4.2 – Boundary Value Analysis
#
# Rule: The number of adults must be between 1 and 30 (inclusive).
# Boundaries under test:
#   ┌─────────────────────────────────────────────────────────────┐
#   │  Invalid │ Min │  Valid range   │ Max │ Invalid             │
#   │    0     │  1  │  2 … 29        │ 30  │  31                 │
#   └─────────────────────────────────────────────────────────────┘
Feature: Hotel Search – Boundary Value Analysis on Guest Count
  As a QA engineer
  I want to verify search behaviour at the exact edges of the allowed guest count
  So that invalid inputs are rejected and valid boundaries are accepted

  Background:
    Given I open the Booking.com homepage

  # ── Valid boundaries ──────────────────────────────────────────────────────

  @BVA-Valid
  Scenario Outline: Valid adult counts at boundaries return search results
    When I search for hotels in "Paris" from "2026-07-01" to "2026-07-05" for "<adults>" adults
    Then I should see search results for "Paris" with availability

    Examples: Minimum and maximum valid boundaries
      | adults | boundary      |
      | 1      | min (valid)   |
      | 2      | min + 1       |
      | 29     | max - 1       |
      | 30     | max (valid)   |

  # ── Invalid boundaries ────────────────────────────────────────────────────

  @BVA-Invalid
  Scenario Outline: Invalid adult counts outside boundaries show a validation error
    When I search for hotels in "Paris" from "2026-07-01" to "2026-07-05" for "<adults>" adults
    Then I should see a validation error message

    Examples: Below minimum and above maximum boundaries
      | adults | boundary       |
      | 0      | below min      |
      | 31     | above max      |

  # ── Stay-duration BVA ────────────────────────────────────────────────────
  # Rule: Stay must be at least 1 night, maximum 30 nights.

  @BVA-Valid
  Scenario Outline: Valid stay durations at boundaries return results
    When I search for hotels in "London" from "<checkin>" to "<checkout>" for "2" adults
    Then I should see search results for "London" with availability

    Examples: Minimum and maximum valid stay durations
      | checkin     | checkout    | nights | boundary    |
      | 2026-07-01  | 2026-07-02  | 1      | min (valid) |
      | 2026-07-01  | 2026-07-31  | 30     | max (valid) |

  @BVA-Invalid
  Scenario: Check-out date same as check-in (0 nights) shows validation error
    When I search for hotels in "London" from "2026-07-01" to "2026-07-01" for "2" adults
    Then I should see a validation error message
