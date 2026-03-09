@DecisionTable @Regression
# Technique: Decision Table Testing
# Reference: ISTQB FL 4.4 – Decision Table Testing
#
# Conditions:
#   C1 – Star rating filter applied  (Y/N)
#   C2 – Free WiFi filter applied    (Y/N)
#   C3 – Breakfast included filter   (Y/N)
#
# Actions:
#   A1 – Results filtered by stars
#   A2 – Results filtered by WiFi
#   A3 – Results filtered by Breakfast
#
# Decision table (10 rules = 2^3 possible, reduced to 4 meaningful):
#   ┌────┬────┬────┬──────────────────────────────────────────────┐
#   │ C1 │ C2 │ C3 │ Expected outcome                             │
#   ├────┼────┼────┼──────────────────────────────────────────────┤
#   │  N │  N │  N │ All hotels shown (no filter)                 │
#   │  Y │  N │  N │ Only star-rated hotels                       │
#   │  N │  Y │  N │ Only WiFi hotels                             │
#   │  Y │  Y │  Y │ Only hotels matching all three filters       │
#   └────┴────┴────┴──────────────────────────────────────────────┘
Feature: Search Filters – Decision Table for Filter Combinations
  As a QA engineer
  I want to verify that each filter combination produces the correct result set
  So that the filter logic is validated without enumerating all 2^n permutations

  Background:
    Given I have searched for hotels in "Paris" from "2026-08-01" to "2026-08-05"

  # Rule 1 – No filters active ──────────────────────────────────────────────

  @DT-Rule1
  Scenario: No filters applied – all hotels are shown (baseline)
    Then I should see search results for "Paris" with availability

  # Rule 2 – Stars only ─────────────────────────────────────────────────────

  @DT-Rule2 @Smoke
  Scenario: Star rating filter alone narrows results to rated hotels
    When I apply filter "5 stars"
    Then I should see only 5-star hotel listings

  # Rule 3 – WiFi only ──────────────────────────────────────────────────────

  @DT-Rule3
  Scenario: Free WiFi filter alone narrows results to WiFi hotels
    When I apply filter "Free WiFi"
    Then the results should only include hotels matching those filters

  # Rule 4 – All three filters ──────────────────────────────────────────────

  @DT-Rule4 @Acceptance
  Scenario: Applying all three filters returns only hotels matching every condition
    When I apply filters: "Free WiFi", "Breakfast included", "4 stars"
    Then the results should only include hotels matching those filters
